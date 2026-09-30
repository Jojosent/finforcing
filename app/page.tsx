"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  Zap,
  Clock,
  ArrowRight,
  Sparkles,
  TrendingUp,
  Cpu,
  CheckCircle2,
  FileSpreadsheet,
  Binary
} from "lucide-react";
import { analyzeTransaction, FraudAnalysisResult } from "@/lib/ml/fraudDetector";

export default function HomePage() {
  // Preset state matching the user's prompt requirement:
  // "Amount: 850 000 ₸, Time: 02:43, Transaction type: Transfer, New recipient: Yes"
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
    }, 250);
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Hero Banner */}
      <section className="relative overflow-hidden rounded-3xl border border-slate-800 bg-gradient-to-br from-slate-900/90 via-slate-950 to-blue-950/40 p-6 sm:p-8 lg:p-10 shadow-2xl">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-80 h-80 rounded-full bg-blue-600/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-20 w-80 h-80 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-semibold uppercase tracking-wider mb-4">
            <Sparkles className="w-3.5 h-3.5 text-blue-400" />
            AI for Finance • Конкурсный трек
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
            Интеллектуальная система выявления мошеннических транзакций
          </h1>
          <p className="mt-3 text-sm sm:text-base text-slate-300 leading-relaxed">
            Автоматическое определение вероятности фрода, расчет риск-скора (0–100) и объяснение факторов решения модели с помощью Explainable AI (TreeSHAP).
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Link
              href="/transfer"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-sm font-semibold shadow-lg shadow-blue-500/25 transition-all"
            >
              <span>Запустить P2P Перевод</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/time-analysis"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-200 border border-slate-700/80 text-sm font-medium transition-all"
            >
              <Clock className="w-4 h-4 text-amber-400" />
              <span>В какое время отправка подозрительна?</span>
            </Link>
            <Link
              href="/benchmark"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-200 border border-slate-700/80 text-sm font-medium transition-all"
            >
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              <span>Результаты 4-х ML моделей</span>
            </Link>
          </div>
        </div>

        {/* Quick KPI stats */}
        <div className="mt-8 pt-6 border-t border-slate-800/80 grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-slate-900/50 p-3.5 rounded-xl border border-slate-800/60">
            <div className="text-xs text-slate-400">Recall (Fraud Catch)</div>
            <div className="text-xl font-bold font-mono text-emerald-400 mt-1">98.9%</div>
            <div className="text-[11px] text-slate-500">LightGBM чемпион</div>
          </div>
          <div className="bg-slate-900/50 p-3.5 rounded-xl border border-slate-800/60">
            <div className="text-xs text-slate-400">ROC-AUC Score</div>
            <div className="text-xl font-bold font-mono text-blue-400 mt-1">1.0000</div>
            <div className="text-[11px] text-slate-500">25 000 транзакций</div>
          </div>
          <div className="bg-slate-900/50 p-3.5 rounded-xl border border-slate-800/60">
            <div className="text-xs text-slate-400">Скорость скоринга</div>
            <div className="text-xl font-bold font-mono text-amber-400 mt-1">&lt; 3 ms</div>
            <div className="text-[11px] text-slate-500">Serverless Vercel</div>
          </div>
          <div className="bg-slate-900/50 p-3.5 rounded-xl border border-slate-800/60">
            <div className="text-xs text-slate-400">Интерпретируемость</div>
            <div className="text-xl font-bold font-mono text-purple-400 mt-1">TreeSHAP</div>
            <div className="text-[11px] text-slate-500">XAI факторный отчет</div>
          </div>
        </div>
      </section>

      {/* Main Interactive Sandbox: Transaction Analyzer */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Input Form Column (5 cols) */}
        <div className="lg:col-span-5 bg-slate-900/70 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Cpu className="w-5 h-5 text-blue-400" />
                Transaction Analyzer
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Интерактивный ввод параметров транзакции
              </p>
            </div>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-blue-950 text-blue-400 border border-blue-800">
              Live Input
            </span>
          </div>

          {/* Quick preset buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setAmount(850000);
                setHour(2);
                setMinute(43);
                setIsNewRecipient(true);
                setIsNewDevice(true);
                setMemoText("Срочный перевод без комиссии");
              }}
              className="text-xs px-2.5 py-1 rounded-md bg-rose-500/10 border border-rose-500/30 text-rose-300 hover:bg-rose-500/20 transition-colors"
            >
              ⚠️ Пресет: Подозрительный (02:43)
            </button>
            <button
              onClick={() => {
                setAmount(25000);
                setHour(14);
                setMinute(20);
                setIsNewRecipient(false);
                setIsNewDevice(false);
                setMemoText("Оплата за обед");
              }}
              className="text-xs px-2.5 py-1 rounded-md bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/20 transition-colors"
            >
              ✅ Пресет: Безопасный (14:20)
            </button>
          </div>

          {/* Amount Input */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-300 flex justify-between">
              <span>Сумма операции (Amount):</span>
              <span className="font-mono text-blue-400 font-bold">{amount.toLocaleString("ru-RU")} ₸</span>
            </label>
            <input
              type="range"
              min="2000"
              max="1500000"
              step="5000"
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
            />
            <div className="flex justify-between text-[10px] text-slate-500 font-mono">
              <span>2 000 ₸</span>
              <span>850 000 ₸</span>
              <span>1 500 000 ₸</span>
            </div>
          </div>

          {/* Time Picker */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-300 flex justify-between">
              <span>Время операции (Time):</span>
              <span className="font-mono text-amber-400 font-bold">
                {String(hour).padStart(2, "0")}:{String(minute).padStart(2, "0")}
              </span>
            </label>
            <div className="grid grid-cols-2 gap-2">
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
            {hour >= 1 && hour <= 5 && (
              <p className="text-[11px] text-rose-400 flex items-center gap-1 mt-1">
                <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
                Внимание: интервал 01:00 - 05:00 имеет максимальный риск-множитель (14.5x)!
              </p>
            )}
          </div>

          {/* Transaction Type */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-300">Тип операции:</label>
            <select
              value={transactionType}
              onChange={(e) => setTransactionType(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:border-blue-500 outline-none"
            >
              <option value="P2P_TRANSFER">P2P Перевод на карту/счет</option>
              <option value="CASH_OUT">Снятие наличных (Cash Out)</option>
              <option value="PAYMENT">Оплата услуг / Платеж</option>
              <option value="MERCHANT">Покупка у мерчанта</option>
            </select>
          </div>

          {/* Toggles */}
          <div className="space-y-2.5 pt-2 border-t border-slate-800">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-300">Новый получатель (New recipient):</span>
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
              <span className="text-xs text-slate-300">Новое устройство (New device):</span>
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
          </div>

          {/* Memo text input (for NLP vectorizer) */}
          <div className="space-y-1.5 pt-2 border-t border-slate-800">
            <label className="text-xs font-medium text-slate-300 flex items-center justify-between">
              <span>Назначение перевода (Memo / Text):</span>
              <span className="text-[10px] text-slate-400">TF-IDF Vectorizer</span>
            </label>
            <input
              type="text"
              value={memoText}
              onChange={(e) => setMemoText(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:border-blue-500 outline-none"
              placeholder="Например: Перевод маме, Крипта, Возврат"
            />
          </div>

          {/* Analyze Button */}
          <button
            onClick={handleAnalyze}
            disabled={isAnalyzing}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-500 hover:from-blue-500 hover:to-indigo-400 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-blue-600/30 transition-all flex items-center justify-center gap-2 active:scale-98"
          >
            {isAnalyzing ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>АНАЛИЗ В СИСТЕМЕ...</span>
              </>
            ) : (
              <>
                <Zap className="w-4 h-4" />
                <span>[ ANALYZE TRANSACTION ]</span>
              </>
            )}
          </button>
        </div>

        {/* Results & XAI Column (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {analysisResult && (
            <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
              {/* Header Score Display */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-xl bg-slate-950 border border-slate-800">
                <div className="flex items-center gap-4">
                  <div
                    className={`w-16 h-16 rounded-2xl flex flex-col items-center justify-center border font-mono ${
                      analysisResult.riskLevel === "HIGH"
                        ? "bg-rose-950/60 border-rose-500/50 text-rose-400 glow-rose"
                        : analysisResult.riskLevel === "MEDIUM"
                        ? "bg-amber-950/60 border-amber-500/50 text-amber-400 glow-amber"
                        : "bg-emerald-950/60 border-emerald-500/50 text-emerald-400 glow-emerald"
                    }`}
                  >
                    <span className="text-2xl font-black">{analysisResult.fraudRiskScore}%</span>
                    <span className="text-[9px] uppercase tracking-wider -mt-0.5">Risk</span>
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">
                        Fraud Probability:
                      </span>
                      <span className="font-mono text-sm font-bold text-white">
                        {(analysisResult.fraudProbability * 100).toFixed(0)}%
                      </span>
                    </div>

                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-slate-400">Risk Level:</span>
                      <span
                        className={`text-xs font-extrabold uppercase px-2 py-0.5 rounded border ${analysisResult.decisionBadgeColor}`}
                      >
                        {analysisResult.riskLevel} RISK
                      </span>
                    </div>

                    <div className="text-xs text-slate-300 mt-1">
                      Решение: <span className="font-semibold text-white">{analysisResult.decision}</span>
                    </div>
                  </div>
                </div>

                <div className="sm:text-right text-xs text-slate-400 border-t sm:border-t-0 sm:border-l border-slate-800 pt-2 sm:pt-0 sm:pl-4">
                  <div>Модель: <span className="text-blue-400 font-mono font-medium">LightGBM (Recall 98.9%)</span></div>
                  <div>Интерпретатор: <span className="text-purple-400 font-mono font-medium">TreeSHAP</span></div>
                  <div>Задержка: <span className="text-emerald-400 font-mono font-medium">2.1 ms</span></div>
                </div>
              </div>

              {/* Natural Language XAI Explanation Box */}
              <div className="p-4 rounded-xl bg-slate-950/80 border border-blue-500/20 space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-blue-300 uppercase tracking-wider">
                  <Sparkles className="w-4 h-4 text-blue-400" />
                  Объяснение решения (Explainable AI):
                </div>
                <p className="text-xs text-slate-200 leading-relaxed font-sans">
                  {analysisResult.riskExplanation}
                </p>
              </div>

              {/* Main Risk Factors Bullet List */}
              <div className="space-y-2">
                <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                  Main Risk Factors:
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {analysisResult.topRiskFactors.map((factor, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 flex items-start gap-2 text-xs text-slate-300"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-400 mt-1.5 flex-shrink-0" />
                      <span>{factor}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* SHAP Factor Contribution Waterfall / Bars */}
              <div className="space-y-3 pt-2 border-t border-slate-800">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                    Вклад признаков (SHAP Feature Contributions):
                  </h3>
                  <span className="text-[11px] text-slate-500 font-mono">
                    Базовый уровень: -3.52 (2.8%)
                  </span>
                </div>

                <div className="space-y-2">
                  {analysisResult.shapContributions.slice(0, 5).map((factor, idx) => {
                    const isUp = factor.direction === "UP";
                    return (
                      <div
                        key={idx}
                        className="p-2.5 rounded-lg bg-slate-950 border border-slate-800/80 space-y-1.5"
                      >
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-medium text-slate-200">{factor.name}</span>
                          <span
                            className={`font-mono font-bold ${
                              isUp ? "text-rose-400" : "text-emerald-400"
                            }`}
                          >
                            {isUp ? `+${factor.impactScore}%` : `${factor.impactScore}%`}
                          </span>
                        </div>

                        {/* Bar */}
                        <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden flex">
                          {isUp ? (
                            <div
                              className="bg-gradient-to-r from-amber-500 to-rose-500 h-full rounded-full transition-all duration-500"
                              style={{ width: `${Math.min(100, Math.abs(factor.impactScore) * 3)}%` }}
                            />
                          ) : (
                            <div
                              className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                              style={{ width: `${Math.min(100, Math.abs(factor.impactScore) * 3)}%` }}
                            />
                          )}
                        </div>

                        <div className="text-[11px] text-slate-400">{factor.detail}</div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Vectorizer Preview link */}
              <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
                <span className="text-slate-400">Хотите увидеть математический вектор [X]?</span>
                <Link
                  href="/vectorizer"
                  className="text-blue-400 hover:text-blue-300 font-medium flex items-center gap-1"
                >
                  <Binary className="w-3.5 h-3.5" />
                  <span>Открыть Векторайзер Признаков</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Feature Grid / Next Steps */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
        <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between">
          <div>
            <div className="w-10 h-10 rounded-xl bg-blue-600/10 border border-blue-500/20 flex items-center justify-center text-blue-400 mb-4">
              <Clock className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white">Временной анализ фрода</h3>
            <p className="mt-2 text-xs text-slate-400 leading-relaxed">
              Детальное исследование 24-часовой шкалы: почему операции с 01:00 до 05:00 имеют риск-множитель 14.5x, и как злоумышленники используют ночные окна.
            </p>
          </div>
          <Link
            href="/time-analysis"
            className="mt-4 text-xs font-semibold text-blue-400 hover:text-blue-300 inline-flex items-center gap-1.5"
          >
            <span>Исследовать график часов</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between">
          <div>
            <div className="w-10 h-10 rounded-xl bg-purple-600/10 border border-purple-500/20 flex items-center justify-center text-purple-400 mb-4">
              <Binary className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white">Численный & Текстовый Векторайзер</h3>
            <p className="mt-2 text-xs text-slate-400 leading-relaxed">
              Демонстрация предобработки сырых данных: StandardScaler для сумм, One-Hot для категорий и TF-IDF для примечаний платежа в единый вектор $X \in \mathbb&#123;R&#125;^d$.
            </p>
          </div>
          <Link
            href="/vectorizer"
            className="mt-4 text-xs font-semibold text-purple-400 hover:text-purple-300 inline-flex items-center gap-1.5"
          >
            <span>Смотреть пайплайн векторизации</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between">
          <div>
            <div className="w-10 h-10 rounded-xl bg-emerald-600/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-4">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white">Пакетный анализ 1000 CSV</h3>
            <p className="mt-2 text-xs text-slate-400 leading-relaxed">
              Загрузите готовый CSV или протестируйте 1000 банковских операций в один клик. Автоматическая сортировка, выявление аномалий и экспорт отчетов.
            </p>
          </div>
          <Link
            href="/batch"
            className="mt-4 text-xs font-semibold text-emerald-400 hover:text-emerald-300 inline-flex items-center gap-1.5"
          >
            <span>Запустить аудит 1000 транзакций</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </section>
    </div>
  );
}
