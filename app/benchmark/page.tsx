"use client";

import { useState } from "react";
import {
  Award,
  BarChart3,
  FileCheck2,
  HelpCircle,
  Activity,
  CheckCircle2
} from "lucide-react";
import { BENCHMARK_MODELS, TOP_SHAP_FEATURES } from "@/lib/ml/constants";

export default function BenchmarkPage() {
  const [selectedModelName, setSelectedModelName] = useState<string>("LightGBM");

  const modelsList = Object.values(BENCHMARK_MODELS);
  const selectedModel = BENCHMARK_MODELS[selectedModelName] || BENCHMARK_MODELS["LightGBM"];

  return (
    <div className="space-y-6 pb-16 font-sans">
      {/* Header */}
      <div className="border-b border-slate-800 pb-4">
        <div className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-widest text-slate-400 mb-1">
          <Award className="w-3.5 h-3.5 text-blue-500" />
          <span>Экспериментальная оценка алгоритмов машинного обучения</span>
        </div>
        <h1 className="text-xl sm:text-2xl font-bold font-mono text-white tracking-tight">
          Бенчмарк Моделей Машинного Обучения и Explainable AI
        </h1>
        <p className="text-xs text-slate-400 mt-1 max-w-3xl leading-relaxed">
          Сравнительное тестирование 4 алгоритмов на выборке 25 000 банковских операций в условиях экстремального дисбаланса классов (2.87% фрода).
        </p>
      </div>

      {/* Research Question & Answer Card */}
      <section className="p-6 rounded bg-slate-900 border border-slate-800 space-y-4 font-mono text-xs">
        <div className="flex items-center gap-2 text-slate-400 font-bold uppercase tracking-wider text-[11px]">
          <HelpCircle className="w-3.5 h-3.5 text-blue-500" />
          <span>Исследовательская задача конкурса:</span>
        </div>
        <blockquote className="border-l-2 border-blue-500 pl-4 py-1 text-xs sm:text-sm text-slate-200 italic font-sans leading-relaxed">
          «Какой алгоритм машинного обучения обеспечивает наилучший баланс между обнаружением мошеннических транзакций и количеством ложных срабатываний, и может ли применение Explainable AI сделать решение модели интерпретируемым для специалиста финансового мониторинга?»
        </blockquote>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1 font-sans">
          <div className="p-4 rounded bg-slate-950 border border-slate-800 space-y-1 text-xs">
            <span className="font-bold text-white font-mono uppercase block text-[11px]">
              1. Выбор лучшего алгоритма (LightGBM):
            </span>
            <p className="text-slate-300 leading-relaxed">
              <strong>LightGBM</strong> продемонстрировал наивысший F1-score (<strong>0.9725</strong>) и точность (<strong>95.68%</strong>) при Recall <strong>98.88%</strong>. Количество ложных тревог (False Positives) снижено с 27 (у логистической регрессии) до всего <strong>8 случаев</strong> на 6 250 тестовых транзакций, предотвращая недовольство добросовестных клиентов.
            </p>
          </div>

          <div className="p-4 rounded bg-slate-950 border border-slate-800 space-y-1 text-xs">
            <span className="font-bold text-white font-mono uppercase block text-[11px]">
              2. Роль Explainable AI (TreeSHAP):
            </span>
            <p className="text-slate-300 leading-relaxed">
              SHAP превращает сложный ансамбль сотен деревьев из «черного ящика» в полностью прозрачный механизм. Офицер финмониторинга видит точный математический вклад каждого фактора (время +28%, опустошение +32%, новый получатель +19%), что соответствует требованиям регуляторов (НБ РК, Базель III).
            </p>
          </div>
        </div>
      </section>

      {/* Comparison Table */}
      <section className="bg-slate-900 border border-slate-800 rounded p-6 space-y-4 font-mono text-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
          <div>
            <h2 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-blue-500" />
              Сравнительная таблица метрик (Тестовая выборка N = 6 250)
            </h2>
            <p className="text-[11px] text-slate-500 font-sans mt-0.5">
              Фокус на показателях миноритарного класса Fraud (1)
            </p>
          </div>
          <span className="text-[10px] text-slate-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
            CHAMPION: LightGBM
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 uppercase text-[10px]">
              <tr>
                <th className="py-2.5 px-3">Алгоритм ML</th>
                <th className="py-2.5 px-3">Recall (Fraud)</th>
                <th className="py-2.5 px-3">Precision (Fraud)</th>
                <th className="py-2.5 px-3">F1-Score</th>
                <th className="py-2.5 px-3">ROC-AUC</th>
                <th className="py-2.5 px-3">Ложные тревоги (FP)</th>
                <th className="py-2.5 px-3 text-right">Статус</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {modelsList.map((m) => {
                const isChampion = m.model_name.includes("LightGBM");
                return (
                  <tr
                    key={m.model_name}
                    onClick={() =>
                      setSelectedModelName(m.model_name.includes("LightGBM") ? "LightGBM" : m.model_name)
                    }
                    className={`cursor-pointer transition-colors ${
                      selectedModelName.includes(m.model_name) ||
                      (selectedModelName === "LightGBM" && m.model_name.includes("LightGBM"))
                        ? "bg-slate-800 text-white font-bold"
                        : "hover:bg-slate-800/40 text-slate-300"
                    }`}
                  >
                    <td className="py-2.5 px-3 font-sans flex items-center gap-2">
                      {m.model_name}
                      {isChampion && (
                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-950 text-emerald-400 font-mono font-bold border border-emerald-800">
                          BEST
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-emerald-400">
                      {(m.recall_fraud * 100).toFixed(2)}%
                    </td>
                    <td className="py-2.5 px-3 text-white">
                      {(m.precision_fraud * 100).toFixed(2)}%
                    </td>
                    <td className="py-2.5 px-3 font-bold text-white">
                      {m.f1_fraud.toFixed(4)}
                    </td>
                    <td className="py-2.5 px-3 text-slate-300">
                      {m.roc_auc.toFixed(4)}
                    </td>
                    <td className="py-2.5 px-3 text-rose-400">
                      {m.confusion_matrix.false_positive} оп.
                    </td>
                    <td className="py-2.5 px-3 text-right font-sans">
                      <span className="text-[10px] text-slate-400">
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

      {/* Confusion Matrix and Feature Importance */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start font-mono text-xs">
        {/* Confusion Matrix (6 cols) */}
        <div className="md:col-span-6 bg-slate-900 border border-slate-800 rounded p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <FileCheck2 className="w-4 h-4 text-blue-500" />
                Confusion Matrix: {selectedModel.model_name}
              </h3>
              <p className="text-[10px] text-slate-500 font-sans">Матрица ошибок (N = 6 250)</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-1">
            <div className="p-3.5 rounded bg-slate-950 border border-slate-800 text-center">
              <span className="text-[10px] text-slate-500 uppercase block mb-1">
                True Negatives (TN)
              </span>
              <span className="text-xl font-bold text-slate-300">
                {selectedModel.confusion_matrix.true_negative}
              </span>
              <span className="text-[10px] text-slate-500 font-sans block mt-1">
                Легитимные операции пропущены
              </span>
            </div>

            <div className="p-3.5 rounded bg-slate-950 border border-slate-800 text-center">
              <span className="text-[10px] text-rose-400 uppercase block mb-1 font-bold">
                False Positives (FP)
              </span>
              <span className="text-xl font-bold text-rose-400">
                {selectedModel.confusion_matrix.false_positive}
              </span>
              <span className="text-[10px] text-slate-500 font-sans block mt-1">
                Ложные блокировки клиентов
              </span>
            </div>

            <div className="p-3.5 rounded bg-slate-950 border border-slate-800 text-center">
              <span className="text-[10px] text-amber-400 uppercase block mb-1 font-bold">
                False Negatives (FN)
              </span>
              <span className="text-xl font-bold text-amber-400">
                {selectedModel.confusion_matrix.false_negative}
              </span>
              <span className="text-[10px] text-slate-500 font-sans block mt-1">
                Пропущенные мошенничества
              </span>
            </div>

            <div className="p-3.5 rounded bg-slate-950 border border-slate-800 text-center">
              <span className="text-[10px] text-emerald-400 uppercase block mb-1 font-bold">
                True Positives (TP)
              </span>
              <span className="text-xl font-bold text-emerald-400">
                {selectedModel.confusion_matrix.true_positive}
              </span>
              <span className="text-[10px] text-slate-500 font-sans block mt-1">
                Перехваченный фрод
              </span>
            </div>
          </div>

          <div className="p-3 rounded bg-slate-950 border border-slate-800 text-[11px] text-slate-300 font-sans">
            {selectedModel.summary}
          </div>
        </div>

        {/* Global SHAP Ranking (6 cols) */}
        <div className="md:col-span-6 bg-slate-900 border border-slate-800 rounded p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Activity className="w-4 h-4 text-blue-500" />
                Рейтинг факторов риска (TreeSHAP)
              </h3>
              <p className="text-[10px] text-slate-500 font-sans">
                Среднее абсолютное влияние на решение (mean |SHAP value|)
              </p>
            </div>
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
                      <span className="font-sans text-slate-300">{item.label_ru}</span>
                    </span>
                    <span className="font-bold text-white">
                      {item.shap_importance.toFixed(3)}
                    </span>
                  </div>

                  <div className="w-full bg-slate-950 h-1.5 rounded overflow-hidden">
                    <div
                      className="bg-slate-500 h-full rounded transition-all"
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
