/**
 * Database Layer for Users, Balances, and Real-time P2P Transactions.
 * Powered by Firebase Firestore (Admin SDK) with robust in-memory backup.
 */

import { adminDb } from "./admin";
import { analyzeTransaction, FraudAnalysisResult } from "../ml/fraudDetector";

export interface BankUser {
  id: string;
  name: string;
  email: string;
  password?: string;
  accountNumber: string;
  balance: number;
  avgAmount: number;
  isOnline: boolean;
  lastActive: string;
  deviceType: "MOBILE" | "DESKTOP";
}

export interface BankTransaction {
  id: string;
  type: "TRANSFER" | "REQUEST";
  senderId: string;
  senderName: string;
  recipientId: string;
  recipientName: string;
  amount: number;
  hour: number;
  minute: number;
  memoText: string;
  isNewRecipient: boolean;
  isNewDevice: boolean;
  isForeignIp: boolean;
  fraudAnalysis?: FraudAnalysisResult;
  status: "APPROVED" | "REQUIRES_2FA" | "BLOCKED" | "PENDING_REQUEST" | "DECLINED";
  createdAt: string;
}

// Default pre-seeded bank clients
const INITIAL_USERS: BankUser[] = [
  {
    id: "usr_alice",
    name: "Алиса Смирнова",
    email: "alice@finforcing.kz",
    password: "password123",
    accountNumber: "KZ49 0401 9283 1001",
    balance: 1450000,
    avgAmount: 65000,
    isOnline: true,
    lastActive: new Date().toISOString(),
    deviceType: "DESKTOP"
  },
  {
    id: "usr_boris",
    name: "Борис Иванов",
    email: "boris@finforcing.kz",
    password: "password123",
    accountNumber: "KZ88 0401 5472 9002",
    balance: 820000,
    avgAmount: 45000,
    isOnline: true,
    lastActive: new Date().toISOString(),
    deviceType: "MOBILE"
  },
  {
    id: "usr_kasym",
    name: "Касым Жомарт",
    email: "kasym@finforcing.kz",
    password: "password123",
    accountNumber: "KZ12 0401 7719 3003",
    balance: 2300000,
    avgAmount: 110000,
    isOnline: false,
    lastActive: new Date().toISOString(),
    deviceType: "MOBILE"
  }
];

let memoryUsers: BankUser[] = [...INITIAL_USERS];
let memoryTransactions: BankTransaction[] = [];

export class BankDatabase {
  /**
   * Initialize Firestore collections if empty
   */
  public static async initDatabase(): Promise<void> {
    if (!adminDb) return;
    try {
      const snap = await adminDb.collection("bank_users").limit(1).get();
      if (snap.empty) {
        console.log("[Firestore] Seeding initial bank accounts...");
        const batch = adminDb.batch();
        for (const user of INITIAL_USERS) {
          const docRef = adminDb.collection("bank_users").doc(user.id);
          batch.set(docRef, user);
        }
        await batch.commit();
        console.log("[Firestore] Bank accounts seeded successfully.");
      }
    } catch (e) {
      console.warn("[Firestore] Init note:", e);
    }
  }

  /**
   * Get all registered users
   */
  public static async getUsers(): Promise<BankUser[]> {
    if (adminDb) {
      try {
        const snap = await adminDb.collection("bank_users").orderBy("name").get();
        if (!snap.empty) {
          return snap.docs.map((d) => d.data() as BankUser);
        }
      } catch (err) {
        console.warn("[Firestore] Fallback to memory for getUsers:", err);
      }
    }
    return memoryUsers;
  }

  /**
   * Get user by ID
   */
  public static async getUserById(id: string): Promise<BankUser | null> {
    if (adminDb) {
      try {
        const doc = await adminDb.collection("bank_users").doc(id).get();
        if (doc.exists) {
          return doc.data() as BankUser;
        }
      } catch (err) {
        console.warn("[Firestore] Fallback to memory for getUserById:", err);
      }
    }
    return memoryUsers.find((u) => u.id === id) || null;
  }

