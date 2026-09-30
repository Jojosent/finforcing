"use client";

import { useState, useEffect, useMemo } from "react";
import {
  ArrowRightLeft,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  Clock,
  Send,
  RefreshCw,
  CheckCircle2,
  XCircle,
  KeyRound,
  Radio,
  FileText,
  User,
  Activity,
  CreditCard,
  ArrowUpRight,
  ArrowDownLeft,
  Bell,
  HelpCircle,
  LogIn
} from "lucide-react";
import { BankUser, BankTransaction } from "@/lib/firebase/db";
import { analyzeTransaction, FraudAnalysisResult } from "@/lib/ml/fraudDetector";

export default function P2PTransferPage() {
  const [currentUser, setCurrentUser] = useState<BankUser | null>(null);
  const [users, setUsers] = useState<BankUser[]>([]);
  const [recipientId, setRecipientId] = useState<string>("");

  // Operation Tab: "TRANSFER" | "REQUEST"
  const [operationTab, setOperationTab] = useState<"TRANSFER" | "REQUEST">("TRANSFER");

  // Transfer Parameters
  const [amount, setAmount] = useState<number>(850000);
  const [hour, setHour] = useState<number>(2);
  const [minute, setMinute] = useState<number>(43);
  const [memoText, setMemoText] = useState<string>("Срочный перевод без комиссии");
  const [isNewRecipient, setIsNewRecipient] = useState<boolean>(true);
  const [isNewDevice, setIsNewDevice] = useState<boolean>(true);
  const [isForeignIp, setIsForeignIp] = useState<boolean>(false);

  // Test Request Parameters
  const [requestPayerId, setRequestPayerId] = useState<string>("");
  const [requestAmount, setRequestAmount] = useState<number>(50000);
  const [requestMemo, setRequestMemo] = useState<string>("Тестовый запрос с устройства");

  // Live Risk Calculation
  const [liveRisk, setLiveRisk] = useState<FraudAnalysisResult | null>(null);

  // Transactions History & Polling
  const [history, setHistory] = useState<BankTransaction[]>([]);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // 2FA Verification Modal
  const [pending2FATxn, setPending2FATxn] = useState<BankTransaction | null>(null);
  const [enteredOtp, setEnteredOtp] = useState<string>("");
  const [otpError, setOtpError] = useState<string>("");

  // Toast status banner
  const [bannerAlert, setBannerAlert] = useState<{
    title: string;
    desc: string;
    isError: boolean;
  } | null>(null);

  // Track latest transaction id to trigger sound/alert on incoming
  const [lastKnownTxId, setLastKnownTxId] = useState<string>("");

  useEffect(() => {
    // 1. Initial user load from localStorage
    const saved = localStorage.getItem("finforcing_session_user");
    if (saved) {
      try {
        const u = JSON.parse(saved);
        setCurrentUser(u);
      } catch {}
    }

    fetchUsers();
    fetchTransactions();

    // 2. Real-time polling every 2.5 seconds
    const interval = setInterval(() => {
      fetchUsers();
      fetchTransactions();
      // Sync currentUser balance if logged in
      const current = localStorage.getItem("finforcing_session_user");
      if (current) {
        try {
          const u = JSON.parse(current);
          fetch(`/api/auth/me?userId=${u.id}`)
            .then((r) => r.json())
            .then((data) => {
              if (data.success && data.user) {
                setCurrentUser(data.user);
                localStorage.setItem("finforcing_session_user", JSON.stringify(data.user));
              }
            })
            .catch(() => {});
        } catch {}
      }
    }, 2500);

    const onUserChanged = () => {
      const current = localStorage.getItem("finforcing_session_user");
      if (current) {
        try {
          setCurrentUser(JSON.parse(current));
        } catch {}
      } else {
        setCurrentUser(null);
      }
      fetchUsers();
    };

    window.addEventListener("finforcing_user_changed", onUserChanged);

    return () => {
      clearInterval(interval);
      window.removeEventListener("finforcing_user_changed", onUserChanged);
    };
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await fetch("/api/users");
      const data = await res.json();
      if (data.users && data.users.length > 0) {
        setUsers(data.users);
      }
    } catch {}
  };

  const fetchTransactions = async () => {
    try {
      const res = await fetch("/api/p2p/transactions");
      const data = await res.json();
      if (data.transactions) {
        setHistory(data.transactions);
      }
    } catch {}
  };

  // Other users available for interaction
  const otherUsers = useMemo(() => {
    if (!currentUser) return users;
    return users.filter((u) => u.id !== currentUser.id);
  }, [users, currentUser]);

  // Set default recipient and request payer
  useEffect(() => {
    if (otherUsers.length > 0) {
      if (!recipientId || !otherUsers.find((u) => u.id === recipientId)) {
        setRecipientId(otherUsers[0].id);
      }
      if (!requestPayerId || !otherUsers.find((u) => u.id === requestPayerId)) {
        setRequestPayerId(otherUsers[0].id);
      }
    }
  }, [otherUsers]);

  // Re-calculate live fraud risk whenever any parameter changes
  useEffect(() => {
    if (!currentUser) return;
    const recipient = users.find((u) => u.id === recipientId);
    const res = analyzeTransaction({
      amount,
      hour,
      minute,
      transactionType: "P2P_TRANSFER",
      senderBalanceBefore: currentUser.balance,
      senderAvgAmount: currentUser.avgAmount,
      isNewRecipient,
      velocityLast24h: hour < 6 ? 3 : 1,
      isNewDevice,
      isForeignIp,
      memoText,
      senderId: currentUser.id,
      recipientId: recipient?.id
    });
    setLiveRisk(res);
  }, [amount, hour, minute, isNewRecipient, isNewDevice, isForeignIp, memoText, currentUser, recipientId, users]);

  // Check incoming test requests for current user
  const incomingRequests = useMemo(() => {
    if (!currentUser) return [];
    return history.filter(
      (tx) =>
        tx.type === "REQUEST" &&
        tx.senderId === currentUser.id && // senderId is who pays
        tx.status === "PENDING_REQUEST"
    );
  }, [history, currentUser]);

  // Execute Direct P2P Transfer
  const handleExecuteTransfer = async () => {
    if (!currentUser) {
      alert("Пожалуйста, выполните вход в систему");
      return;
    }
    if (!recipientId) {
      alert("Выберите получателя перевода");
      return;
    }
    if (amount <= 0) {
      alert("Укажите корректную сумму");
      return;
    }
    if (amount > currentUser.balance) {
      alert("Недостаточно средств на вашем счете");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/p2p/transfer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          senderId: currentUser.id,
          recipientId,
          amount,
          hour,
          minute,
          memoText,
          isNewRecipient,
          isNewDevice,
          isForeignIp
        })
      });

      const data = await res.json();
      setIsSubmitting(false);

      if (data.success && data.transaction) {
        const tx: BankTransaction = data.transaction;
        fetchUsers();
        fetchTransactions();

        if (tx.status === "APPROVED") {
          setBannerAlert({
            title: `ТРАНЗАКЦИЯ ${tx.id} УСПЕШНО ИСПОЛНЕНА`,
            desc: `Списано ${tx.amount.toLocaleString()} ₸ получателю ${tx.recipientName}. Риск-скор: ${tx.fraudAnalysis?.fraudRiskScore}% (LOW RISK). Операция одобрена.`,
            isError: false
          });
        } else if (tx.status === "REQUIRES_2FA") {
          setPending2FATxn(tx);
        } else {
          setBannerAlert({
            title: `ТРАНЗАКЦИЯ ${tx.id} ЗАБЛОКИРОВАНА АНТИФРОДОМ`,
            desc: `Высокий риск мошенничества (${tx.fraudAnalysis?.fraudRiskScore}%). Подозрительная операция остановлена, ваши средства сохранены на балансе.`,
            isError: true
          });
        }
      } else {
        alert(data.error || "Ошибка проведения платежа");
      }
    } catch (err: any) {
      setIsSubmitting(false);
      alert("Сетевая ошибка: " + err.message);
    }
  };

  // Send Test Request (Request money from another user)
  const handleSendTestRequest = async () => {
    if (!currentUser) {
      alert("Пожалуйста, выполните вход в систему");
      return;
    }
    if (!requestPayerId) {
      alert("Выберите пользователя для отправки тест-запроса");
      return;
    }
    if (requestAmount <= 0) {
      alert("Укажите сумму запроса");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/p2p/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requesterId: currentUser.id,
          payerId: requestPayerId,
          amount: requestAmount,
          memoText: requestMemo
        })
      });

      const data = await res.json();
      setIsSubmitting(false);

      if (data.success && data.transaction) {
        fetchTransactions();
        setBannerAlert({
          title: `ТЕСТ-ЗАПРОС ${data.transaction.id} ОТПРАВЛЕН`,
          desc: `Запрос на сумму ${data.transaction.amount.toLocaleString()} ₸ успешно доставлен пользователю ${data.transaction.senderName}.`,
          isError: false
        });
      } else {
        alert(data.error || "Ошибка отправки запроса");
      }
    } catch (err: any) {
      setIsSubmitting(false);
      alert("Ошибка сети: " + err.message);
    }
  };

  // Fulfill Incoming Test Request (Pay the request)
  const handleFulfillRequest = async (requestId: string) => {
    if (!currentUser) return;
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/p2p/request", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requestId,
          payerId: currentUser.id,
          action: "FULFILL"
        })
      });

      const data = await res.json();
      setIsSubmitting(false);

      if (data.success && data.transaction) {
        const tx: BankTransaction = data.transaction;
        fetchUsers();
        fetchTransactions();

        if (tx.status === "APPROVED") {
          setBannerAlert({
            title: `ЗАПРОС ${tx.id} ОПЛАЧЕН`,
            desc: `Списано ${tx.amount.toLocaleString()} ₸ в пользу ${tx.recipientName}. Риск: ${tx.fraudAnalysis?.fraudRiskScore}%.`,
            isError: false
          });
        } else if (tx.status === "REQUIRES_2FA") {
          setPending2FATxn(tx);
        } else {
          setBannerAlert({
            title: `ОПЛАТА ЗАПРОСА ${tx.id} ЗАБЛОКИРОВАНА`,
            desc: `Высокий уровень риска антифрода (${tx.fraudAnalysis?.fraudRiskScore}%).`,
            isError: true
          });
        }
      } else {
        alert(data.error || "Ошибка оплаты запроса");
      }
    } catch (err: any) {
      setIsSubmitting(false);
      alert("Ошибка: " + err.message);
    }
  };

  // Decline Incoming Test Request
  const handleDeclineRequest = async (requestId: string) => {
    try {
      const res = await fetch("/api/p2p/request", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requestId,
          action: "DECLINE"
        })
      });
      const data = await res.json();
      if (data.success) {
        fetchTransactions();
      }
    } catch {}
  };

  // Confirm 2FA OTP Code
  const handleConfirm2FA = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pending2FATxn) return;
    if (!enteredOtp || enteredOtp.trim().length < 4) {
      setOtpError("Введите корректный код подтверждения (минимум 4 цифры)");
      return;
    }

    try {
      const res = await fetch("/api/p2p/confirm-2fa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          txId: pending2FATxn.id,
          otp: enteredOtp
        })
      });
      const data = await res.json();
      if (data.success && data.transaction) {
        setPending2FATxn(null);
        setEnteredOtp("");
        setOtpError("");
        fetchUsers();
        fetchTransactions();
        setBannerAlert({
          title: `ТРАНЗАКЦИЯ ${data.transaction.id} ПОДТВЕРЖДЕНА ЧЕРЕЗ 2FA`,
          desc: `Успешная верификация одноразового кода. Списано ${data.transaction.amount.toLocaleString()} ₸.`,
          isError: false
        });
      } else {
        setOtpError(data.error || "Неверный код 2FA");
      }
    } catch (err: any) {
      setOtpError("Ошибка подтверждения: " + err.message);
    }
  };

  const recipientUser = users.find((u) => u.id === recipientId);

  return (
    <div className="space-y-6 pb-16 font-sans">
      {/* Top Banner Alert */}
      {bannerAlert && (
        <div
          className={`p-4 rounded border font-mono text-xs flex items-start justify-between transition-all ${
            bannerAlert.isError
              ? "bg-rose-950/60 border-rose-800 text-rose-300"
              : "bg-emerald-950/60 border-emerald-800 text-emerald-300"
          }`}
        >
          <div className="flex items-center gap-3">
            {bannerAlert.isError ? (
              <XCircle className="w-5 h-5 text-rose-500 flex-shrink-0" />
            ) : (
              <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />
            )}
            <div>
              <div className="font-bold tracking-wider">{bannerAlert.title}</div>
              <div className="text-[11px] mt-0.5 opacity-90">{bannerAlert.desc}</div>
            </div>
          </div>
          <button onClick={() => setBannerAlert(null)} className="text-slate-400 hover:text-white px-2">
            ✕
          </button>
        </div>
      )}

      {/* Page Header */}
      <div className="border-b border-slate-800 pb-4">
        <div className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-widest text-slate-400 mb-1">
          <Radio className="w-3 h-3 text-blue-500 animate-pulse" />
          <span>Межбанковский Антифрод-Шлюз • Firebase Firestore</span>
        </div>
        <h1 className="text-xl sm:text-2xl font-bold font-mono text-white tracking-tight">
          P2P Переводы и Интеллектуальный Скоринг в Реальном Времени
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Прямое взаимодействие между реальными клиентами: мгновенные переводы баланса, тест-запросы и оценка подозрительности операций.
        </p>
      </div>

      {/* Current User Status Card */}
      {currentUser ? (
        <div className="bg-slate-900 border border-slate-800 rounded p-4 font-mono">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded border border-slate-700 bg-slate-950 flex items-center justify-center">
                <CreditCard className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-white text-sm">{currentUser.name}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-950/60 border border-emerald-800 text-emerald-300 font-bold">
                    ONLINE
                  </span>
                </div>
                <div className="text-xs text-slate-400 font-mono mt-0.5">
                  Счет: {currentUser.accountNumber} • {currentUser.email}
                </div>
              </div>
            </div>

            <div className="sm:text-right border-t sm:border-t-0 border-slate-800 pt-2 sm:pt-0">
              <div className="text-[10px] text-slate-400 uppercase tracking-wider">Доступный Баланс:</div>
              <div className="text-lg sm:text-xl font-bold text-emerald-400">
                {currentUser.balance.toLocaleString("ru-RU")} ₸
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-4 rounded border border-amber-800/80 bg-amber-950/30 font-mono text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-amber-300">
            <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0" />
            <span>Вы не авторизованы. Войдите в существующий аккаунт или зарегистрируйтесь для совершения переводов.</span>
          </div>
          <div className="flex gap-2">
            {users.slice(0, 2).map((u) => (
              <button
                key={u.id}
                onClick={() => {
                  localStorage.setItem("finforcing_session_user", JSON.stringify(u));
                  setCurrentUser(u);
                  window.dispatchEvent(new Event("finforcing_user_changed"));
                }}
                className="px-2.5 py-1 rounded bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-200 text-[11px]"
              >
                Войти как {u.name.split(" ")[0]}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Incoming Test Requests Notification (Active Sync) */}
      {incomingRequests.length > 0 && (
        <div className="space-y-2">
          {incomingRequests.map((req) => (
            <div
              key={req.id}
              className="p-4 rounded border border-blue-800/80 bg-blue-950/40 font-mono text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-pulse"
            >
              <div className="flex items-center gap-3">
                <Bell className="w-5 h-5 text-blue-400 flex-shrink-0" />
                <div>
                  <div className="font-bold text-white text-xs">
                    ВХОДЯЩИЙ ТЕСТ-ЗАПРОС НА ПЕРЕВОД: {req.amount.toLocaleString()} ₸
                  </div>
                  <div className="text-slate-300 text-[11px] mt-0.5">
                    От: <span className="font-bold text-white">{req.recipientName}</span> • «{req.memoText}»
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleFulfillRequest(req.id)}
                  disabled={isSubmitting}
                  className="px-3 py-1.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-colors"
                >
                  [ Оплатить {req.amount.toLocaleString()} ₸ ]
                </button>
                <button
                  onClick={() => handleDeclineRequest(req.id)}
                  className="px-2.5 py-1.5 rounded bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-white text-xs transition-colors"
                >
                  Отклонить
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Registered Users Directory (Clients in bank) */}
      <section className="bg-slate-900/70 border border-slate-800 rounded p-4 font-mono text-xs">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-3">
          <span className="font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
            <User className="w-3.5 h-3.5 text-blue-500" />
            Зарегистрированные клиенты банка ({users.length}):
          </span>
          <span className="text-[10px] text-slate-500">Синхронизация Firestore в реальном времени</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {users.map((u) => {
            const isMe = currentUser?.id === u.id;
            const isSelectedTarget = recipientId === u.id || requestPayerId === u.id;

            return (
              <div
                key={u.id}
                className={`p-3 rounded border transition-colors ${
                  isMe
                    ? "bg-slate-950/80 border-blue-600/40"
                    : isSelectedTarget
                    ? "bg-slate-950 border-emerald-600/50"
                    : "bg-slate-950 border-slate-800 hover:border-slate-700"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-bold text-white text-xs">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span>{u.name}</span>
                    {isMe && (
                      <span className="text-[9px] px-1 py-0.2 rounded bg-blue-900 text-blue-200">
                        ВЫ
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-slate-500">{u.accountNumber.slice(0, 11)}...</span>
                </div>

                <div className="mt-1 flex items-center justify-between text-[11px]">
                  <span className="text-slate-400">Баланс:</span>
                  <span className="text-white font-bold">{u.balance.toLocaleString("ru-RU")} ₸</span>
                </div>

                {!isMe && (
                  <div className="mt-2.5 pt-2 border-t border-slate-800/80 flex gap-2">
                    <button
                      onClick={() => {
                        setRecipientId(u.id);
                        setOperationTab("TRANSFER");
                      }}
                      className={`flex-1 py-1 rounded text-[10px] uppercase font-bold transition-colors ${
                        recipientId === u.id && operationTab === "TRANSFER"
                          ? "bg-emerald-600 text-white"
                          : "bg-slate-800 text-slate-300 hover:text-white"
                      }`}
                    >
                      Перевести
                    </button>
                    <button
                      onClick={() => {
                        setRequestPayerId(u.id);
                        setOperationTab("REQUEST");
                      }}
                      className={`flex-1 py-1 rounded text-[10px] uppercase font-bold transition-colors ${
                        requestPayerId === u.id && operationTab === "REQUEST"
                          ? "bg-blue-600 text-white"
                          : "bg-slate-800 text-slate-300 hover:text-white"
                      }`}
                    >
                      Тест-запрос
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Main Form: Transfer or Test-Request */}
      <div className="bg-slate-900/80 border border-slate-800 rounded p-6 space-y-5">
        {/* Form Mode Tabs */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex gap-2">
            <button
              onClick={() => setOperationTab("TRANSFER")}
              className={`px-3 py-1.5 rounded font-mono text-xs uppercase font-bold transition-colors flex items-center gap-1.5 ${
                operationTab === "TRANSFER"
                  ? "bg-slate-800 text-white border border-slate-700"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Send className="w-3.5 h-3.5" />
              <span>Отправить Перевод</span>
            </button>
            <button
              onClick={() => setOperationTab("REQUEST")}
              className={`px-3 py-1.5 rounded font-mono text-xs uppercase font-bold transition-colors flex items-center gap-1.5 ${
                operationTab === "REQUEST"
                  ? "bg-slate-800 text-white border border-slate-700"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <ArrowDownLeft className="w-3.5 h-3.5" />
              <span>Тестовый Запрос Средств</span>
            </button>
          </div>

          <span className="font-mono text-[10px] text-slate-500 hidden sm:block">
            {operationTab === "TRANSFER" ? "P2P Clearing Engine" : "Inter-device Request Sync"}
          </span>
        </div>

        {operationTab === "TRANSFER" ? (
          /* TAB 1: DIRECT P2P TRANSFER */
          <div className="space-y-5">
            {/* Quick Demo Presets */}
            <div className="flex flex-wrap gap-2 font-mono text-xs">
              <button
                type="button"
                onClick={() => {
                  setAmount(850000);
                  setHour(2);
                  setMinute(43);
                  setIsNewRecipient(true);
                  setIsNewDevice(true);
                  setMemoText("Срочный перевод без комиссии");
                }}
                className="px-2.5 py-1 rounded bg-rose-950/40 border border-rose-800 text-rose-300 hover:bg-rose-900/50"
              >
                [ ТЕСТ: КРИТИЧЕСКИЙ ФРОД 02:43 (850 000 ₸) ]
              </button>
              <button
                type="button"
                onClick={() => {
                  setAmount(35000);
                  setHour(14);
                  setMinute(15);
                  setIsNewRecipient(false);
                  setIsNewDevice(false);
                  setMemoText("Оплата услуг");
                }}
                className="px-2.5 py-1 rounded bg-emerald-950/40 border border-emerald-800 text-emerald-300 hover:bg-emerald-900/50"
              >
                [ ТЕСТ: ШТАТНАЯ ОПЕРАЦИЯ 14:15 (35 000 ₸) ]
              </button>
            </div>

            {/* Recipient Picker */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-mono text-xs">
              <div>
                <label className="text-slate-400 block mb-1">Отправитель (Ваш счет):</label>
                <div className="p-3 rounded bg-slate-950 border border-slate-800 text-white">
                  <div className="font-bold">{currentUser?.name || "Не авторизован"}</div>
                  <div className="text-[10px] text-slate-500">{currentUser?.accountNumber}</div>
                  <div className="text-xs text-emerald-400 mt-1 font-bold">
                    Баланс: {currentUser?.balance.toLocaleString()} ₸
                  </div>
                </div>
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Получатель перевода:</label>
                <select
                  value={recipientId}
                  onChange={(e) => setRecipientId(e.target.value)}
                  className="w-full p-3 rounded bg-slate-950 border border-slate-800 text-white outline-none focus:border-slate-700 font-mono text-xs"
                >
                  {otherUsers.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name} ({u.accountNumber}) — Баланс: {u.balance.toLocaleString()} ₸
                    </option>
                  ))}
                </select>
                {recipientUser && (
                  <div className="text-[10px] text-slate-500 mt-1">
                    Счет зачисления: {recipientUser.accountNumber}
                  </div>
                )}
              </div>
            </div>

            {/* Amount Slider & Presets */}
            <div className="space-y-1.5 font-mono">
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">Сумма перевода:</span>
                <span className="font-bold text-white text-sm">{amount.toLocaleString("ru-RU")} ₸</span>
              </div>
              <input
                type="range"
                min="5000"
                max="1500000"
                step="5000"
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                className="w-full h-1.5 bg-slate-800 rounded appearance-none cursor-pointer accent-blue-500"
              />
              <div className="flex justify-between text-[10px] text-slate-500">
                <button type="button" onClick={() => setAmount(25000)} className="hover:text-white">
                  25 000 ₸
                </button>
                <button type="button" onClick={() => setAmount(150000)} className="hover:text-white">
                  150 000 ₸
                </button>
                <button type="button" onClick={() => setAmount(850000)} className="hover:text-white">
                  850 000 ₸
                </button>
                <button type="button" onClick={() => setAmount(1500000)} className="hover:text-white">
                  1 500 000 ₸
                </button>
              </div>
            </div>

            {/* Time of Transfer */}
            <div className="grid grid-cols-2 gap-4 font-mono text-xs">
              <div>
                <label className="text-slate-400 block mb-1">Час операции (0 - 23):</label>
                <input
                  type="number"
                  min="0"
                  max="23"
                  value={hour}
                  onChange={(e) => setHour(Math.min(23, Math.max(0, Number(e.target.value))))}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-white"
                />
              </div>
              <div>
                <label className="text-slate-400 block mb-1">Минуты (0 - 59):</label>
                <input
                  type="number"
                  min="0"
                  max="59"
                  value={minute}
                  onChange={(e) => setMinute(Math.min(59, Math.max(0, Number(e.target.value))))}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-white"
                />
              </div>
            </div>

            {/* Security Context Flags */}
            <div className="space-y-2 pt-2 border-t border-slate-800 font-mono text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-300">Новый получатель (первая транзакция в истории):</span>
                <button
                  type="button"
                  onClick={() => setIsNewRecipient(!isNewRecipient)}
                  className={`px-2 py-0.5 rounded text-[11px] font-bold border ${
                    isNewRecipient
                      ? "bg-rose-950 text-rose-400 border-rose-800"
                      : "bg-slate-950 text-slate-400 border-slate-800"
                  }`}
                >
                  {isNewRecipient ? "ДА (НОВЫЙ)" : "НЕТ (ДОВЕРЕННЫЙ)"}
                </button>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-300">Вход с нового неавторизованного устройства:</span>
                <button
                  type="button"
                  onClick={() => setIsNewDevice(!isNewDevice)}
                  className={`px-2 py-0.5 rounded text-[11px] font-bold border ${
                    isNewDevice
                      ? "bg-rose-950 text-rose-400 border-rose-800"
                      : "bg-slate-950 text-slate-400 border-slate-800"
                  }`}
                >
                  {isNewDevice ? "ДА (НОВОЕ)" : "НЕТ (ПРИВЫЧНОЕ)"}
                </button>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-300">Транзакция из зарубежного IP-адреса:</span>
                <button
                  type="button"
                  onClick={() => setIsForeignIp(!isForeignIp)}
                  className={`px-2 py-0.5 rounded text-[11px] font-bold border ${
                    isForeignIp
                      ? "bg-rose-950 text-rose-400 border-rose-800"
                      : "bg-slate-950 text-slate-400 border-slate-800"
                  }`}
                >
                  {isForeignIp ? "ДА (ЗАРУБЕЖНЫЙ)" : "НЕТ (КАЗАХСТАН)"}
                </button>
              </div>
            </div>

            {/* Memo Text */}
            <div className="space-y-1 font-mono text-xs">
              <label className="text-slate-400 block">Назначение платежа:</label>
              <input
                type="text"
                value={memoText}
                onChange={(e) => setMemoText(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-white outline-none focus:border-slate-700 font-sans text-xs"
              />
            </div>

            {/* Real-time ML Risk Preview */}
            {liveRisk && (
              <div className="p-4 rounded bg-slate-950 border border-slate-800 font-mono text-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 flex items-center gap-1.5">
                    <Activity className="w-3.5 h-3.5 text-blue-500" />
                    <span>Предварительный скоринг LightGBM:</span>
                  </span>
                  <span
                    className={`px-2.5 py-0.5 rounded font-bold border ${
                      liveRisk.riskLevel === "HIGH"
                        ? "bg-rose-950 text-rose-400 border-rose-800"
                        : liveRisk.riskLevel === "MEDIUM"
                        ? "bg-amber-950 text-amber-400 border-amber-800"
                        : "bg-emerald-950 text-emerald-400 border-emerald-800"
                    }`}
                  >
                    {liveRisk.fraudRiskScore}% — {liveRisk.riskLevel} RISK
                  </span>
                </div>
                <div className="text-[11px] text-slate-300 font-sans leading-relaxed">
                  {liveRisk.riskExplanation}
                </div>
                <div className="text-[10px] text-slate-500 flex flex-wrap gap-2 pt-1 border-t border-slate-900">
                  {liveRisk.topRiskFactors.map((f, i) => (
                    <span key={i} className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-400">
                      • {f}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Submit Button */}
            <button
              onClick={handleExecuteTransfer}
              disabled={isSubmitting || !currentUser}
              className={`w-full py-3.5 rounded font-mono font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
                !currentUser
                  ? "bg-slate-800 text-slate-500 cursor-not-allowed"
                  : liveRisk?.riskLevel === "HIGH"
                  ? "bg-rose-600 hover:bg-rose-500 text-white"
                  : liveRisk?.riskLevel === "MEDIUM"
                  ? "bg-amber-600 hover:bg-amber-500 text-white"
                  : "bg-blue-600 hover:bg-blue-500 text-white"
              }`}
            >
              {isSubmitting ? (
                <span>ОБРАБОТКА ОПЕРАЦИИ В БАНКЕ...</span>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>[ ИСПОЛНИТЬ ПЕРЕВОД: {amount.toLocaleString()} ₸ ]</span>
                </>
              )}
            </button>
          </div>
        ) : (
          /* TAB 2: TEST REQUEST FROM ANOTHER REGISTERED USER */
          <div className="space-y-4 font-mono text-xs">
            <p className="text-slate-400 leading-relaxed">
              Отправьте тестовый запрос средств пользователю на другом устройстве (например, со смартфона на ноутбук).
              Получатель запроса моментально увидит уведомление и сможет подтвердить оплату.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-slate-400 block mb-1">Кому отправить запрос (Плательщик):</label>
                <select
                  value={requestPayerId}
                  onChange={(e) => setRequestPayerId(e.target.value)}
                  className="w-full p-3 rounded bg-slate-950 border border-slate-800 text-white outline-none focus:border-slate-700"
                >
                  {otherUsers.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name} ({u.accountNumber})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Сумма запроса (₸):</label>
                <input
                  type="number"
                  min="1000"
                  step="5000"
                  value={requestAmount}
                  onChange={(e) => setRequestAmount(Number(e.target.value))}
                  className="w-full p-3 rounded bg-slate-950 border border-slate-800 text-white outline-none focus:border-slate-700"
                />
              </div>
            </div>

            <div>
              <label className="text-slate-400 block mb-1">Комментарий к тест-запросу:</label>
              <input
                type="text"
                value={requestMemo}
                onChange={(e) => setRequestMemo(e.target.value)}
                placeholder="Тестовый запрос с телефона"
                className="w-full p-3 rounded bg-slate-950 border border-slate-800 text-white outline-none focus:border-slate-700 font-sans"
              />
            </div>

            <button
              onClick={handleSendTestRequest}
              disabled={isSubmitting || !currentUser}
              className="w-full py-3.5 rounded font-mono font-bold text-xs uppercase tracking-wider bg-blue-600 hover:bg-blue-500 text-white flex items-center justify-center gap-2 transition-colors"
            >
              <ArrowDownLeft className="w-3.5 h-3.5" />
              <span>[ ОТПРАВИТЬ ТЕСТ-ЗАПРОС: {requestAmount.toLocaleString()} ₸ ]</span>
            </button>
          </div>
        )}
      </div>

      {/* 2FA Verification Modal */}
      {pending2FATxn && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 font-mono">
          <div className="bg-slate-950 border border-slate-800 rounded-lg max-w-sm w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-2 text-amber-400 border-b border-slate-800 pb-3">
              <KeyRound className="w-5 h-5 text-amber-500" />
              <div className="font-bold text-sm uppercase">2FA Верификация Клиента</div>
            </div>

            <div className="text-xs text-slate-300 space-y-1">
              <div>
                Транзакция <span className="font-bold text-white">{pending2FATxn.id}</span> на сумму{" "}
                <span className="font-bold text-white">{pending2FATxn.amount.toLocaleString()} ₸</span> требует
                двухфакторной аутентификации из-за среднего уровня риска ({pending2FATxn.fraudAnalysis?.fraudRiskScore}%).
              </div>
              <div className="text-[11px] text-slate-500 pt-1">
                Тестовый OTP-код для подтверждения: <span className="font-bold text-amber-300">123456</span>
              </div>
            </div>

            {otpError && (
              <div className="p-2 rounded bg-rose-950/40 border border-rose-800 text-rose-300 text-xs">
                {otpError}
              </div>
            )}

            <form onSubmit={handleConfirm2FA} className="space-y-3">
              <input
                type="text"
                autoFocus
                value={enteredOtp}
                onChange={(e) => setEnteredOtp(e.target.value)}
                placeholder="123456"
                className="w-full text-center tracking-widest text-lg font-bold bg-slate-900 border border-slate-700 rounded px-3 py-2 text-white outline-none focus:border-amber-500"
              />

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setPending2FATxn(null)}
                  className="flex-1 py-2 rounded bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 text-xs"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 rounded bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs"
                >
                  Подтвердить
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Transactions & Requests Audit Table */}
      <section className="bg-slate-900/80 border border-slate-800 rounded p-6 font-mono text-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-2">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-blue-500" />
            <h3 className="font-bold text-white uppercase tracking-wider">
              Журнал межбанковских операций и антифрод-инцидентов
            </h3>
          </div>
          <div className="flex items-center gap-3 text-[11px] text-slate-500">
            <span>Всего записей: {history.length}</span>
            <button
              onClick={() => {
                fetchUsers();
                fetchTransactions();
              }}
              className="text-slate-400 hover:text-white flex items-center gap-1"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Обновить</span>
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 uppercase text-[10px]">
              <tr>
                <th className="py-2.5 px-3">ID / Время</th>
                <th className="py-2.5 px-3">Тип</th>
                <th className="py-2.5 px-3">Отправитель → Получатель</th>
                <th className="py-2.5 px-3">Сумма (₸)</th>
                <th className="py-2.5 px-3">Назначение</th>
                <th className="py-2.5 px-3">Fraud Risk</th>
                <th className="py-2.5 px-3 text-right">Статус</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {history.map((tx) => (
                <tr key={tx.id} className="hover:bg-slate-800/30">
                  <td className="py-2.5 px-3">
                    <span className="font-bold text-white">{tx.id}</span>
                    <span className="text-[10px] text-slate-500 block">
                      {String(tx.hour).padStart(2, "0")}:{String(tx.minute).padStart(2, "0")}
                    </span>
                  </td>
                  <td className="py-2.5 px-3">
                    <span
                      className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${
                        tx.type === "REQUEST"
                          ? "bg-purple-950 text-purple-300 border border-purple-800"
                          : "bg-blue-950 text-blue-300 border border-blue-800"
                      }`}
                    >
                      {tx.type === "REQUEST" ? "ЗАПРОС" : "ПЕРЕВОД"}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-slate-200 font-sans">
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold text-white">{tx.senderName}</span>
                      <span className="text-slate-500">→</span>
                      <span className="text-slate-300">{tx.recipientName}</span>
                    </div>
                  </td>
                  <td className="py-2.5 px-3 font-bold text-white">
                    {tx.amount.toLocaleString("ru-RU")} ₸
                  </td>
                  <td className="py-2.5 px-3 text-slate-400 font-sans truncate max-w-xs">
                    {tx.memoText}
                  </td>
                  <td className="py-2.5 px-3">
                    {tx.fraudAnalysis ? (
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                          tx.fraudAnalysis.riskLevel === "HIGH"
                            ? "bg-rose-950 text-rose-400 border-rose-800"
                            : tx.fraudAnalysis.riskLevel === "MEDIUM"
                            ? "bg-amber-950 text-amber-400 border-amber-800"
                            : "bg-emerald-950 text-emerald-400 border-emerald-800"
                        }`}
                      >
                        {tx.fraudAnalysis.fraudRiskScore}% ({tx.fraudAnalysis.riskLevel})
                      </span>
                    ) : (
                      <span className="text-slate-500 text-[10px]">—</span>
                    )}
                  </td>
                  <td className="py-2.5 px-3 text-right font-bold">
                    {tx.status === "APPROVED" ? (
                      <span className="text-emerald-400">Исполнен</span>
                    ) : tx.status === "REQUIRES_2FA" ? (
                      <span className="text-amber-400">Ожидает 2FA</span>
                    ) : tx.status === "PENDING_REQUEST" ? (
                      <span className="text-blue-400">Запрос отправлен</span>
                    ) : tx.status === "DECLINED" ? (
                      <span className="text-slate-500">Отклонен</span>
                    ) : (
                      <span className="text-rose-400">Заблокирован</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
