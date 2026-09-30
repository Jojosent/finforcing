"use client";

import { useState } from "react";
import {
  Clock,
  AlertTriangle,
  ShieldCheck,
  ShieldAlert,
  Moon,
  Sun,
  Activity,
  Sparkles,
  Info,
  TrendingUp,
  Lock
} from "lucide-react";
import { HOURLY_FRAUD_DISTRIBUTION, HourlyRiskStat } from "@/lib/ml/constants";

export default function TimeAnalysisPage() {
  const [selectedHour, setSelectedHour] = useState<number>(2);

  const selectedStat: HourlyRiskStat =
    HOURLY_FRAUD_DISTRIBUTION.find((h) => h.hour === selectedHour) ||
    HOURLY_FRAUD_DISTRIBUTION[2];

  return (
    <div className="space-y-8 pb-16">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-semibold uppercase tracking-wider mb-2">
          <Clock className="w-3.5 h-3.5" />
          Исследование временного распределения атак
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          В какое время отправка перевода наиболее подозрительна?
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-3xl leading-relaxed">
          Анализ 25 000 банковских транзакций выявил критическую циркадную аномалию. В ночные часы (01:00 — 05:00) концентрация мошеннических транзакций возрастает более чем в 14 раз.
        </p>
      </div>

      {/* Main Conclusion Hero Alert */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-rose-950/60 via-slate-900 to-slate-900 border border-rose-500/40 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-rose-600/20 border border-rose-500/40 flex items-center justify-center text-rose-400 flex-shrink-0 mt-0.5">
            <Moon className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-rose-500/20 text-rose-400 border border-rose-500/30">
                Максимальная опасность
              </span>
              <span className="text-xs font-mono text-slate-400">Пик риска: 01:00 — 05:00</span>
            </div>
            <h2 className="text-lg font-bold text-white mt-1">
              Самое подозрительное время: с 02:00 до 03:00 ночи
            </h2>
            <p className="text-xs text-slate-300 mt-1 leading-relaxed max-w-2xl">
              В интервале 02:00–02:59 доля мошеннических транзакций достигает <strong className="text-rose-400">41.51%</strong> при риск-множителе <strong className="text-rose-400">14.45x</strong>. Любой перевод новому получателю на нетипичную сумму в это время автоматически помечается как высокорисковый.
            </p>
          </div>
        </div>

        <div className="flex-shrink-0 grid grid-cols-2 gap-3 w-full md:w-auto">
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-center">
            <div className="text-[10px] text-slate-400">Пиковый фрод-рейт</div>
            <div className="text-xl font-bold font-mono text-rose-400 mt-0.5">41.5%</div>
            <div className="text-[9px] text-slate-500">в 02:00 - 02:59</div>
          </div>
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-center">
            <div className="text-[10px] text-slate-400">Риск-множитель</div>
            <div className="text-xl font-bold font-mono text-amber-400 mt-0.5">14.45x</div>
            <div className="text-[9px] text-slate-500">выше среднего</div>
          </div>
        </div>
      </div>

      {/* Interactive 24-Hour Visual Heatmap & Bar Chart */}
      <section className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Activity className="w-5 h-5 text-blue-400" />
              Распределение риска по часам суток (00:00 — 23:59)
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Нажмите на любой час для детального просмотра параметров безопасности
            </p>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded bg-rose-500" />
              Критический риск (&gt;20%)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded bg-amber-500" />
              Повышенный
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded bg-emerald-500" />
              Безопасный (&lt;2%)
            </span>
          </div>
        </div>

        {/* 24 Columns Chart */}
        <div className="grid grid-cols-6 sm:grid-cols-12 md:grid-cols-24 gap-1.5 pt-4">
          {HOURLY_FRAUD_DISTRIBUTION.map((item) => {
            const isSelected = item.hour === selectedHour;
            const isCritical = item.risk_tier === "CRITICAL_NIGHT_HOURS";
            const isElevated = item.risk_tier === "ELEVATED_RISK";
            
            // Bar height proportional to fraud_rate_pct (max ~42%)
            const barHeightPct = Math.max(8, (item.fraud_rate_pct / 45) * 100);

            return (
              <button
                key={item.hour}
                type="button"
                onClick={() => setSelectedHour(item.hour)}
                className={`flex flex-col items-center justify-end p-1.5 rounded-lg border transition-all ${
                  isSelected
                    ? "bg-blue-600/20 border-blue-400 ring-2 ring-blue-500/40 scale-105 z-10"
                    : "bg-slate-950/60 border-slate-800/80 hover:border-slate-700 hover:bg-slate-900"
                }`}
                style={{ height: "180px" }}
              >
                {/* Rate label above bar */}
                <span className="text-[9px] font-mono text-slate-400 mb-1">
                  {item.fraud_rate_pct.toFixed(0)}%
                </span>

                {/* Vertical bar */}
                <div className="w-full bg-slate-900 rounded-sm overflow-hidden flex flex-col justify-end h-28">
                  <div
                    className={`w-full rounded-sm transition-all duration-300 ${
                      isCritical
                        ? "bg-gradient-to-t from-rose-600 to-rose-400"
                        : isElevated
                        ? "bg-gradient-to-t from-amber-600 to-amber-400"
                        : "bg-gradient-to-t from-emerald-600 to-emerald-400"
                    }`}
                    style={{ height: `${barHeightPct}%` }}
                  />
                </div>

                {/* Hour label */}
                <span
                  className={`text-[10px] font-mono mt-1 font-bold ${
                    isSelected ? "text-blue-400" : "text-slate-400"
                  }`}
                >
                  {String(item.hour).padStart(2, "0")}ч
                </span>
              </button>
            );
          })}
        </div>

        {/* Selected Hour Deep Dive Card */}
        <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm ${
                  selectedStat.risk_tier === "CRITICAL_NIGHT_HOURS"
                    ? "bg-rose-950 text-rose-400 border border-rose-800"
                    : selectedStat.risk_tier === "ELEVATED_RISK"
                    ? "bg-amber-950 text-amber-400 border border-amber-800"
                    : "bg-emerald-950 text-emerald-400 border border-emerald-800"
                }`}
              >
                {selectedStat.hour < 6 || selectedStat.hour > 22 ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
              </div>
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  Интервал {selectedStat.hour_label}
                  <span
                    className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded border ${
                      selectedStat.risk_tier === "CRITICAL_NIGHT_HOURS"
                        ? "text-rose-400 bg-rose-950/40 border-rose-500/30"
                        : selectedStat.risk_tier === "ELEVATED_RISK"
                        ? "text-amber-400 bg-amber-950/40 border-amber-500/30"
                        : "text-emerald-400 bg-emerald-950/40 border-emerald-500/30"
                    }`}
                  >
                    {selectedStat.risk_tier}
                  </span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Поведение антифрод-фильтра при переводах в данное время суток
                </p>
              </div>
            </div>

            {/* Metric counters for the hour */}
            <div className="flex items-center gap-4 text-xs font-mono">
              <div>
                <span className="text-slate-500 text-[10px] block">Доля фрода:</span>
                <span className="font-bold text-white text-sm">
                  {selectedStat.fraud_rate_pct.toFixed(2)}%
                </span>
              </div>
              <div>
                <span className="text-slate-500 text-[10px] block">Множитель риска:</span>
                <span
                  className={`font-bold text-sm ${
                    selectedStat.risk_multiplier > 2 ? "text-rose-400" : "text-emerald-400"
                  }`}
                >
                  {selectedStat.risk_multiplier}x
                </span>
              </div>
              <div>
                <span className="text-slate-500 text-[10px] block">Транзакций в базе:</span>
                <span className="text-slate-300">{selectedStat.total_transactions}</span>
              </div>
            </div>
          </div>

          <p className="text-xs text-slate-200 leading-relaxed">
            {selectedStat.explanation}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
            <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-xs">
              <span className="text-slate-400 font-semibold block mb-1">Политика антифрода:</span>
              <span className="text-slate-200">
                {selectedStat.hour >= 1 && selectedStat.hour <= 5
                  ? "🔴 Жесткий холд: перевод новому получателю свыше 100 000 ₸ блокируется до утреннего подтверждения."
                  : selectedStat.hour === 0 || selectedStat.hour === 23 || selectedStat.hour === 6
                  ? "🟡 Обязательный OTP / Push: запрос 2FA при малейшем отклонении суммы от средней."
                  : "🟢 Автоматический пропуск: стандартная проверка скоринга без лишнего трения для клиента."}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-xs">
              <span className="text-slate-400 font-semibold block mb-1">Влияние на SHAP скор:</span>
              <span className="text-slate-200">
                {selectedStat.hour >= 1 && selectedStat.hour <= 5
                  ? "Признак hour добавляет +28% к вероятности фрода (один из главных триггеров модели)."
                  : selectedStat.hour >= 9 && selectedStat.hour <= 19
                  ? "Признак hour снижает итоговый скор риска на -10% (фактор доверенного времени)."
                  : "Нейтральное влияние признака времени (±0-4%)."}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-xs">
              <span className="text-slate-400 font-semibold block mb-1">Паттерн злоумышленников:</span>
              <span className="text-slate-200">
                {selectedStat.hour >= 1 && selectedStat.hour <= 5
                  ? "Массовый запуск ботов, попытки обналичивания дропами и перевод украденных депозитов."
                  : "Одиночные попытки мимикрии под обычные бытовые переводы (smurfing)."}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* 3 Why Night Attacks Explanations */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2">
          <div className="w-9 h-9 rounded-xl bg-rose-600/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
            <Moon className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-bold text-white">1. «Спящая жертва» (Sleep Window)</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            В период с 01:00 до 05:00 владелец счета спит и не видит всплывающих Push-уведомлений или SMS о списании средств. Это дает злоумышленникам окно в 4–6 часов до первого обращения в поддержку.
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2">
          <div className="w-9 h-9 rounded-xl bg-amber-600/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
            <Lock className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-bold text-white">2. Credential Stuffing & Брутфорс</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Хакерские скрипты по проверке украденных баз логинов и паролей намеренно запускаются ночью, когда сетевой трафик снижен и операторы мониторинга работают в ночную смену.
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2">
          <div className="w-9 h-9 rounded-xl bg-blue-600/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
            <TrendingUp className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-bold text-white">3. Веерный вывод на Дроп-сети</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Мошенники дробят крупный украденный баланс на серию быстрых P2P переводов на подставные карты (дропы) с интервалом в 2-3 минуты именно в ночной час.
          </p>
        </div>
      </section>
    </div>
  );
}