  /**
   * Register a new bank client
   */
  public static async registerUser(params: {
    name: string;
    email: string;
    password?: string;
    initialBalance?: number;
    deviceType?: "MOBILE" | "DESKTOP";
  }): Promise<BankUser> {
    const id = `usr_${Date.now()}`;
    const cleanNum = Math.floor(1000 + Math.random() * 9000);
    const balance = params.initialBalance !== undefined ? params.initialBalance : 500000;

    const newUser: BankUser = {
      id,
      name: params.name.trim(),
      email: params.email.trim().toLowerCase(),
      password: params.password || "password123",
      accountNumber: `KZ${Math.floor(10 + Math.random() * 89)} 0401 ${cleanNum} ${Math.floor(1000 + Math.random() * 9000)}`,
      balance,
      avgAmount: Math.round(balance * 0.12),
      isOnline: true,
      lastActive: new Date().toISOString(),
      deviceType: params.deviceType || "DESKTOP"
    };

    if (adminDb) {
      try {
        await adminDb.collection("bank_users").doc(id).set(newUser);
      } catch (err) {
        console.warn("[Firestore] Save user fallback to memory:", err);
      }
    }

    memoryUsers.unshift(newUser);
    return newUser;
  }

  /**
   * Authenticate user by email or name
   */
  public static async authenticate(identifier: string, password?: string): Promise<BankUser | null> {
    const cleanId = identifier.trim().toLowerCase();
    const users = await this.getUsers();
    const matched = users.find(
      (u) =>
        u.email.toLowerCase() === cleanId ||
        u.name.toLowerCase() === cleanId ||
        u.id.toLowerCase() === cleanId
    );

    if (matched) {
      if (password && matched.password && matched.password !== password) {
        return null;
      }

      // Mark as online
      matched.isOnline = true;
      matched.lastActive = new Date().toISOString();
      if (adminDb) {
        try {
          await adminDb.collection("bank_users").doc(matched.id).update({
            isOnline: true,
            lastActive: matched.lastActive
          });
        } catch {}
      }
      return matched;
    }
    return null;
  }

  /**
   * Update User online activity
   */
  public static async updateActivity(userId: string, isOnline = true): Promise<void> {
    const user = await this.getUserById(userId);
    if (user) {
      user.isOnline = isOnline;
      user.lastActive = new Date().toISOString();
      if (adminDb) {
        try {
          await adminDb.collection("bank_users").doc(userId).update({
            isOnline,
            lastActive: user.lastActive
          });
        } catch {}
      }
    }
  }

