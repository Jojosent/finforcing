"use client";

import { useState } from "react";
import {
  Award,
  CheckCircle,
  AlertTriangle,
  TrendingUp,
  Cpu,
  ShieldCheck,
  Sparkles,
  BarChart3,
  FileCheck2,
  HelpCircle
} from "lucide-react";
import { BENCHMARK_MODELS, TOP_SHAP_FEATURES, ModelMetric } from "@/lib/ml/constants";

export default function BenchmarkPage() {
  const [selectedModelName, setSelectedModelName] = useState<string>("LightGBM");

  const modelsList = Object.values(BENCHMARK_MODELS);
  const selectedModel = BENCHMARK_MODELS[selectedModelName] || BENCHMARK_MODELS["LightGBM"];

  return (
    <div className="space-y-8 pb-16">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-2">
          <Award className="w-3.5 h-3.5" />
          Научное Исследование & Сравнение Алгоритмов
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Бенчмарк Моделей Машинного Обучения и Explainable AI
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-3xl leading-relaxed">
          Экспериментальная оценка 4 алгоритмов на 25 000 банковских транзакций в условиях жесткого дисбаланса классов (2.87% фрода).
        </p>
      </div>

      {/* Research Question & Answer Card */}
      <section className="p-6 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-950 to-blue-950/40 border border-slate-800 shadow-xl space-y-4">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-400">
          <HelpCircle className="w-4 h-4" />
          Исследовательская задача конкурса:
        </div>
        <blockquote className="border-l-2 border-blue-500 pl-4 py-1 text-sm sm:text-base text-slate-200 italic font-sans">
          «Какой алгоритм машинного обучения обеспечивает наилучший баланс между обнаружением мошеннических транзакций и количеством ложных срабатываний, и может ли применение Explainable AI сделать решение модели интерпретируемым для специалиста финансового мониторинга?»
        </blockquote>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          <div className="p-4 rounded-xl bg-slate-950 border border-emerald-500/30 text-xs space-y-1.5">
            <span className="font-bold text-emerald-400 flex items-center gap-1.5">
              <CheckCircle className="w-4 h-4" />
              1. Выбор лучшего алгоритма (LightGBM):
            </span>
            <p className="text-slate-300 leading-relaxed">
              <strong>LightGBM</strong> показал наивысший F1-score (<strong className="text-white">0.9725</strong>) и точность (<strong className="text-white">95.68%</strong>) при Recall <strong className="text-white">98.88%</strong>. Количество ложных тревог (False Positives) снижено с 27 (у логистической регрессии) до всего <strong>8 случаев</strong> на 6 250 тестовых транзакций, предотвращая недовольство добросовестных клиентов.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-950 border border-purple-500/30 text-xs space-y-1.5">
            <span className="font-bold text-purple-400 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4" />
              2. Роль Explainable AI (TreeSHAP):
            </span>
            <p className="text-slate-300 leading-relaxed">
              SHAP превращает сложный ансамбль сотен деревьев из «черного ящика» в полностью прозрачный механизм. Офицер финмониторинга видит точный математический вклад каждого фактора (время +28%, опустошение +32%, новый получатель +19%), что соответствует требованиям регуляторов (НБ РК, Базель III).
            </p>
          </div>
        </div>
      </section>

      {/* Comparison Table */}
      <section className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-blue-400" />
              Сравнительная таблица метрик (Test Set: 6 250 транзакций)
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Фокус на метриках класса Fraud (1): Recall, Precision, F1 и ROC-AUC
            </p>
          </div>
          <span className="text-xs font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-800/80 px-2.5 py-0.5 rounded">
            Чемпион: LightGBM
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 text-slate-400 font-semibold border-b border-slate-800 uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-3 px-3">Алгоритм ML</th>
                <th className="py-3 px-3">Recall (Fraud)</th>
                <th className="py-3 px-3">Precision (Fraud)</th>
                <th className="py-3 px-3">F1-Score</th>
                <th className="py-3 px-3">ROC-AUC</th>
                <th className="py-3 px-3">Ложные тревоги (FP)</th>
                <th className="py-3 px-3 text-right">Статус</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 font-mono">
              {modelsList.map((m) => {
                const isChampion = m.model_name.includes("LightGBM");
                return (
                  <tr
                    key={m.model_name}
                    onClick={() => setSelectedModelName(m.model_name.includes("LightGBM") ? "LightGBM" : m.model_name)}
                    className={`cursor-pointer transition-colors ${
                      selectedModelName.includes(m.model_name) || (selectedModelName === "LightGBM" && m.model_name.includes("LightGBM"))
                        ? "bg-blue-600/10 font-bold"
                        : "hover:bg-slate-800/40"
                    } ${isChampion ? "border-l-2 border-emerald-500" : ""}`}
                  >
                    <td className="py-3 px-3 text-white font-sans flex items-center gap-2">
                      {m.model_name}
                      {isChampion && (
                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 font-mono font-bold">
                          CHAMPION
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-emerald-400">
                      {(m.recall_fraud * 100).toFixed(2)}%
                    </td>
                    <td className="py-3 px-3 text-blue-400">
                      {(m.precision_fraud * 100).toFixed(2)}%
                    </td>
                    <td className="py-3 px-3 text-amber-400 font-bold">
                      {m.f1_fraud.toFixed(4)}
                    </td>
                    <td className="py-3 px-3 text-purple-400">
                      {m.roc_auc.toFixed(4)}
                    </td>
                    <td className="py-3 px-3 text-rose-400">
                      {m.confusion_matrix.false_positive} операций
                    </td>
                    <td className="py-3 px-3 text-right font-sans">
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded font-medium ${
                          isChampion
                            ? "bg-emerald-950 text-emerald-300 border border-emerald-800"
                            : "bg-slate-800 text-slate-400"
                        }`}
                      >
                        {isChampion ? "Выбрана в прод" : "Базовый уровень"}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* Confusion Matrix Visualizer for Selected Model */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
        {/* Confusion Matrix (6 cols) */}
        <div className="md:col-span-6 bg-slate-900/70 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <FileCheck2 className="w-4 h-4 text-emerald-400" />
                Confusion Matrix: {selectedModel.model_name}
              </h3>
              <p className="text-xs text-slate-400">Матрица ошибок на тестовой выборке</p>
            </div>
            <span className="text-xs font-mono text-slate-500">N = 6 250</span>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2 font-mono">
            {/* True Negative */}
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-center">
              <span className="text-[10px] uppercase font-sans text-slate-500 block mb-1">
                True Negatives (TN)
              </span>
              <span className="text-2xl font-black text-slate-300">
                {selectedModel.confusion_matrix.true_negative}
              </span>
              <span className="text-[10px] text-slate-500 font-sans block mt-1">
                Легитимные операции корректно пропущены
              </span>
            </div>

            {/* False Positive (False Alarm) */}
            <div className="p-4 rounded-xl bg-rose-950/30 border border-rose-900/60 text-center">
              <span className="text-[10px] uppercase font-sans text-rose-400 block mb-1 font-semibold">
                False Positives (FP)
              </span>
              <span className="text-2xl font-black text-rose-400">
                {selectedModel.confusion_matrix.false_positive}
              </span>
              <span className="text-[10px] text-rose-300/80 font-sans block mt-1">
                Ложные тревоги (ошибочно заблокировано)
              </span>
            </div>

            {/* False Negative (Missed Fraud) */}
            <div className="p-4 rounded-xl bg-amber-950/30 border border-amber-900/60 text-center">
              <span className="text-[10px] uppercase font-sans text-amber-400 block mb-1 font-semibold">
                False Negatives (FN)
              </span>
              <span className="text-2xl font-black text-amber-400">
                {selectedModel.confusion_matrix.false_negative}
              </span>
              <span className="text-[10px] text-amber-300/80 font-sans block mt-1">
                Пропущенный фрод (финансовый ущерб)
              </span>
            </div>

            {/* True Positive (Caught Fraud) */}
            <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-center glow-emerald">
              <span className="text-[10px] uppercase font-sans text-emerald-400 block mb-1 font-semibold">
                True Positives (TP)
              </span>
              <span className="text-2xl font-black text-emerald-400">
                {selectedModel.confusion_matrix.true_positive}
              </span>
              <span className="text-[10px] text-emerald-300/80 font-sans block mt-1">
                Успешно перехваченные мошенничества!
              </span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 text-xs text-slate-300">
            <span className="font-semibold text-slate-200">Резюме для {selectedModel.model_name}: </span>
            {selectedModel.summary}
          </div>
        </div>

        {/* Global SHAP Feature Importance Ranking (6 cols) */}
        <div className="md:col-span-6 bg-slate-900/70 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-purple-400" />
                Глобальная важность признаков (TreeSHAP)
              </h3>
              <p className="text-xs text-slate-400">
                Среднее абсолютное влияние признаков на решение модели (mean |SHAP value|)
              </p>
            </div>
            <span className="text-xs font-mono text-purple-400">Top 10</span>
          </div>

          <div className="space-y-2 pt-1">
            {TOP_SHAP_FEATURES.map((item) => {
              const maxVal = TOP_SHAP_FEATURES[0].shap_importance;
              const barWidthPct = Math.round((item.shap_importance / maxVal) * 100);

              return (
                <div key={item.rank} className="space-y-1 text-xs">
                  <div className="flex justify-between text-slate-300">
                    <span className="flex items-center gap-1.5 truncate max-w-[280px]">
                      <span className="text-slate-500 font-mono w-4">{item.rank}.</span>
                      <span className="font-medium text-slate-200">{item.label_ru}</span>
                    </span>
                    <span className="font-mono text-purple-300 font-bold">
                      {item.shap_importance.toFixed(3)}
                    </span>
                  </div>

                  <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 h-full rounded-full transition-all duration-500"
                      style={{ width: `${barWidthPct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
