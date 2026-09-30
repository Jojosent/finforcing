"use client";

import { useState, useEffect } from "react";
import {
  ArrowRightLeft,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  Clock,
  Send,
  UserPlus,
  RefreshCw,
  Smartphone,
  Laptop,
  CheckCircle2,
  XCircle,
  KeyRound,
  Radio,
  FileText,
  User,
  Activity,
  Layers,
  Search
} from "lucide-react";
import { BankUser, BankTransaction } from "@/lib/firebase/db";
import { analyzeTransaction, FraudAnalysisResult } from "@/lib/ml/fraudDetector";

export default function P2PTransferPage() {
  const [users, setUsers] = useState<BankUser[]>([]);
  const [senderId, setSenderId] = useState<string>("usr_alice");
  const [recipientId, setRecipientId] = useState<string>("usr_boris");

  // Transfer Parameters
  const [amount, setAmount] = useState<number>(850000);
  const [hour, setHour] = useState<number>(2);
  const [minute, setMinute] = useState<number>(43);
  const [memoText, setMemoText] = useState<string>("Срочный перевод без комиссии");
  const [isNewRecipient, setIsNewRecipient] = useState<boolean>(true);
  const [isNewDevice, setIsNewDevice] = useState<boolean>(true);
  const [isForeignIp, setIsForeignIp] = useState<boolean>(false);

  // Live Risk Calculation
  const [liveRisk, setLiveRisk] = useState<FraudAnalysisResult | null>(null);

  // Transactions History
  const [history, setHistory] = useState<BankTransaction[]>([]);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // View Mode: "TERMINAL" (Single view) vs "SPLIT_DEVICE" (Laptop + Phone side-by-side)
  const [viewMode, setViewMode] = useState<"TERMINAL" | "SPLIT_DEVICE">("SPLIT_DEVICE");

  // Phone Mockup Incoming Alert State
  const [incomingPhoneAlert, setIncomingPhoneAlert] = useState<{
    txId: string;
    senderName: string;
    amount: number;
    riskScore: number;
    riskLevel: string;
    status: string;
    reasons: string[];
    time: string;
  } | null>(null);

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

  useEffect(() => {
    fetchUsers();
    fetchTransactions();

    // Listen to user switch from Navbar
    const onUserChange = () => {
      const saved = localStorage.getItem("finforcing_session_user");
      if (saved) {
        try {
          const u = JSON.parse(saved);
          setSenderId(u.id);
        } catch {}
      }
      fetchUsers();
    };
    window.addEventListener("finforcing_user_changed", onUserChange);

    // Auto-poll every 3 seconds for real-time multi-device sync
    const interval = setInterval(() => {
      fetchTransactions();
      fetchUsers();
    }, 3000);

    return () => {
      window.removeEventListener("finforcing_user_changed", onUserChange);
      clearInterval(interval);
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

  const sender = users.find((u) => u.id === senderId) || users[0];
  const recipient = users.find((u) => u.id === recipientId) || users[1];

  // Re-calculate live fraud risk whenever any parameter changes
  useEffect(() => {
    if (!sender) return;
    const res = analyzeTransaction({
      amount,
      hour,
      minute,
      transactionType: "P2P_TRANSFER",
      senderBalanceBefore: sender.balance,
      senderAvgAmount: sender.avgAmount,
      isNewRecipient,
      velocityLast24h: hour < 6 ? 3 : 1,
      isNewDevice,
      isForeignIp,
      memoText,
      senderId: sender.id,
      recipientId: recipient?.id
    });
    setLiveRisk(res);
  }, [amount, hour, minute, isNewRecipient, isNewDevice, isForeignIp, memoText, senderId, recipientId, users]);

  // Execute Transfer
  const handleExecuteTransfer = async () => {
    if (amount <= 0) {
      alert("Укажите корректную сумму");
      return;
    }
    if (sender && amount > sender.balance) {
      alert("Недостаточно средств на балансе отправителя");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/p2p/transfer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          senderId,
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

        // Trigger Phone Alert in Split-Screen Simulator
        setIncomingPhoneAlert({
          txId: tx.id,
          senderName: tx.senderName,
          amount: tx.amount,
          riskScore: tx.fraudAnalysis.fraudRiskScore,
          riskLevel: tx.fraudAnalysis.riskLevel,
          status: tx.status,
          reasons: tx.fraudAnalysis.topRiskFactors,
          time: `${String(tx.hour).padStart(2, "0")}:${String(tx.minute).padStart(2, "0")}`
        });

        if (tx.status === "APPROVED") {
          setBannerAlert({
            title: `ТРАНЗАКЦИЯ ${tx.id} ИСПОЛНЕНА`,
            desc: `Списано ${tx.amount.toLocaleString()} ₸. Риск-скор: ${tx.fraudAnalysis.fraudRiskScore}% (LOW RISK). Автоматическое согласование.`,
            isError: false
          });
        } else if (tx.status === "REQUIRES_2FA") {
          setPending2FATxn(tx);
        } else {
          setBannerAlert({
            title: `ТРАНЗАКЦИЯ ${tx.id} ЗАБЛОКИРОВАНА АНТИФРОДОМ`,
            desc: `Высокий риск мошенничества (${tx.fraudAnalysis.fraudRiskScore}%). Средства заморожены на счете отправителя для защиты депозита.`,
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

  return (
    <div className="space-y-6 pb-16 font-sans">
      {/* Top Banner Alert */}
      {bannerAlert && (
        <div
          className={`p-4 rounded border font-mono text-xs flex items-start justify-between ${
            bannerAlert.isError
              ? "bg-rose-950/40 border-rose-800 text-rose-300"
              : "bg-emerald-950/40 border-emerald-800 text-emerald-300"
          }`}
        >
          <div className="flex items-center gap-3">
            {bannerAlert.isError ? (
              <XCircle className="w-4 h-4 text-rose-500 flex-shrink-0" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
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

      {/* Header and Device Switcher */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-widest text-slate-400 mb-1">
            <Radio className="w-3 h-3 text-blue-500 animate-pulse" />
            <span>P2P Transfer Clearing Engine • Firebase Firestore</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold font-mono text-white tracking-tight">
            Межбанковские P2P Транзакции и Скоринг в Реальном Времени
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Проверка операций между реальными зарегистрированными клиентами с детекцией аномалий на двух устройствах.
          </p>
        </div>

        {/* Device Mode Switcher */}
        <div className="flex items-center gap-1.5 p-1 rounded bg-slate-900 border border-slate-800">
          <button
            onClick={() => setViewMode("SPLIT_DEVICE")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-mono transition-colors ${
              viewMode === "SPLIT_DEVICE"
                ? "bg-slate-800 text-white font-bold border border-slate-700"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Laptop className="w-3.5 h-3.5" />
            <span>+</span>
            <Smartphone className="w-3.5 h-3.5" />
            <span>Сплит-скрин (Ноутбук + Телефон)</span>
          </button>
          <button
            onClick={() => setViewMode("TERMINAL")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-mono transition-colors ${
              viewMode === "TERMINAL"
                ? "bg-slate-800 text-white font-bold border border-slate-700"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Laptop className="w-3.5 h-3.5" />
            <span>Терминал рабочей станции</span>
          </button>
        </div>
      </div>

      {/* Online Users Directory Banner */}
      <section className="bg-slate-900/60 border border-slate-800 rounded p-4 font-mono text-xs">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-3">
          <span className="font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
            <User className="w-3.5 h-3.5 text-blue-500" />
            Реестр зарегистрированных клиентов ({users.length}):
          </span>
          <span className="text-[10px] text-slate-500">Синхронизировано с Firestore</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {users.map((u) => {
            const isSelectedSender = u.id === senderId;
            const isSelectedRecipient = u.id === recipientId;
            return (
              <div
                key={u.id}
                className={`p-3 rounded border transition-colors ${
                  isSelectedSender
                    ? "bg-blue-950/20 border-blue-600/50"
                    : isSelectedRecipient
                    ? "bg-emerald-950/20 border-emerald-600/50"
                    : "bg-slate-950 border-slate-800 hover:border-slate-700"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-bold text-white text-xs">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    <span>{u.name}</span>
                  </div>
                  <span className="text-[10px] text-slate-500">{u.accountNumber.slice(0, 11)}...</span>
                </div>

                <div className="mt-1 flex items-center justify-between text-[11px]">
                  <span className="text-slate-400">Баланс:</span>
                  <span className="text-white font-bold">{u.balance.toLocaleString("ru-RU")} ₸</span>
                </div>

                <div className="mt-2.5 pt-2 border-t border-slate-800/80 flex gap-2">
                  <button
                    onClick={() => {
                      setSenderId(u.id);
                      if (recipientId === u.id) {
                        const other = users.find((o) => o.id !== u.id);
                        if (other) setRecipientId(other.id);
                      }
                    }}
                    className={`flex-1 py-1 rounded text-[10px] uppercase font-bold transition-colors ${
                      isSelectedSender
                        ? "bg-blue-600 text-white"
                        : "bg-slate-800 text-slate-400 hover:text-white"
                    }`}
                  >
                    Отправитель
                  </button>
                  <button
                    onClick={() => {
                      setRecipientId(u.id);
                      if (senderId === u.id) {
                        const other = users.find((o) => o.id !== u.id);
                        if (other) setSenderId(other.id);
                      }
                    }}
                    className={`flex-1 py-1 rounded text-[10px] uppercase font-bold transition-colors ${
                      isSelectedRecipient
                        ? "bg-emerald-600 text-white"
                        : "bg-slate-800 text-slate-400 hover:text-white"
                    }`}
                  >
                    Получатель
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Main Dual Device / Terminal Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Workstation / Sender Terminal (7 cols in split, 12 cols in terminal) */}
        <div
          className={`${
            viewMode === "SPLIT_DEVICE" ? "lg:col-span-7" : "lg:col-span-8"
          } bg-slate-900/80 border border-slate-800 rounded p-6 space-y-5`}
        >
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Laptop className="w-4 h-4 text-blue-500" />
              <h2 className="font-mono text-sm font-bold uppercase text-white tracking-wider">
                Устройство 1: Ноутбук (Рабочее место Отправителя)
              </h2>
            </div>
            <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300">
              CLIENT: {sender?.name}
            </span>
          </div>

          {/* Quick Presets for Demo */}
          <div className="flex gap-2 font-mono text-xs">
            <button
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
              [ ТЕСТ: КРИТИЧЕСКИЙ ФРОД 02:43 ]
            </button>
            <button
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
              [ ТЕСТ: БЕЗОПАСНАЯ ОПЕРАЦИЯ 14:15 ]
            </button>
          </div>

          {/* Sender & Recipient Pickers */}
          <div className="grid grid-cols-2 gap-4 font-mono text-xs">
            <div>
              <label className="text-slate-400 block mb-1">Счет списания:</label>
              <div className="p-2.5 rounded bg-slate-950 border border-slate-800 text-white">
                <div className="font-bold">{sender?.name}</div>
                <div className="text-[10px] text-slate-500">{sender?.accountNumber}</div>
                <div className="text-[11px] text-emerald-400 mt-1 font-bold">
                  {sender?.balance.toLocaleString()} ₸
                </div>
              </div>
            </div>

            <div>
              <label className="text-slate-400 block mb-1">Счет зачисления:</label>
              <select
                value={recipientId}
                onChange={(e) => setRecipientId(e.target.value)}
                className="w-full p-2.5 rounded bg-slate-950 border border-slate-800 text-white outline-none focus:border-slate-700"
              >
                {users
                  .filter((u) => u.id !== senderId)
                  .map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name} ({u.balance.toLocaleString()} ₸)
                    </option>
                  ))}
              </select>
              <div className="text-[10px] text-slate-500 mt-1">
                {recipient?.accountNumber}
              </div>
            </div>
          </div>

          {/* Amount Slider & Number Input */}
          <div className="space-y-1.5 font-mono">
            <div className="flex justify-between text-xs">
              <span className="text-slate-400">Сумма операции:</span>
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
              <span>5 000 ₸</span>
              <span>850 000 ₸</span>
              <span>1 500 000 ₸</span>
            </div>
          </div>

          {/* Time Picker */}
          <div className="grid grid-cols-2 gap-4 font-mono text-xs">
            <div>
              <label className="text-slate-400 block mb-1">Час перевода (0 - 23):</label>
              <input
                type="number"
                min="0"
                max="23"
                value={hour}
                onChange={(e) => setHour(Math.min(23, Math.max(0, Number(e.target.value))))}
                className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-1.5 text-white"
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
                className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-1.5 text-white"
              />
            </div>
          </div>

          {/* Security & Behavioral Flags */}
          <div className="space-y-2 pt-2 border-t border-slate-800 font-mono text-xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-300">Новый получатель (первый перевод в истории):</span>
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

          {/* Live Risk Preview Bar on Workstation */}
          {liveRisk && (
            <div className="p-3.5 rounded bg-slate-950 border border-slate-800 font-mono text-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Предварительная оценка LightGBM:</span>
                <span
                  className={`px-2 py-0.5 rounded font-bold border ${
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
            </div>
          )}

          {/* Submit Button */}
          <button
            onClick={handleExecuteTransfer}
            disabled={isSubmitting}
            className={`w-full py-3 rounded font-mono font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
              liveRisk?.riskLevel === "HIGH"
                ? "bg-rose-600 hover:bg-rose-500 text-white"
                : liveRisk?.riskLevel === "MEDIUM"
                ? "bg-amber-600 hover:bg-amber-500 text-white"
                : "bg-blue-600 hover:bg-blue-500 text-white"
            }`}
          >
            {isSubmitting ? (
              <span>ОБРАБОТКА ТРАНЗАКЦИИ...</span>
            ) : (
              <>
                <Send className="w-3.5 h-3.5" />
                <span>[ ИСПОЛНИТЬ ПЕРЕВОД: {amount.toLocaleString()} ₸ ]</span>
              </>
            )}
          </button>
        </div>

        {/* Right Column: Smartphone Mockup / Mobile Device 2 View (5 cols in split) */}
        {viewMode === "SPLIT_DEVICE" && (
          <div className="lg:col-span-5 flex flex-col items-center">
            <div className="font-mono text-xs text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-emerald-500" />
              <span>Устройство 2: Смартфон (Интерфейс Получателя)</span>
            </div>

            {/* Smartphone Hardware Frame (Enterprise Black Frame) */}
            <div className="w-[320px] h-[640px] bg-slate-950 rounded-[40px] border-4 border-slate-700 shadow-2xl relative overflow-hidden flex flex-col font-sans">
              {/* Speaker / Camera Notch */}
              <div className="h-6 bg-slate-900 flex items-center justify-between px-6 pt-1">
                <span className="text-[10px] font-mono text-slate-400">09:41</span>
                <div className="w-14 h-3.5 bg-black rounded-full" />
                <div className="flex items-center gap-1 text-[10px] font-mono text-slate-400">
                  <span>5G</span>
                  <span>100%</span>
                </div>
              </div>

              {/* Smartphone Bank App Header */}
              <div className="p-4 bg-slate-900 border-b border-slate-800">
                <div className="flex items-center justify-between font-mono">
                  <div>
                    <div className="text-[10px] text-slate-400 uppercase">Клиент:</div>
                    <div className="text-xs font-bold text-white">{recipient?.name}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] text-slate-400 uppercase">Баланс:</div>
                    <div className="text-sm font-bold text-emerald-400 font-mono">
                      {recipient?.balance.toLocaleString()} ₸
                    </div>
                  </div>
                </div>
                <div className="text-[9px] font-mono text-slate-500 mt-1">
                  {recipient?.accountNumber}
                </div>
              </div>

              {/* Smartphone Body / Screen Content */}
              <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-slate-950">
                {/* Incoming Transfer Real-Time Alert Banner */}
                {incomingPhoneAlert ? (
                  <div
                    className={`p-3.5 rounded-lg border font-mono animate-fade-in ${
                      incomingPhoneAlert.status === "APPROVED"
                        ? "bg-emerald-950/40 border-emerald-600 text-emerald-200"
                        : "bg-rose-950/40 border-rose-600 text-rose-200"
                    }`}
                  >
                    <div className="flex items-center justify-between border-b border-current/20 pb-1.5 mb-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider">
                        {incomingPhoneAlert.status === "APPROVED"
                          ? "ВХОДЯЩИЙ ПЕРЕВОД"
                          : "ОПЕРАЦИЯ ЗАБЛОКИРОВАНА"}
                      </span>
                      <span className="text-[9px] font-mono">{incomingPhoneAlert.time}</span>
                    </div>

                    <div className="text-base font-black">
                      {incomingPhoneAlert.amount.toLocaleString()} ₸
                    </div>
                    <div className="text-[11px] text-slate-300 font-sans mt-0.5">
                      Отправитель: {incomingPhoneAlert.senderName}
                    </div>

                    <div className="mt-2 pt-2 border-t border-current/20 flex items-center justify-between text-[11px]">
                      <span>Оценка риска:</span>
                      <span className="font-bold">
                        {incomingPhoneAlert.riskScore}% ({incomingPhoneAlert.riskLevel})
                      </span>
                    </div>

                    {incomingPhoneAlert.status === "BLOCKED" && (
                      <div className="mt-2 p-2 bg-rose-950/60 rounded text-[10px] font-sans text-rose-300 space-y-0.5">
                        <div className="font-bold uppercase">Причина блокировки:</div>
                        {incomingPhoneAlert.reasons.map((r, i) => (
                          <div key={i}>• {r}</div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="p-4 rounded border border-dashed border-slate-800 text-center font-mono text-[11px] text-slate-500">
                    Ожидание входящей транзакции...
                  </div>
                )}

                {/* Recent mobile transaction stream */}
                <div className="space-y-1.5 pt-2">
                  <div className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">
                    Последние операции по счету:
                  </div>
                  {history.slice(0, 3).map((tx) => (
                    <div
                      key={tx.id}
                      className="p-2 rounded bg-slate-900 border border-slate-800 text-xs font-mono flex justify-between items-center"
                    >
                      <div>
                        <div className="text-white text-[11px]">{tx.senderName}</div>
                        <div className="text-[9px] text-slate-500">{tx.memoText}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-white font-bold text-[11px]">
                          {tx.amount.toLocaleString()} ₸
                        </div>
                        <div
                          className={`text-[9px] font-bold ${
                            tx.status === "APPROVED" ? "text-emerald-400" : "text-rose-400"
                          }`}
                        >
                          {tx.status}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Smartphone Home Bar */}
              <div className="h-4 bg-slate-900 flex items-center justify-center">
                <div className="w-24 h-1 bg-slate-600 rounded-full" />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Audit Log Data Table */}
      <section className="bg-slate-900/80 border border-slate-800 rounded p-6 font-mono text-xs space-y-3">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-blue-500" />
            <h3 className="font-bold text-white uppercase tracking-wider">
              Журнал транзакций & Фиксация инцидентов антифрода (Firestore)
            </h3>
          </div>
          <span className="text-[11px] text-slate-500">Записей: {history.length}</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 uppercase text-[10px]">
              <tr>
                <th className="py-2 px-3">ID / Время</th>
                <th className="py-2 px-3">Отправитель → Получатель</th>
                <th className="py-2 px-3">Сумма (₸)</th>
                <th className="py-2 px-3">Назначение</th>
                <th className="py-2 px-3">Fraud Risk</th>
                <th className="py-2 px-3 text-right">Статус</th>
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
                  <td className="py-2.5 px-3 text-slate-200 font-sans">
                    {tx.senderName} → {tx.recipientName}
                  </td>
                  <td className="py-2.5 px-3 font-bold text-white">
                    {tx.amount.toLocaleString("ru-RU")} ₸
                  </td>
                  <td className="py-2.5 px-3 text-slate-400 font-sans truncate max-w-xs">
                    {tx.memoText}
                  </td>
                  <td className="py-2.5 px-3">
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
                  </td>
                  <td className="py-2.5 px-3 text-right font-bold">
                    {tx.status === "APPROVED" ? (
                      <span className="text-emerald-400">Исполнен</span>
                    ) : tx.status === "REQUIRES_2FA" ? (
                      <span className="text-amber-400">Требует 2FA</span>
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