  /**
   * Execute P2P Transfer with Anti-Fraud Scoring
   */
  public static async executeTransfer(params: {
    senderId: string;
    recipientId: string;
    amount: number;
    hour: number;
    minute: number;
    memoText: string;
    isNewRecipient: boolean;
    isNewDevice: boolean;
    isForeignIp: boolean;
  }): Promise<BankTransaction> {
    const sender = (await this.getUserById(params.senderId)) || memoryUsers[0];
    const recipient = (await this.getUserById(params.recipientId)) || memoryUsers[1];

    // 1. Run Machine Learning Fraud Inference Engine
    const analysis = analyzeTransaction({
      amount: params.amount,
      hour: params.hour,
      minute: params.minute,
      transactionType: "P2P_TRANSFER",
      senderBalanceBefore: sender.balance,
      senderAvgAmount: sender.avgAmount,
      isNewRecipient: params.isNewRecipient,
      velocityLast24h: 1,
      isNewDevice: params.isNewDevice,
      isForeignIp: params.isForeignIp,
      memoText: params.memoText,
      senderId: sender.id,
      recipientId: recipient.id
    });

    let status: "APPROVED" | "REQUIRES_2FA" | "BLOCKED" = "APPROVED";
    if (analysis.riskLevel === "HIGH") {
      status = "BLOCKED";
    } else if (analysis.riskLevel === "MEDIUM") {
      status = "REQUIRES_2FA";
    } else {
      // Deduct sender balance and credit recipient balance
      sender.balance = Math.max(0, sender.balance - params.amount);
      recipient.balance += params.amount;

      if (adminDb) {
        try {
          const batch = adminDb.batch();
          batch.update(adminDb.collection("bank_users").doc(sender.id), {
            balance: sender.balance,
            lastActive: new Date().toISOString()
          });
          batch.update(adminDb.collection("bank_users").doc(recipient.id), {
            balance: recipient.balance,
            lastActive: new Date().toISOString()
          });
          await batch.commit();
        } catch (err) {
          console.warn("[Firestore] Balance update fallback to memory:", err);
        }
      }
    }

    const txRecord: BankTransaction = {
      id: `TXN-${Date.now().toString().slice(-6)}`,
      type: "TRANSFER",
      senderId: sender.id,
      senderName: sender.name,
      recipientId: recipient.id,
      recipientName: recipient.name,
      amount: params.amount,
      hour: params.hour,
      minute: params.minute,
      memoText: params.memoText,
      isNewRecipient: params.isNewRecipient,
      isNewDevice: params.isNewDevice,
      isForeignIp: params.isForeignIp,
      fraudAnalysis: analysis,
      status,
      createdAt: new Date().toISOString()
    };

    if (adminDb) {
      try {
        await adminDb.collection("bank_transactions").doc(txRecord.id).set(txRecord);
      } catch (err) {
        console.warn("[Firestore] Transaction save fallback to memory:", err);
      }
    }

    memoryTransactions.unshift(txRecord);
    return txRecord;
  }

  /**
   * Create a Test Payment Request (Requester asks target user to send funds)
   */
  public static async createPaymentRequest(params: {
    requesterId: string;
    payerId: string;
    amount: number;
    memoText?: string;
  }): Promise<BankTransaction> {
    const requester = (await this.getUserById(params.requesterId)) || memoryUsers[0];
    const payer = (await this.getUserById(params.payerId)) || memoryUsers[1];

    const now = new Date();
    const txRecord: BankTransaction = {
      id: `REQ-${Date.now().toString().slice(-6)}`,
      type: "REQUEST",
      senderId: payer.id, // Who will pay
      senderName: payer.name,
      recipientId: requester.id, // Who will receive
      recipientName: requester.name,
      amount: params.amount,
      hour: now.getHours(),
      minute: now.getMinutes(),
      memoText: params.memoText || "Тестовый запрос на перевод",
      isNewRecipient: false,
      isNewDevice: false,
      isForeignIp: false,
      status: "PENDING_REQUEST",
      createdAt: now.toISOString()
    };

    if (adminDb) {
      try {
        await adminDb.collection("bank_transactions").doc(txRecord.id).set(txRecord);
      } catch (err) {
        console.warn("[Firestore] Request save fallback to memory:", err);
      }
    }

    memoryTransactions.unshift(txRecord);
    return txRecord;
  }

