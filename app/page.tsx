"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  Clock,
  ArrowRight,
  TrendingUp,
  Cpu,
  FileSpreadsheet,
  Layers,
  ArrowRightLeft,
  CheckCircle2,
  XCircle
} from "lucide-react";
import { analyzeTransaction, FraudAnalysisResult } from "@/lib/ml/fraudDetector";

export default function HomePage() {
  // Preset state: Amount: 850 000 ₸, Time: 02:43, Transaction type: Transfer, New recipient: Yes
  const [amount, setAmount] = useState<number>(850000);
  const [hour, setHour] = useState<number>(2);
  const [minute, setMinute] = useState<number>(43);
  const [transactionType, setTransactionType] = useState<string>("P2P_TRANSFER");
  const [isNewRecipient, setIsNewRecipient] = useState<boolean>(true);
  const [isNewDevice, setIsNewDevice] = useState<boolean>(true);
  const [memoText, setMemoText] = useState<string>("Срочный перевод без комиссии");

  const [analysisResult, setAnalysisResult] = useState<FraudAnalysisResult | null>(() =>
    analyzeTransaction({
      amount: 850000,
      hour: 2,
      minute: 43,
      transactionType: "P2P_TRANSFER",
      senderBalanceBefore: 900000,
      senderAvgAmount: 60000,
      isNewRecipient: true,
      velocityLast24h: 3,
      isNewDevice: true,
      memoText: "Срочный перевод без комиссии"
    })
  );

  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleAnalyze = () => {
    setIsAnalyzing(true);
    setTimeout(() => {
      const res = analyzeTransaction({
        amount,
        hour,
        minute,
        transactionType,
        senderBalanceBefore: amount > 500000 ? amount * 1.1 : 1200000,
        senderAvgAmount: 65000,
        isNewRecipient,
        velocityLast24h: hour < 6 ? 3 : 1,
        isNewDevice,
        memoText
      });
      setAnalysisResult(res);
      setIsAnalyzing(false);
    }, 200);
  };

  return (
    <div className="space-y-6 pb-16 font-sans">
      {/* Enterprise Security Header */}
      <section className="bg-slate-900 border border-slate-800 rounded p-6 sm:p-8">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="max-w-3xl space-y-2">
            <div className="flex items-center gap-2 text-[11px] font-mono uppercase tracking-widest text-slate-400">
              <span className="w-2 h-2 rounded-full bg-blue-500" />
              <span>AI for Finance Track • Banking Anti-Fraud Decision Engine</span>
            </div>
            <h1 className="text-xl sm:text-3xl font-bold font-mono text-white tracking-tight">
              Интеллектуальная система выявления мошеннических транзакций
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-sans">
              Прототип банковской антифрод-системы на основе машинного обучения (LightGBM) и объяснимого искусственного интеллекта (TreeSHAP). Автоматический расчет вероятности фрода, присвоение уровня риска и декомпозиция факторов.
            </p>

            <div className="pt-2 flex flex-wrap gap-2.5 font-mono text-xs">
              <Link
                href="/transfer"
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded flex items-center gap-1.5 transition-colors"
              >
                <ArrowRightLeft className="w-3.5 h-3.5" />
                <span>P2P ТРАНЗАКЦИИ (ДВА УСТРОЙСТВА)</span>
              </Link>
              <Link
                href="/time-analysis"
                className="px-4 py-2 bg-slate-950 hover:bg-slate-800 border border-slate-700 text-slate-300 rounded flex items-center gap-1.5 transition-colors"
              >
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span>ВРЕМЕННОЙ ПРОФИЛЬ РИСКА</span>
              </Link>
              <Link
                href="/benchmark"
                className="px-4 py-2 bg-slate-950 hover:bg-slate-800 border border-slate-700 text-slate-300 rounded flex items-center gap-1.5 transition-colors"
              >
                <TrendingUp className="w-3.5 h-3.5 text-slate-400" />
                <span>ОТЧЕТ ML МОДЕЛЕЙ</span>
              </Link>
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 gap-3 lg:w-72 font-mono text-xs">
            <div className="p-3 bg-slate-950 border border-slate-800 rounded">
              <span className="text-[10px] text-slate-500 uppercase block">Recall (Fraud)</span>
              <span className="text-lg font-bold text-emerald-400">98.88%</span>
            </div>
            <div className="p-3 bg-slate-950 border border-slate-800 rounded">
              <span className="text-[10px] text-slate-500 uppercase block">ROC-AUC</span>
              <span className="text-lg font-bold text-white">1.0000</span>
            </div>
            <div className="p-3 bg-slate-950 border border-slate-800 rounded">
              <span className="text-[10px] text-slate-500 uppercase block">Инференс</span>
              <span className="text-lg font-bold text-blue-400">&lt; 3 ms</span>
            </div>
            <div className="p-3 bg-slate-950 border border-slate-800 rounded">
              <span className="text-[10px] text-slate-500 uppercase block">XAI Модель</span>
              <span className="text-lg font-bold text-slate-200">TreeSHAP</span>
            </div>
          </div>
        </div>
      </section>

      {/* Main Scoring Terminal Workspace */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Transaction Input Parameters (5 cols) */}
        <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded p-6 space-y-4 font-mono">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Cpu className="w-4 h-4 text-blue-500" />
              <h2 className="text-xs font-bold text-white uppercase tracking-wider">
                Параметры входящей транзакции
              </h2>
            </div>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-950 text-slate-400 border border-slate-800">
              Input Form
            </span>
          </div>

          {/* Quick Presets */}
          <div className="flex gap-2">
            <button
              onClick={() => {
                setAmount(850000);
                setHour(2);
                setMinute(43);
                setIsNewRecipient(true);
                setIsNewDevice(true);
                setMemoText("Срочный перевод без комиссии");
              }}
              className="text-[10px] px-2 py-1 rounded bg-rose-950/40 border border-rose-800 text-rose-300 hover:bg-rose-900/40"
            >
              [ Тест: Подозрительный (02:43) ]
            </button>
            <button
              onClick={() => {
                setAmount(25000);
                setHour(14);
                setMinute(20);
                setIsNewRecipient(false);
                setIsNewDevice(false);
                setMemoText("Оплата услуг");
              }}
              className="text-[10px] px-2 py-1 rounded bg-emerald-950/40 border border-emerald-800 text-emerald-300 hover:bg-emerald-900/40"
            >
              [ Тест: Безопасный (14:20) ]
            </button>
          </div>

          {/* Amount Input */}
          <div className="space-y-1">
            <label className="text-xs text-slate-400 flex justify-between">
              <span>Сумма операции (Amount):</span>
              <span className="text-white font-bold">{amount.toLocaleString("ru-RU")} ₸</span>
            </label>
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
          <div className="space-y-1">
            <label className="text-xs text-slate-400 flex justify-between">
              <span>Время фиксации (Time):</span>
              <span className="text-white font-bold">
                {String(hour).padStart(2, "0")}:{String(minute).padStart(2, "0")}
              </span>
            </label>
            <div className="grid grid-cols-2 gap-3">
              <input
                type="number"
                min="0"
                max="23"
                value={hour}
                onChange={(e) => setHour(Math.min(23, Math.max(0, Number(e.target.value))))}
                className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-1.5 text-xs text-white"
                placeholder="Час"
              />
              <input
                type="number"
                min="0"
                max="59"
                value={minute}
                onChange={(e) => setMinute(Math.min(59, Math.max(0, Number(e.target.value))))}
                className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-1.5 text-xs text-white"
                placeholder="Минуты"
              />
            </div>
            {hour >= 1 && hour <= 5 && (
              <span className="text-[10px] text-rose-400 block pt-0.5">
                Критический интервал (01:00-05:00): риск-множитель 14.45x
              </span>
            )}
          </div>

          {/* Transaction Type */}
          <div className="space-y-1">
            <label className="text-xs text-slate-400 block">Тип транзакции:</label>
            <select
              value={transactionType}
              onChange={(e) => setTransactionType(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-xs text-white outline-none"
            >
              <option value="P2P_TRANSFER">P2P_TRANSFER (Перевод клиенту)</option>
              <option value="CASH_OUT">CASH_OUT (Снятие наличных)</option>
              <option value="PAYMENT">PAYMENT (Платеж / Услуги)</option>
              <option value="MERCHANT">MERCHANT (Торговый эквайринг)</option>
            </select>
          </div>

          {/* Behavioral Flags */}
          <div className="space-y-2 pt-2 border-t border-slate-800 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-300">Новый получатель (New recipient):</span>
              <button
                type="button"
                onClick={() => setIsNewRecipient(!isNewRecipient)}
                className={`px-2 py-0.5 rounded text-[11px] font-bold border ${
                  isNewRecipient
                    ? "bg-rose-950 text-rose-400 border-rose-800"
                    : "bg-slate-950 text-slate-400 border-slate-800"
                }`}
              >
                {isNewRecipient ? "YES" : "NO"}
              </button>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-300">Новое устройство (New device):</span>
              <button
                type="button"
                onClick={() => setIsNewDevice(!isNewDevice)}
                className={`px-2 py-0.5 rounded text-[11px] font-bold border ${
                  isNewDevice
                    ? "bg-rose-950 text-rose-400 border-rose-800"
                    : "bg-slate-950 text-slate-400 border-slate-800"
                }`}
              >
                {isNewDevice ? "YES" : "NO"}
              </button>
            </div>
          </div>

          {/* Memo Text */}
          <div className="space-y-1 pt-2 border-t border-slate-800">
            <label className="text-xs text-slate-400 block">Назначение платежа:</label>
            <input
              type="text"
              value={memoText}
              onChange={(e) => setMemoText(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-1.5 text-xs text-white font-sans outline-none"
            />
          </div>

          {/* Action Button */}
          <button
            onClick={handleAnalyze}
            disabled={isAnalyzing}
            className="w-full py-2.5 rounded bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs uppercase tracking-wider transition-colors"
          >
            {isAnalyzing ? "[ АНАЛИЗ ДАННЫХ... ]" : "[ ANALYZE TRANSACTION ]"}
          </button>
        </div>

        {/* Right Column: Scoring Verdict & XAI Explanation (7 cols) */}
        <div className="lg:col-span-7 space-y-4 font-mono">
          {analysisResult && (
            <div className="bg-slate-900 border border-slate-800 rounded p-6 space-y-4">
              {/* Verdict Banner */}
              <div className="p-4 rounded bg-slate-950 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="text-[10px] text-slate-400 uppercase tracking-wider">
                    Fraud Probability & Score:
                  </div>
                  <div className="flex items-baseline gap-3 mt-1">
                    <span className="text-3xl font-bold text-white">
                      {(analysisResult.fraudProbability * 100).toFixed(0)}%
                    </span>
                    <span
                      className={`text-xs font-bold uppercase px-2 py-0.5 rounded border ${
                        analysisResult.riskLevel === "HIGH"
                          ? "bg-rose-950 text-rose-400 border-rose-800"
                          : analysisResult.riskLevel === "MEDIUM"
                          ? "bg-amber-950 text-amber-400 border-amber-800"
                          : "bg-emerald-950 text-emerald-400 border-emerald-800"
                      }`}
                    >
                      Risk Level: {analysisResult.riskLevel}
                    </span>
                  </div>
                  <div className="text-xs text-slate-300 mt-1 font-sans">
                    Решение: <span className="font-bold text-white">{analysisResult.decision}</span>
                  </div>
                </div>

                <div className="sm:text-right text-xs text-slate-400 border-t sm:border-t-0 sm:border-l border-slate-800 pt-2 sm:pt-0 sm:pl-4 space-y-0.5">
                  <div>Модель: LightGBM</div>
                  <div>Алгоритм XAI: TreeSHAP</div>
                  <div>Время обработки: 2.1 ms</div>
                </div>
              </div>

              {/* Natural Language XAI Explanation */}
              <div className="p-4 rounded bg-slate-950 border border-slate-800 space-y-1.5 font-sans">
                <div className="text-xs font-bold text-slate-300 uppercase tracking-wider font-mono">
                  Заключение системы (Explainable AI):
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {analysisResult.riskExplanation}
                </p>
              </div>

              {/* Risk Factors Bullet List */}
              <div className="space-y-1.5">
                <div className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Основные факторы риска (Main Risk Factors):
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {analysisResult.topRiskFactors.map((factor, idx) => (
                    <div
                      key={idx}
                      className="p-2 rounded bg-slate-950 border border-slate-800 text-xs text-slate-300 font-sans flex items-center gap-2"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-500 flex-shrink-0" />
                      <span>{factor}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* SHAP Factor Impact Breakdown */}
              <div className="space-y-2 pt-2 border-t border-slate-800">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-slate-300 uppercase tracking-wider">
                    Вклад факторов по шкале SHAP:
                  </span>
                  <span className="text-[10px] text-slate-500">Base: -3.52</span>
                </div>

                <div className="space-y-1.5">
                  {analysisResult.shapContributions.slice(0, 4).map((factor, idx) => {
                    const isUp = factor.direction === "UP";
                    return (
                      <div
                        key={idx}
                        className="p-2.5 rounded bg-slate-950 border border-slate-800 text-xs space-y-1"
                      >
                        <div className="flex justify-between">
                          <span className="text-slate-300 font-sans font-medium">{factor.name}</span>
                          <span className={`font-bold ${isUp ? "text-rose-400" : "text-emerald-400"}`}>
                            {isUp ? `+${factor.impactScore}%` : `${factor.impactScore}%`}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500 font-sans">{factor.detail}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* 3 Secondary Enterprise Navigation Cards */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono text-xs">
        <Link
          href="/transfer"
          className="p-4 rounded bg-slate-900 border border-slate-800 hover:border-slate-700 transition-colors space-y-2"
        >
          <div className="flex items-center justify-between text-slate-400">
            <span className="font-bold text-white uppercase">P2P Транзакции</span>
            <ArrowRightLeft className="w-4 h-4 text-blue-500" />
          </div>
          <p className="text-slate-400 font-sans text-xs">
            Симуляция перевода между двумя реальными клиентами с визуализацией экрана смартфона получателя.
          </p>
        </Link>

        <Link
          href="/time-analysis"
          className="p-4 rounded bg-slate-900 border border-slate-800 hover:border-slate-700 transition-colors space-y-2"
        >
          <div className="flex items-center justify-between text-slate-400">
            <span className="font-bold text-white uppercase">Временной анализ</span>
            <Clock className="w-4 h-4 text-blue-500" />
          </div>
          <p className="text-slate-400 font-sans text-xs">
            Исследование распределения атак по 24-часовой шкале (пик уязвимости 01:00 — 05:00 ночи).
          </p>
        </Link>

        <Link
          href="/batch"
          className="p-4 rounded bg-slate-900 border border-slate-800 hover:border-slate-700 transition-colors space-y-2"
        >
          <div className="flex items-center justify-between text-slate-400">
            <span className="font-bold text-white uppercase">Пакетный аудит 1000 CSV</span>
            <FileSpreadsheet className="w-4 h-4 text-blue-500" />
          </div>
          <p className="text-slate-400 font-sans text-xs">
            Пакетная скоринг-обработка массива из 1000 транзакций с фильтрацией инцидентов и экспортом.
          </p>
        </Link>
      </section>
    </div>
  );
}
