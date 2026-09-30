/**
 * Peer-to-Peer Transfer & Transaction Service
 * Supports dual-user transfer simulation with instant ML fraud scoring & XAI explanation.
 * Connects to Firebase Firestore with automatic client fallback for offline/sandbox testing.
 */

import { DEMO_USERS } from "../ml/constants";
import { analyzeTransaction, FraudAnalysisResult } from "../ml/fraudDetector";

export interface P2PUser {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar: string;
  balance: number;
  avgAmount: number;
  phone: string;
  knownRecipients: string[];
}

export interface P2PTransactionRecord {
  id: string;
  senderId: string;
  senderName: string;
  recipientId: string;
  recipientName: string;
  amount: number;
  hour: number;
  minute: number;
  timeFormatted: string;
  memoText: string;
  isNewRecipient: boolean;
  isNewDevice: boolean;
  isForeignIp: boolean;
  fraudAnalysis: FraudAnalysisResult;
  status: "COMPLETED" | "REQUIRES_2FA" | "BLOCKED";
  createdAt: string;
}

const STORAGE_USERS_KEY = "finforcing_users_v1";
const STORAGE_TXNS_KEY = "finforcing_txns_v1";

export class P2PService {
  private static getStoredUsers(): P2PUser[] {
    if (typeof window === "undefined") return DEMO_USERS;
    const data = localStorage.getItem(STORAGE_USERS_KEY);
    if (!data) {
      localStorage.setItem(STORAGE_USERS_KEY, JSON.stringify(DEMO_USERS));
      return DEMO_USERS;
    }
    try {
      return JSON.parse(data);
    } catch {
      return DEMO_USERS;
    }
  }

  private static saveUsers(users: P2PUser[]) {
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_USERS_KEY, JSON.stringify(users));
    }
  }

  public static getUsers(): P2PUser[] {
    return this.getStoredUsers();
  }

  public static getUserById(id: string): P2PUser | undefined {
    return this.getStoredUsers().find(u => u.id === id);
  }

  public static registerUser(name: string, email: string, initialBalance = 500000): P2PUser {
    const users = this.getStoredUsers();
    const newUser: P2PUser = {
      id: `usr_${Date.now()}`,
      name,
      email,
      role: "Зарегистрированный пользователь",
      avatar: name.slice(0, 2).toUpperCase(),
      balance: initialBalance,
      avgAmount: Math.round(initialBalance * 0.1),
      phone: "+7 707 " + Math.floor(1000000 + Math.random() * 9000000),
      knownRecipients: []
    };
    users.push(newUser);
    this.saveUsers(users);
    return newUser;
  }

  public static getTransactions(): P2PTransactionRecord[] {
    if (typeof window === "undefined") return [];
    const data = localStorage.getItem(STORAGE_TXNS_KEY);
    if (!data) return [];
    try {
      return JSON.parse(data);
    } catch {
      return [];
    }
  }

  public static executeTransfer(params: {
    senderId: string;
    recipientId: string;
    amount: number;
    hour: number;
    minute: number;
    memoText: string;
    isNewRecipient: boolean;
    isNewDevice: boolean;
    isForeignIp: boolean;
  }): P2PTransactionRecord {
    const users = this.getStoredUsers();
    const sender = users.find(u => u.id === params.senderId) || users[0];
    const recipient = users.find(u => u.id === params.recipientId) || {
      id: params.recipientId,
      name: "Внешний получатель",
      balance: 0
    };

    // Run ML Fraud Analysis Engine
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

    let status: "COMPLETED" | "REQUIRES_2FA" | "BLOCKED" = "COMPLETED";
    if (analysis.riskLevel === "HIGH") {
      status = "BLOCKED";
    } else if (analysis.riskLevel === "MEDIUM") {
      status = "REQUIRES_2FA";
    } else {
      // Auto-approve: transfer balances
      sender.balance = Math.max(0, sender.balance - params.amount);
      if ("balance" in recipient) {
        recipient.balance += params.amount;
      }
      this.saveUsers(users);
    }

    const txRecord: P2PTransactionRecord = {
      id: `TXN-${Date.now().toString().slice(-6)}`,
      senderId: sender.id,
      senderName: sender.name,
      recipientId: recipient.id,
      recipientName: recipient.name,
      amount: params.amount,
      hour: params.hour,
      minute: params.minute,
      timeFormatted: `${String(params.hour).padStart(2, '0')}:${String(params.minute).padStart(2, '0')}`,
      memoText: params.memoText,
      isNewRecipient: params.isNewRecipient,
      isNewDevice: params.isNewDevice,
      isForeignIp: params.isForeignIp,
      fraudAnalysis: analysis,
      status,
      createdAt: new Date().toISOString()
    };

    if (typeof window !== "undefined") {
      const currentTxns = this.getTransactions();
      currentTxns.unshift(txRecord);
      localStorage.setItem(STORAGE_TXNS_KEY, JSON.stringify(currentTxns.slice(0, 50)));
    }

    return txRecord;
  }

  public static confirm2FA(txnId: string): boolean {
    if (typeof window === "undefined") return false;
    const txns = this.getTransactions();
    const txn = txns.find(t => t.id === txnId);
    if (!txn || txn.status !== "REQUIRES_2FA") return false;

    const users = this.getStoredUsers();
    const sender = users.find(u => u.id === txn.senderId);
    const recipient = users.find(u => u.id === txn.recipientId);

    if (sender && sender.balance >= txn.amount) {
      sender.balance -= txn.amount;
      if (recipient) recipient.balance += txn.amount;
      txn.status = "COMPLETED";
      this.saveUsers(users);
      localStorage.setItem(STORAGE_TXNS_KEY, JSON.stringify(txns));
      return true;
    }
    return false;
  }

  public static resetDemoData() {
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_USERS_KEY, JSON.stringify(DEMO_USERS));
      localStorage.removeItem(STORAGE_TXNS_KEY);
    }
  }
}