  /**
   * Fulfill a Payment Request (Payer pays the requested funds)
   */
  public static async fulfillPaymentRequest(params: {
    requestId: string;
    payerId: string;
  }): Promise<BankTransaction> {
    let tx: BankTransaction | undefined;
    if (adminDb) {
      try {
        const doc = await adminDb.collection("bank_transactions").doc(params.requestId).get();
        if (doc.exists) {
          tx = doc.data() as BankTransaction;
        }
      } catch {}
    }
    if (!tx) {
      tx = memoryTransactions.find((t) => t.id === params.requestId);
    }
    if (!tx) throw new Error("Запрос не найден");

    const payer = await this.getUserById(params.payerId);
    const recipient = await this.getUserById(tx.recipientId);
    if (!payer || !recipient) throw new Error("Пользователи не найдены");

    if (payer.balance < tx.amount) {
      throw new Error("Недостаточно средств на балансе");
    }

    const now = new Date();
    const analysis = analyzeTransaction({
      amount: tx.amount,
      hour: now.getHours(),
      minute: now.getMinutes(),
      transactionType: "P2P_TRANSFER",
      senderBalanceBefore: payer.balance,
      senderAvgAmount: payer.avgAmount,
      isNewRecipient: false,
      velocityLast24h: 1,
      isNewDevice: false,
      isForeignIp: false,
      memoText: `Оплата запроса: ${tx.memoText}`,
      senderId: payer.id,
      recipientId: recipient.id
    });

    tx.fraudAnalysis = analysis;
    if (analysis.riskLevel === "HIGH") {
      tx.status = "BLOCKED";
    } else if (analysis.riskLevel === "MEDIUM") {
      tx.status = "REQUIRES_2FA";
    } else {
      tx.status = "APPROVED";
      payer.balance -= tx.amount;
      recipient.balance += tx.amount;

      if (adminDb) {
        try {
          const batch = adminDb.batch();
          batch.update(adminDb.collection("bank_users").doc(payer.id), {
            balance: payer.balance,
            lastActive: new Date().toISOString()
          });
          batch.update(adminDb.collection("bank_users").doc(recipient.id), {
            balance: recipient.balance,
            lastActive: new Date().toISOString()
          });
          await batch.commit();
        } catch {}
      }
    }

    if (adminDb) {
      try {
        await adminDb.collection("bank_transactions").doc(tx.id).set(tx);
      } catch {}
    }

    return tx;
  }

  /**
   * Decline a Payment Request
   */
  public static async declinePaymentRequest(requestId: string): Promise<BankTransaction> {
    let tx: BankTransaction | undefined;
    if (adminDb) {
      try {
        const doc = await adminDb.collection("bank_transactions").doc(requestId).get();
        if (doc.exists) {
          tx = doc.data() as BankTransaction;
        }
      } catch {}
    }
    if (!tx) {
      tx = memoryTransactions.find((t) => t.id === requestId);
    }
    if (!tx) throw new Error("Запрос не найден");

    tx.status = "DECLINED";
    if (adminDb) {
      try {
        await adminDb.collection("bank_transactions").doc(requestId).update({ status: "DECLINED" });
      } catch {}
    }
    return tx;
  }

  /**
   * Confirm 2FA transaction
   */
  public static async confirm2FATransfer(txId: string): Promise<BankTransaction> {
    let tx: BankTransaction | undefined;
    if (adminDb) {
      try {
        const doc = await adminDb.collection("bank_transactions").doc(txId).get();
        if (doc.exists) {
          tx = doc.data() as BankTransaction;
        }
      } catch {}
    }
    if (!tx) {
      tx = memoryTransactions.find((t) => t.id === txId);
    }
    if (!tx) throw new Error("Транзакция не найдена");

    const sender = await this.getUserById(tx.senderId);
    const recipient = await this.getUserById(tx.recipientId);
    if (!sender || !recipient) throw new Error("Пользователи не найдены");

    sender.balance = Math.max(0, sender.balance - tx.amount);
    recipient.balance += tx.amount;
    tx.status = "APPROVED";

    if (adminDb) {
      try {
        const batch = adminDb.batch();
        batch.update(adminDb.collection("bank_users").doc(sender.id), {
          balance: sender.balance,
          lastActive: new Date().toISOString()
        });
        batch.update(adminDb.collection("bank_users").doc(recipient.id), {
          balance: recipient.balance,
          lastActive: new Date().toISOString()
        });
        batch.update(adminDb.collection("bank_transactions").doc(tx.id), {
          status: "APPROVED"
        });
        await batch.commit();
      } catch {}
    }

    return tx;
  }

  /**
   * Get transactions history
   */
  public static async getTransactions(limitCount = 40): Promise<BankTransaction[]> {
    if (adminDb) {
      try {
        const snap = await adminDb
          .collection("bank_transactions")
          .orderBy("createdAt", "desc")
          .limit(limitCount)
          .get();

        if (!snap.empty) {
          return snap.docs.map((d) => d.data() as BankTransaction);
        }
      } catch (err) {
        console.warn("[Firestore] Fallback to memory for transactions:", err);
      }
    }
    return memoryTransactions.slice(0, limitCount);
  }
}
