"use client";

import { useState } from "react";
import {
  Binary,
  Cpu,
  Calculator,
  Code,
  Layers,
  FileText
} from "lucide-react";

export default function VectorizerPage() {
  const [amount, setAmount] = useState<number>(450000);
  const [hour, setHour] = useState<number>(2);
  const [memoText, setMemoText] = useState<string>("Срочный перевод крипта USDT без комиссии");
  const [isNewRecipient, setIsNewRecipient] = useState<boolean>(true);
  const [isNewDevice, setIsNewDevice] = useState<boolean>(true);
  const [txType, setTxType] = useState<string>("P2P_TRANSFER");

  // Vocabulary for demonstration of Text TF-IDF Vectorizer
  const tfidfVocab = [
    { word: "крипта", idf: 4.82, riskWeight: 1.85 },
    { word: "usdt", idf: 5.12, riskWeight: 2.10 },
    { word: "срочно", idf: 3.95, riskWeight: 1.45 },
    { word: "комиссии", idf: 4.10, riskWeight: 1.20 },
    { word: "разблокировка", idf: 5.60, riskWeight: 2.50 },
    { word: "выигрыш", idf: 5.40, riskWeight: 2.20 },
    { word: "долг", idf: 2.10, riskWeight: -0.80 },
    { word: "обед", idf: 1.95, riskWeight: -1.20 },
    { word: "подарок", idf: 2.30, riskWeight: -0.60 },
    { word: "зарплата", idf: 2.80, riskWeight: -1.50 },
    { word: "аренда", idf: 3.10, riskWeight: -0.40 },
    { word: "бензин", idf: 2.05, riskWeight: -0.90 }
  ];

  // Tokenize user memo text
  const tokens = memoText.toLowerCase().replace(/[^a-zа-я0-9\s]/gi, "").split(/\s+/).filter(Boolean);

  // Compute TF-IDF weights for each word in vocabulary
  const tfidfVector = tfidfVocab.map((item) => {
    const termCount = tokens.filter((t) => t.includes(item.word) || item.word.includes(t)).length;
    const tf = tokens.length > 0 ? termCount / tokens.length : 0;
    const score = Number((tf * item.idf).toFixed(3));
    return {
      word: item.word,
      count: termCount,
      tf: Number(tf.toFixed(3)),
      idf: item.idf,
      tfidfScore: score,
      riskWeight: item.riskWeight,
      isTriggered: termCount > 0
    };
  });

  // Numerical transformations
  const amountMean = 68420.0;
  const amountStd = 112500.0;
  const zScoreAmount = Number(((amount - amountMean) / amountStd).toFixed(3));
  const logAmount = Number(Math.log(amount + 1).toFixed(3));
  
  // Cyclical time encoding (sin & cos representation of hour)
  const sinHour = Number(Math.sin((2 * Math.PI * hour) / 24).toFixed(3));
  const cosHour = Number(Math.cos((2 * Math.PI * hour) / 24).toFixed(3));

  // Categorical One-Hot Encoding
  const oneHotType = {
    P2P_TRANSFER: txType === "P2P_TRANSFER" ? 1 : 0,
    CASH_OUT: txType === "CASH_OUT" ? 1 : 0,
    PAYMENT: txType === "PAYMENT" ? 1 : 0,
    MERCHANT: txType === "MERCHANT" ? 1 : 0
  };

  // Concatenated dense vector X
  const fullFeatureVector = [
    { name: "norm_amount (z-score)", value: zScoreAmount, type: "num" },
    { name: "log_amount", value: logAmount, type: "num" },
    { name: "hour_sin", value: sinHour, type: "num" },
    { name: "hour_cos", value: cosHour, type: "num" },
    { name: "is_new_recipient", value: isNewRecipient ? 1 : 0, type: "bin" },
    { name: "is_new_device", value: isNewDevice ? 1 : 0, type: "bin" },
    { name: "type_P2P", value: oneHotType.P2P_TRANSFER, type: "cat" },
    { name: "type_CASH_OUT", value: oneHotType.CASH_OUT, type: "cat" },
    { name: "type_PAYMENT", value: oneHotType.PAYMENT, type: "cat" },
    ...tfidfVector.map((v) => ({
      name: `tfidf_${v.word}`,
      value: v.tfidfScore,
      type: "text"
    }))
  ];

  return (
    <div className="space-y-8 pb-16">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-400 text-xs font-semibold uppercase tracking-wider mb-2">
          <Binary className="w-3.5 h-3.5" />
          Feature Engineering & Preprocessing Pipeline
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Численный и Текстовый Векторайзер Признаков
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-3xl leading-relaxed">
          Модели машинного обучения (Logistic Regression, Random Forest, LightGBM) не могут напрямую принимать сырые суммы в тенге или произвольный текст. Данный модуль показывает, как система преобразует параметры транзакции в числовой вектор X размерностью 28 признаков.
        </p>
      </div>

      {/* Interactive Input Sandbox */}
      <section className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Cpu className="w-5 h-5 text-purple-400" />
            Интерактивный генератор вектора
          </h2>
          <span className="text-xs font-mono text-purple-400 bg-purple-950/60 border border-purple-800/80 px-2.5 py-0.5 rounded">
            Live Vectorization
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Amount Input */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-300 flex justify-between">
              <span>Сумма перевода:</span>
              <span className="font-mono text-blue-400 font-bold">{amount.toLocaleString()} ₸</span>
            </label>
            <input
              type="range"
              min="5000"
              max="1500000"
              step="10000"
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
            />
          </div>

          {/* Hour Input */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-300 flex justify-between">
              <span>Время (час):</span>
              <span className="font-mono text-amber-400 font-bold">{hour}:00</span>
            </label>
            <input
              type="range"
              min="0"
              max="23"
              value={hour}
              onChange={(e) => setHour(Number(e.target.value))}
              className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
            />
          </div>

          {/* Type Selector */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-300">Тип транзакции:</label>
            <select
              value={txType}
              onChange={(e) => setTxType(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white outline-none"
            >
              <option value="P2P_TRANSFER">P2P_TRANSFER</option>
              <option value="CASH_OUT">CASH_OUT</option>
              <option value="PAYMENT">PAYMENT</option>
              <option value="MERCHANT">MERCHANT</option>
            </select>
          </div>
        </div>

        {/* Text Memo Input */}
        <div className="space-y-2 pt-2 border-t border-slate-800">
          <label className="text-xs font-medium text-slate-300 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-purple-400" />
              Текстовое назначение перевода (проверяется TF-IDF векторайзером):
            </span>
            <span className="text-[10px] text-slate-400">
              Попробуйте написать: «крипта», «срочно», «usdt» или «обед»
            </span>
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={memoText}
              onChange={(e) => setMemoText(e.target.value)}
              className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white font-sans focus:border-purple-500 outline-none"
              placeholder="Введите примечание к переводу..."
            />
            <button
              onClick={() => setMemoText("Срочный перевод крипта USDT без комиссии")}
              className="text-xs px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium"
            >
              Тест фрода
            </button>
            <button
              onClick={() => setMemoText("Возврат долга за вкусный обед коллеге")}
              className="text-xs px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium"
            >
              Тест нормы
            </button>
          </div>
        </div>
      </section>

      {/* 3 Columns: Preprocessing Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Col 1: Numerical Vectorizer */}
        <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
            <div className="w-8 h-8 rounded-lg bg-blue-600/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
              <Calculator className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold uppercase text-white tracking-wider">
                1. Численный Векторайзер
              </h3>
              <p className="text-[10px] text-slate-400">StandardScaler & Non-linear transforms</p>
            </div>
          </div>

          <div className="space-y-3 text-xs font-mono">
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 space-y-1">
              <div className="text-slate-400 text-[11px] font-sans">Сумма (Z-Score нормализация):</div>
              <div className="text-slate-500 text-[10px]">
                z = (amount - mean) / std
              </div>
              <div className="text-blue-400 font-bold text-sm">{zScoreAmount}</div>
            </div>

            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 space-y-1">
              <div className="text-slate-400 text-[11px] font-sans">Логарифмирование суммы:</div>
              <div className="text-slate-500 text-[10px]">
                ln(1 + amount)
              </div>
              <div className="text-blue-400 font-bold text-sm">{logAmount}</div>
            </div>

            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 space-y-1">
              <div className="text-slate-400 text-[11px] font-sans">Циклическое время (Час {hour}:00):</div>
              <div className="text-slate-500 text-[10px]">
                sin(2π·h / 24), cos(2π·h / 24)
              </div>
              <div className="text-amber-400 font-bold text-xs">
                sin: {sinHour} | cos: {cosHour}
              </div>
            </div>
          </div>
        </div>

        {/* Col 2: Text Memo TF-IDF Vectorizer */}
        <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
            <div className="w-8 h-8 rounded-lg bg-purple-600/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold uppercase text-white tracking-wider">
                2. Текстовый Векторайзер
              </h3>
              <p className="text-[10px] text-slate-400">TF-IDF N-Gram Matrix</p>
            </div>
          </div>

          <div className="space-y-1.5 max-h-72 overflow-y-auto pr-1">
            {tfidfVector.map((token) => (
              <div
                key={token.word}
                className={`p-2 rounded-lg border text-xs flex items-center justify-between transition-all ${
                  token.isTriggered
                    ? "bg-purple-950/60 border-purple-500/50 shadow-sm"
                    : "bg-slate-950/40 border-slate-800/60 opacity-60"
                }`}
              >
                <div>
                  <span className={`font-mono font-bold ${token.isTriggered ? "text-purple-300" : "text-slate-400"}`}>
                    &quot;{token.word}&quot;
                  </span>
                  <span className="text-[9px] text-slate-500 ml-1.5 font-mono">IDF: {token.idf}</span>
                </div>
                <div className="text-right font-mono">
                  <span
                    className={`font-bold ${
                      token.isTriggered
                        ? token.riskWeight > 0 ? "text-rose-400" : "text-emerald-400"
                        : "text-slate-500"
                    }`}
                  >
                    w = {token.tfidfScore}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Col 3: Categorical One-Hot Vectorizer */}
        <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-600/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold uppercase text-white tracking-wider">
                3. One-Hot & Флаги
              </h3>
              <p className="text-[10px] text-slate-400">Бинарное кодирование категорий</p>
            </div>
          </div>

          <div className="space-y-2.5 text-xs font-mono">
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
              <span className="text-slate-400 text-[11px] font-sans block">Тип транзакции ({txType}):</span>
              <div className="text-emerald-400 font-bold">
                [{oneHotType.P2P_TRANSFER}, {oneHotType.CASH_OUT}, {oneHotType.PAYMENT}, {oneHotType.MERCHANT}]
              </div>
              <div className="text-[10px] text-slate-500 font-sans">
                [P2P, CASH_OUT, PAYMENT, MERCHANT]
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
              <span className="text-slate-400 text-[11px] font-sans block">Новый получатель:</span>
              <div className="text-rose-400 font-bold">{isNewRecipient ? 1 : 0}</div>
            </div>

            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
              <span className="text-slate-400 text-[11px] font-sans block">Новое устройство:</span>
              <div className="text-amber-400 font-bold">{isNewDevice ? 1 : 0}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Final Feature Vector X Display */}
      <section className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Code className="w-4 h-4 text-emerald-400" />
              Итоговый Вектор Признаков: X (Размерность: {fullFeatureVector.length})
            </h3>
            <p className="text-xs text-slate-400">
              Именно этот числовой массив передается в матрицы весов моделей и решающие узлы деревьев
            </p>
          </div>
          <span className="text-xs font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-800/80 px-2.5 py-0.5 rounded">
            Dense Vector: {fullFeatureVector.length} features
          </span>
        </div>

        {/* Interactive Feature Chip Grid */}
        <div className="flex flex-wrap gap-2 pt-2">
          {fullFeatureVector.map((feat, idx) => (
            <div
              key={idx}
              className={`px-3 py-1.5 rounded-lg border font-mono text-xs flex items-center gap-2 ${
                feat.type === "num"
                  ? "bg-blue-950/40 border-blue-500/40 text-blue-300"
                  : feat.type === "cat"
                  ? "bg-emerald-950/40 border-emerald-500/40 text-emerald-300"
                  : feat.type === "bin"
                  ? "bg-amber-950/40 border-amber-500/40 text-amber-300"
                  : "bg-purple-950/40 border-purple-500/40 text-purple-300"
              }`}
            >
              <span className="text-[10px] text-slate-400 font-sans">{feat.name}:</span>
              <span className="font-bold text-white">{feat.value}</span>
            </div>
          ))}
        </div>

        {/* Mathematical summary */}
        <div className="p-4 rounded-xl bg-slate-950 border border-slate-800/80 text-xs text-slate-300 space-y-2 mt-4 font-mono">
          <div className="text-slate-400 font-sans font-semibold">
            Инференс в боевой модели (Logistic Regression / LightGBM):
          </div>
          <div className="text-blue-300 text-[11px] overflow-x-auto">
            z = w_0 + (w_1 · x_1 + w_2 · x_2 + ... + w_n · x_n)  ---&gt;  P(Fraud) = 1 / (1 + e^(-z))
          </div>
          <p className="text-[11px] text-slate-400 font-sans leading-relaxed">
            В градиентном бустинге LightGBM числовой вектор X последовательно проходит через пороговые условия в листьях деревьев, а SHAP раскладывает вклад каждого признака в итоговый риск-скор (0-100).
          </p>
        </div>
      </section>
    </div>
  );
}
