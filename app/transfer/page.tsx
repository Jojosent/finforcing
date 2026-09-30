"use client";

import { useState, useEffect } from "react";
import {
  ArrowRightLeft,
  UserCheck,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  Clock,
  Sparkles,
  Send,
  UserPlus,
  RefreshCw,
  Smartphone,
  Globe,
  Wallet,
  CheckCircle,
  XCircle,
  KeyRound
} from "lucide-react";
import { P2PService, P2PUser, P2PTransactionRecord } from "@/lib/firebase/p2pService";
import { analyzeTransaction, FraudAnalysisResult } from "@/lib/ml/fraudDetector";

export default function P2PTransferPage() {
  const [users, setUsers] = useState<P2PUser[]>([]);
  const [senderId, setSenderId] = useState<string>("usr_alice");
  const [recipientId, setRecipientId] = useState<string>("usr_bob");
  
  // Transfer Parameters
  const [amount, setAmount] = useState<number>(150000);
  const [hour, setHour] = useState<number>(14);
  const [minute, setMinute] = useState<number>(30);
  const [memoText, setMemoText] = useState<string>("Перевод за проект");
  const [isNewRecipient, setIsNewRecipient] = useState<boolean>(false);
  const [isNewDevice, setIsNewDevice] = useState<boolean>(false);
  const [isForeignIp, setIsForeignIp] = useState<boolean>(false);

  // Live Real-Time Risk Score (updates automatically as user changes inputs)
  const [liveRisk, setLiveRisk] = useState<FraudAnalysisResult | null>(null);

  // Transactions History
  const [history, setHistory] = useState<P2PTransactionRecord[]>([]);

  // Modals & User Registration
  const [showRegisterModal, setShowRegisterModal] = useState<boolean>(false);
  const [newUserName, setNewUserName] = useState<string>("");
  const [newUserEmail, setNewUserEmail] = useState<string>("");
  const [newUserBalance, setNewUserBalance] = useState<number>(600000);

  // 2FA Verification Modal
  const [pending2FATxn, setPending2FATxn] = useState<P2PTransactionRecord | null>(null);
  const [enteredOtp, setEnteredOtp] = useState<string>("");
  const [otpError, setOtpError] = useState<string>("");

  // Notification Toast
  const [toastMessage, setToastMessage] = useState<{ title: string; desc: string; type: "success" | "error" | "warning" } | null>(null);

  useEffect(() => {
    refreshData();
  }, []);

  const refreshData = () => {
    const loadedUsers = P2PService.getUsers();
    setUsers(loadedUsers);
    setHistory(P2PService.getTransactions());
  };

  const sender = users.find((u) => u.id === senderId) || users[0];
  const recipient = users.find((u) => u.id === recipientId) || users[1];

  // Re-calculate live risk score dynamically whenever any input changes
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
      velocityLast24h: 1,
      isNewDevice,
      isForeignIp,
      memoText
    });
    setLiveRisk(res);
  }, [amount, hour, minute, isNewRecipient, isNewDevice, isForeignIp, memoText, senderId, users]);

  // Handle sender change
  const handleSenderChange = (newSenderId: string) => {
    setSenderId(newSenderId);
    if (recipientId === newSenderId) {
      const other = users.find((u) => u.id !== newSenderId);
      if (other) setRecipientId(other.id);
    }
  };

  // Execute Transfer
  const handleExecuteTransfer = () => {
    if (amount <= 0) {
      alert("Пожалуйста, укажите корректную сумму");
      return;
    }
    if (sender && amount > sender.balance) {
      alert("Недостаточно средств на балансе отправителя!");
      return;
    }

    const txRecord = P2PService.executeTransfer({
      senderId,
      recipientId,
      amount,
      hour,
      minute,
      memoText,
      isNewRecipient,
      isNewDevice,
      isForeignIp
    });

    refreshData();

    if (txRecord.status === "COMPLETED") {
      setToastMessage({
        title: "Перевод успешно выполнен!",
        desc: `Списано ${amount.toLocaleString()} ₸ со счета ${txRecord.senderName}. Риск-скор: ${txRecord.fraudAnalysis.fraudRiskScore}% (LOW RISK).`,
        type: "success"
      });
    } else if (txRecord.status === "REQUIRES_2FA") {
      setPending2FATxn(txRecord);
    } else {
      setToastMessage({
        title: "Транзакция заблокирована!",
        desc: `Высокий риск мошенничества (${txRecord.fraudAnalysis.fraudRiskScore}%). Средства заморожены для защиты пользователя.`,
        type: "error"
      });
    }
  };

  // Confirm 2FA OTP
  const handleConfirm2FA = () => {
    if (enteredOtp !== "123456" && enteredOtp !== "777777") {
      setOtpError("Неверный SMS-код (для теста введите 123456)");
      return;
    }
    if (!pending2FATxn) return;

    const ok = P2PService.confirm2FA(pending2FATxn.id);
    if (ok) {
      setPending2FATxn(null);
      setEnteredOtp("");
      setOtpError("");
      refreshData();
      setToastMessage({
        title: "2FA верификация пройдена!",
        desc: `Транзакция подтверждена владельцем. Средства переведены.`,
        type: "success"
      });
    }
  };

  // Register New User
  const handleRegisterUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserName) return;
    const created = P2PService.registerUser(
      newUserName,
      newUserEmail || `${newUserName.toLowerCase().replace(/\s+/g, "_")}@bank.kz`,
      newUserBalance
    );
    refreshData();
    setSenderId(created.id);
    setShowRegisterModal(false);
    setNewUserName("");
    setNewUserEmail("");
    setToastMessage({
      title: "Пользователь создан!",
      desc: `${created.name} добавлен в систему с балансом ${created.balance.toLocaleString()} ₸.`,
      type: "success"
    });
  };

  return (
    <div className="space-y-8 pb-16">
      {/* Toast Banner */}
      {toastMessage && (
        <div
          className={`p-4 rounded-xl border flex items-start justify-between shadow-xl animate-fade-in ${
            toastMessage.type === "success"
              ? "bg-emerald-950/80 border-emerald-500/40 text-emerald-200"
              : toastMessage.type === "error"
              ? "bg-rose-950/80 border-rose-500/40 text-rose-200"
              : "bg-amber-950/80 border-amber-500/40 text-amber-200"
          }`}
        >
          <div className="flex items-center gap-3">
            {toastMessage.type === "success" ? (
              <CheckCircle className="w-5 h-5 text-emerald-400" />
            ) : (
              <XCircle className="w-5 h-5 text-rose-400" />
            )}
            <div>
              <div className="text-xs font-bold uppercase">{toastMessage.title}</div>
              <div className="text-xs mt-0.5 opacity-90">{toastMessage.desc}</div>
            </div>
          </div>
          <button
            onClick={() => setToastMessage(null)}
            className="text-xs opacity-60 hover:opacity-100 px-2"
          >
            ✕
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-semibold uppercase tracking-wider mb-2">
            <ArrowRightLeft className="w-3.5 h-3.5" />
            Dual-User P2P Simulation
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Тестирование P2P Перевода между двумя пользователями
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl">
            Выберите отправителя и получателя, настройте сумму, время и параметры безопасности. Система мгновенно рассчитает риск-скор и покажет, почему платеж безопасен или заблокирован.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowRegisterModal(true)}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 text-xs font-semibold transition-all"
          >
            <UserPlus className="w-4 h-4 text-blue-400" />
            <span>+ Добавить человека</span>
          </button>
          <button
            onClick={() => {
              P2PService.resetDemoData();
              refreshData();
              setToastMessage({
                title: "Данные сброшены",
                desc: "Балансы Алисы и Бориса возвращены в исходное состояние.",
                type: "warning"
              });
            }}
            className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800 text-xs transition-all"
            title="Сбросить демо-балансы"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Two Users Cards (Alice & Boris) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Sender Card */}
        <div
          className={`p-5 rounded-2xl border transition-all ${
            sender ? "bg-slate-900/80 border-blue-500/40 shadow-lg shadow-blue-500/5" : "bg-slate-900/40 border-slate-800"
          }`}
        >
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-400 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-blue-500" />
              1. Отправитель (Sender)
            </span>
            <select
              value={senderId}
              onChange={(e) => handleSenderChange(e.target.value)}
              className="bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-slate-200 outline-none"
            >
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name} ({u.role})
                </option>
              ))}
            </select>
          </div>

          {sender && (
            <div className="mt-4 flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center text-2xl shadow-inner">
                {sender.avatar}
              </div>
              <div className="flex-1">
                <div className="text-sm font-bold text-white flex items-center gap-2">
                  {sender.name}
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
                    {sender.role}
                  </span>
                </div>
                <div className="text-xs text-slate-400 mt-0.5">{sender.email}</div>
                <div className="mt-2 flex items-center gap-4 text-xs font-mono">
                  <div>
                    <span className="text-slate-500 text-[10px] block">Текущий баланс:</span>
                    <span className="font-bold text-emerald-400 text-sm">
                      {sender.balance.toLocaleString("ru-RU")} ₸
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[10px] block">Средний чек:</span>
                    <span className="text-slate-300">
                      {sender.avgAmount.toLocaleString("ru-RU")} ₸
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Recipient Card */}
        <div
          className={`p-5 rounded-2xl border transition-all ${
            recipient ? "bg-slate-900/80 border-indigo-500/40 shadow-lg shadow-indigo-500/5" : "bg-slate-900/40 border-slate-800"
          }`}
        >
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-indigo-500" />
              2. Получатель (Recipient)
            </span>
            <select
              value={recipientId}
              onChange={(e) => {
                setRecipientId(e.target.value);
                // If selecting drop user, toggle new recipient
                if (e.target.value === "usr_drop") {
                  setIsNewRecipient(true);
                } else {
                  setIsNewRecipient(false);
                }
              }}
              className="bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-slate-200 outline-none"
            >
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name} ({u.role})
                </option>
              ))}
            </select>
          </div>

          {recipient && (
            <div className="mt-4 flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center text-2xl shadow-inner">
                {recipient.avatar}
              </div>
              <div className="flex-1">
                <div className="text-sm font-bold text-white flex items-center gap-2">
                  {recipient.name}
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                    {recipient.role}
                  </span>
                </div>
                <div className="text-xs text-slate-400 mt-0.5">{recipient.email}</div>
                <div className="mt-2 flex items-center gap-4 text-xs font-mono">
                  <div>
                    <span className="text-slate-500 text-[10px] block">Баланс получателя:</span>
                    <span className="font-bold text-indigo-300 text-sm">
                      {recipient.balance.toLocaleString("ru-RU")} ₸
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[10px] block">Статус контакта:</span>
                    <span className={isNewRecipient ? "text-rose-400" : "text-emerald-400"}>
                      {isNewRecipient ? "Новый (неизвестный)" : "В адресной книге"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Transfer Parameters & Live Risk HUD */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Form: Transfer Setup (6 cols) */}
        <div className="lg:col-span-6 bg-slate-900/70 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5">
          <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-200 flex items-center gap-2">
              <Wallet className="w-4 h-4 text-blue-400" />
              Параметры P2P перевода
            </h2>
            <span className="text-[11px] text-slate-500 font-mono">Real-time Hook</span>
          </div>

          {/* Amount Slider & Presets */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-slate-300 flex justify-between">
              <span>Сумма перевода:</span>
              <span className="font-mono text-base font-bold text-blue-400">
                {amount.toLocaleString("ru-RU")} ₸
              </span>
            </label>
            <input
              type="range"
              min="5000"
              max="1500000"
              step="5000"
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
            />
            {/* Quick amount chips */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              {[25000, 75000, 250000, 850000, 1200000].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setAmount(preset)}
                  className={`text-[11px] px-2.5 py-1 rounded-md border font-mono transition-colors ${
                    amount === preset
                      ? "bg-blue-600 text-white border-blue-500"
                      : "bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700"
                  }`}
                >
                  {preset.toLocaleString("ru-RU")} ₸
                </button>
              ))}
            </div>
          </div>

          {/* Time Picker */}
          <div className="space-y-2 pt-2 border-t border-slate-800">
            <label className="text-xs font-medium text-slate-300 flex justify-between">
              <span>Время перевода:</span>
              <span className="font-mono text-xs font-bold text-amber-400">
                {String(hour).padStart(2, "0")}:{String(minute).padStart(2, "0")}
              </span>
            </label>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] text-slate-400">Час (0 - 23):</label>
                <input
                  type="number"
                  min="0"
                  max="23"
                  value={hour}
                  onChange={(e) => setHour(Math.min(23, Math.max(0, Number(e.target.value))))}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white font-mono focus:border-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-400">Минуты (0 - 59):</label>
                <input
                  type="number"
                  min="0"
                  max="59"
                  value={minute}
                  onChange={(e) => setMinute(Math.min(59, Math.max(0, Number(e.target.value))))}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white font-mono focus:border-blue-500 outline-none"
                />
              </div>
            </div>
            {/* Quick time buttons */}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => { setHour(2); setMinute(43); }}
                className="text-[10px] px-2 py-0.5 rounded bg-rose-950/60 border border-rose-800 text-rose-300 hover:bg-rose-900/60"
              >
                02:43 (Ночной пик фрода)
              </button>
              <button
                type="button"
                onClick={() => { setHour(14); setMinute(15); }}
                className="text-[10px] px-2 py-0.5 rounded bg-emerald-950/60 border border-emerald-800 text-emerald-300 hover:bg-emerald-900/60"
              >
                14:15 (Рабочее время)
              </button>
            </div>
          </div>

          {/* Memo & Text Vectorizer field */}
          <div className="space-y-1.5 pt-2 border-t border-slate-800">
            <label className="text-xs font-medium text-slate-300 flex justify-between">
              <span>Сообщение получателю (Memo):</span>
              <span className="text-[10px] text-slate-500">TF-IDF Vectorizer</span>
            </label>
            <input
              type="text"
              value={memoText}
              onChange={(e) => setMemoText(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:border-blue-500 outline-none"
              placeholder="Назначение платежа..."
            />
            <div className="flex flex-wrap gap-1.5">
              {[
                "Перевод за обед",
                "Возврат долга",
                "Срочный обмен крипты P2P USDT",
                "Вывод без комиссии"
              ].map((txt) => (
                <button
                  key={txt}
                  type="button"
                  onClick={() => setMemoText(txt)}
                  className="text-[10px] px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-slate-400 hover:text-slate-200"
                >
                  {txt}
                </button>
              ))}
            </div>
          </div>

          {/* Risk Toggles */}
          <div className="space-y-2 pt-2 border-t border-slate-800">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-300">Новый получатель (не в списке контактов):</span>
              <button
                type="button"
                onClick={() => setIsNewRecipient(!isNewRecipient)}
                className={`relative inline-flex h-5 w-10 items-center rounded-full transition-colors ${
                  isNewRecipient ? "bg-rose-600" : "bg-slate-700"
                }`}
              >
                <span
                  className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                    isNewRecipient ? "translate-x-5" : "translate-x-1"
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-300">Вход с нового смартфона/ПК:</span>
              <button
                type="button"
                onClick={() => setIsNewDevice(!isNewDevice)}
                className={`relative inline-flex h-5 w-10 items-center rounded-full transition-colors ${
                  isNewDevice ? "bg-amber-600" : "bg-slate-700"
                }`}
              >
                <span
                  className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                    isNewDevice ? "translate-x-5" : "translate-x-1"
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-300">Зарубежный IP или VPN:</span>
              <button
                type="button"
                onClick={() => setIsForeignIp(!isForeignIp)}
                className={`relative inline-flex h-5 w-10 items-center rounded-full transition-colors ${
                  isForeignIp ? "bg-rose-600" : "bg-slate-700"
                }`}
              >
                <span
                  className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                    isForeignIp ? "translate-x-5" : "translate-x-1"
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Submit Action Button */}
          <button
            onClick={handleExecuteTransfer}
            className={`w-full py-3.5 rounded-xl font-bold text-xs uppercase tracking-wider shadow-lg transition-all flex items-center justify-center gap-2 active:scale-98 ${
              liveRisk?.riskLevel === "HIGH"
                ? "bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/30"
                : liveRisk?.riskLevel === "MEDIUM"
                ? "bg-amber-600 hover:bg-amber-500 text-white shadow-amber-600/30"
                : "bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/30"
            }`}
          >
            <Send className="w-4 h-4" />
            <span>
              {liveRisk?.riskLevel === "HIGH"
                ? "Отправить (Система заблокирует!)"
                : liveRisk?.riskLevel === "MEDIUM"
                ? "Отправить (Потребуется 2FA код)"
                : "Выполнить безопасный перевод"}
            </span>
          </button>
        </div>

        {/* Right HUD: Live Risk & SHAP Factor Breakdown (6 cols) */}
        <div className="lg:col-span-6 space-y-6">
          {liveRisk && (
            <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
              <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-200 flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-purple-400" />
                  Предиктивный скоринг в реальном времени
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-950 text-purple-400 border border-purple-800">
                  TreeSHAP Engine
                </span>
              </div>

              {/* Gauge Score Display */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                <div>
                  <div className="text-xs text-slate-400 uppercase font-semibold">Уровень риска (Fraud Risk):</div>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-3xl font-black font-mono text-white">
                      {liveRisk.fraudRiskScore}%
                    </span>
                    <span
                      className={`text-xs font-bold uppercase px-2 py-0.5 rounded border ${liveRisk.decisionBadgeColor}`}
                    >
                      {liveRisk.riskLevel} RISK
                    </span>
                  </div>
                  <div className="text-xs text-slate-300 mt-1">
                    Статус: <span className="font-semibold text-white">{liveRisk.decision}</span>
                  </div>
                </div>

                {/* Visual Risk Bar Gauge */}
                <div className="w-28 text-right">
                  <div className="text-[10px] text-slate-500 font-mono mb-1">Шкала 0 - 100</div>
                  <div className="w-full bg-slate-800 h-3 rounded-full overflow-hidden flex">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        liveRisk.riskLevel === "HIGH"
                          ? "bg-rose-500 glow-rose"
                          : liveRisk.riskLevel === "MEDIUM"
                          ? "bg-amber-500 glow-amber"
                          : "bg-emerald-500 glow-emerald"
                      }`}
                      style={{ width: `${liveRisk.fraudRiskScore}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[9px] text-slate-600 font-mono mt-1">
                    <span>0 (Безопасно)</span>
                    <span>100 (Фрод)</span>
                  </div>
                </div>
              </div>

              {/* Natural Language XAI Explanation */}
              <div className="p-3.5 rounded-xl bg-slate-950/80 border border-blue-500/20 space-y-1.5">
                <div className="text-xs font-bold text-blue-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                  Автоматическое объяснение (XAI):
                </div>
                <p className="text-xs text-slate-200 leading-relaxed font-sans">
                  {liveRisk.riskExplanation}
                </p>
              </div>

              {/* SHAP Factor Waterfall */}
              <div className="space-y-2.5">
                <div className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Факторы, повлиявшие на решение (SHAP Values):
                </div>
                <div className="space-y-2">
                  {liveRisk.shapContributions.slice(0, 5).map((factor, idx) => {
                    const isUp = factor.direction === "UP";
                    return (
                      <div
                        key={idx}
                        className="p-2.5 rounded-lg bg-slate-950 border border-slate-800/80 space-y-1 text-xs"
                      >
                        <div className="flex justify-between">
                          <span className="font-medium text-slate-200">{factor.name}</span>
                          <span
                            className={`font-mono font-bold ${
                              isUp ? "text-rose-400" : "text-emerald-400"
                            }`}
                          >
                            {isUp ? `+${factor.impactScore}%` : `${factor.impactScore}%`}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-400">{factor.detail}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Transaction History Section */}
      <section className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Clock className="w-5 h-5 text-blue-400" />
              История P2P операций & Журнал антифрода
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Все проведенные и заблокированные транзакции с присвоенными скоринг-оценками
            </p>
          </div>
          <span className="text-xs font-mono text-slate-400">
            Всего записей: {history.length}
          </span>
        </div>

        {history.length === 0 ? (
          <div className="text-center py-8 text-xs text-slate-500">
            История пуста. Настройте параметры выше и нажмите «Выполнить перевод»!
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/80 text-slate-400 font-semibold border-b border-slate-800 uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="py-2.5 px-3">ID / Время</th>
                  <th className="py-2.5 px-3">Отправитель → Получатель</th>
                  <th className="py-2.5 px-3">Сумма</th>
                  <th className="py-2.5 px-3">Назначение</th>
                  <th className="py-2.5 px-3">Fraud Risk</th>
                  <th className="py-2.5 px-3">Статус</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {history.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-3 px-3 text-slate-300">
                      <div className="font-bold text-white">{tx.id}</div>
                      <div className="text-[10px] text-slate-500">{tx.timeFormatted}</div>
                    </td>
                    <td className="py-3 px-3 text-slate-300 font-sans">
                      <div>{tx.senderName} → {tx.recipientName}</div>
                      {tx.isNewRecipient && (
                        <span className="text-[9px] text-rose-400 font-mono">Новый получатель</span>
                      )}
                    </td>
                    <td className="py-3 px-3 font-bold text-white">
                      {tx.amount.toLocaleString("ru-RU")} ₸
                    </td>
                    <td className="py-3 px-3 font-sans text-slate-400 max-w-xs truncate">
                      {tx.memoText}
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[11px] font-bold border ${tx.fraudAnalysis.decisionBadgeColor}`}
                      >
                        {tx.fraudAnalysis.fraudRiskScore}% ({tx.fraudAnalysis.riskLevel})
                      </span>
                    </td>
                    <td className="py-3 px-3 font-sans">
                      {tx.status === "COMPLETED" ? (
                        <span className="text-emerald-400 font-semibold flex items-center gap-1">
                          <CheckCircle className="w-3.5 h-3.5" /> Выполнен
                        </span>
                      ) : tx.status === "REQUIRES_2FA" ? (
                        <span className="text-amber-400 font-semibold flex items-center gap-1">
                          <KeyRound className="w-3.5 h-3.5" /> Ожидает 2FA
                        </span>
                      ) : (
                        <span className="text-rose-400 font-semibold flex items-center gap-1">
                          <XCircle className="w-3.5 h-3.5" /> Заблокирован
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* 2FA Confirmation Modal */}
      {pending2FATxn && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-amber-400 border-b border-slate-800 pb-3">
              <Smartphone className="w-6 h-6" />
              <div>
                <h3 className="text-base font-bold text-white">Требуется 2FA подтверждение</h3>
                <p className="text-xs text-slate-400">Система зафиксировала пограничный риск</p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 space-y-1">
              <div>Перевод: <span className="font-bold text-white">{pending2FATxn.amount.toLocaleString()} ₸</span></div>
              <div>Получатель: <span className="font-bold text-white">{pending2FATxn.recipientName}</span></div>
              <div>Риск-скор: <span className="font-bold text-amber-400">{pending2FATxn.fraudAnalysis.fraudRiskScore}% (MEDIUM)</span></div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs text-slate-300 font-medium">Введите тестовый SMS-код:</label>
              <input
                type="text"
                value={enteredOtp}
                onChange={(e) => setEnteredOtp(e.target.value)}
                placeholder="Введите 123456"
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-center text-lg font-mono tracking-widest text-white focus:border-amber-500 outline-none"
              />
              <div className="text-[10px] text-slate-500 text-center">
                Демо-код подтверждения: <span className="text-amber-400 font-mono font-bold">123456</span>
              </div>
              {otpError && <p className="text-xs text-rose-400 text-center">{otpError}</p>}
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setPending2FATxn(null)}
                className="flex-1 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
              >
                Отмена
              </button>
              <button
                onClick={handleConfirm2FA}
                className="flex-1 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold shadow-lg shadow-amber-600/30"
              >
                Подтвердить
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Register User Modal */}
      {showRegisterModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <form
            onSubmit={handleRegisterUser}
            className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-blue-400" />
                Регистрация нового человека для теста
              </h3>
              <button
                type="button"
                onClick={() => setShowRegisterModal(false)}
                className="text-slate-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs text-slate-300 font-medium">Имя и фамилия:</label>
              <input
                type="text"
                required
                value={newUserName}
                onChange={(e) => setNewUserName(e.target.value)}
                placeholder="Например: Касым Жомарт"
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:border-blue-500 outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs text-slate-300 font-medium">Email:</label>
              <input
                type="email"
                value={newUserEmail}
                onChange={(e) => setNewUserEmail(e.target.value)}
                placeholder="user@example.kz"
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:border-blue-500 outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs text-slate-300 font-medium">Стартовый баланс (₸):</label>
              <input
                type="number"
                min="10000"
                step="10000"
                value={newUserBalance}
                onChange={(e) => setNewUserBalance(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs font-mono text-white focus:border-blue-500 outline-none"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowRegisterModal(false)}
                className="flex-1 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
              >
                Отмена
              </button>
              <button
                type="submit"
                className="flex-1 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-lg shadow-blue-600/30"
              >
                Зарегистрировать
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
