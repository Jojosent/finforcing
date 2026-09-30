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
    <div className="space-y-6 pb-16 font-sans">
      {/* Header */}
      <div className="border-b border-slate-800 pb-4">
        <div className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-widest text-slate-400 mb-1">
          <Clock className="w-3.5 h-3.5 text-blue-500" />
          <span>Циркадный анализ банковских транзакций (25 000 операций)</span>
        </div>
        <h1 className="text-xl sm:text-2xl font-bold font-mono text-white tracking-tight">
          Временной Профиль Подозрительности Транзакций
        </h1>
        <p className="text-xs text-slate-400 mt-1 max-w-3xl leading-relaxed">
          Эмпирическое распределение мошеннических операций по 24-часовой шкале. Выявление интервалов пиковой уязвимости для настройки автоматических холдов антифрода.
        </p>
      </div>

      {/* Main Conclusion Hero Alert */}
      <div className="p-6 rounded bg-slate-900 border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded border border-rose-800 bg-rose-950/40 flex items-center justify-center text-rose-400 flex-shrink-0 mt-0.5">
            <Moon className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2 font-mono text-xs">
              <span className="px-2 py-0.5 rounded bg-rose-950 text-rose-400 border border-rose-800 font-bold uppercase">
                Критический интервал: 01:00 — 05:00
              </span>
              <span className="text-slate-500 font-mono">Пик: 02:00 — 02:59</span>
            </div>
            <h2 className="text-base font-bold font-mono text-white">
              Наиболее подозрительное время: с 02:00 до 03:00 ночи
            </h2>
            <p className="text-xs text-slate-300 font-sans leading-relaxed max-w-2xl">
              В интервале 02:00–02:59 доля мошеннических транзакций возрастает до <strong className="text-rose-400">41.51%</strong> при риск-множителе <strong className="text-rose-400">14.45x</strong> (по сравнению с 1.14% в дневные часы). Любой перевод новому получателю на нетипичную сумму в это время автоматически переводится на ручной аудит или блокируется.
            </p>
          </div>
        </div>

        <div className="flex-shrink-0 grid grid-cols-2 gap-3 w-full md:w-auto font-mono text-xs">
          <div className="p-3 rounded bg-slate-950 border border-slate-800 text-center">
            <div className="text-[10px] text-slate-500 uppercase">Доля фрода (02:00)</div>
            <div className="text-xl font-bold text-rose-400 mt-0.5">41.51%</div>
            <div className="text-[9px] text-slate-500">ночной максимум</div>
          </div>
          <div className="p-3 rounded bg-slate-950 border border-slate-800 text-center">
            <div className="text-[10px] text-slate-500 uppercase">Риск-множитель</div>
            <div className="text-xl font-bold text-white mt-0.5">14.45x</div>
            <div className="text-[9px] text-slate-500">выше нормы</div>
          </div>
        </div>
      </div>

      {/* 24-Hour Visual Bar Chart */}
      <section className="bg-slate-900 border border-slate-800 rounded p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div>
            <h2 className="text-xs font-bold font-mono text-white uppercase tracking-wider">
              Почасовая концентрация риска (00:00 — 23:59)
            </h2>
            <p className="text-xs text-slate-400 mt-0.5 font-sans">
              Выберите час для просмотра регламента антифрод-мониторинга
            </p>
          </div>

          <div className="flex items-center gap-4 text-[11px] font-mono">
            <span className="flex items-center gap-1.5 text-rose-400">
              <span className="w-2 h-2 rounded bg-rose-500" />
              Критический (&gt;20%)
            </span>
            <span className="flex items-center gap-1.5 text-amber-400">
              <span className="w-2 h-2 rounded bg-amber-500" />
              Повышенный
            </span>
            <span className="flex items-center gap-1.5 text-slate-400">
              <span className="w-2 h-2 rounded bg-slate-600" />
              Стандартный (&lt;2%)
            </span>
          </div>
        </div>

        {/* 24 Columns Chart */}
        <div className="grid grid-cols-6 sm:grid-cols-12 md:grid-cols-24 gap-1 pt-2">
          {HOURLY_FRAUD_DISTRIBUTION.map((item) => {
            const isSelected = item.hour === selectedHour;
            const isCritical = item.risk_tier === "CRITICAL_NIGHT_HOURS";
            const isElevated = item.risk_tier === "ELEVATED_RISK";
            const barHeightPct = Math.max(10, (item.fraud_rate_pct / 45) * 100);

            return (
              <button
                key={item.hour}
                type="button"
                onClick={() => setSelectedHour(item.hour)}
                className={`flex flex-col items-center justify-end p-1 rounded border transition-colors ${
                  isSelected
                    ? "bg-slate-800 border-blue-500 text-white"
                    : "bg-slate-950 border-slate-800 hover:border-slate-700 text-slate-400"
                }`}
                style={{ height: "160px" }}
              >
                <span className="text-[9px] font-mono mb-1">{item.fraud_rate_pct.toFixed(0)}%</span>
                <div className="w-full bg-slate-900 rounded-sm overflow-hidden flex flex-col justify-end h-24">
                  <div
                    className={`w-full rounded-sm ${
                      isCritical
                        ? "bg-rose-600"
                        : isElevated
                        ? "bg-amber-600"
                        : "bg-slate-600"
                    }`}
                    style={{ height: `${barHeightPct}%` }}
                  />
                </div>
                <span className="text-[10px] font-mono mt-1 font-bold">
                  {String(item.hour).padStart(2, "0")}h
                </span>
              </button>
            );
          })}
        </div>

        {/* Selected Hour Details */}
        <div className="p-4 rounded bg-slate-950 border border-slate-800 space-y-3 font-mono text-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
            <div className="flex items-center gap-3">
              <span className="text-sm font-bold text-white uppercase">
                Интервал {selectedStat.hour_label}
              </span>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase ${
                  selectedStat.risk_tier === "CRITICAL_NIGHT_HOURS"
                    ? "bg-rose-950 text-rose-400 border-rose-800"
                    : selectedStat.risk_tier === "ELEVATED_RISK"
                    ? "bg-amber-950 text-amber-400 border-amber-800"
                    : "bg-slate-900 text-slate-300 border-slate-700"
                }`}
              >
                {selectedStat.risk_tier}
              </span>
            </div>

            <div className="flex items-center gap-4 text-xs font-mono">
              <div>
                <span className="text-slate-500 text-[10px] block">Доля фрода:</span>
                <span className="font-bold text-white">{selectedStat.fraud_rate_pct.toFixed(2)}%</span>
              </div>
              <div>
                <span className="text-slate-500 text-[10px] block">Множитель:</span>
                <span className="font-bold text-rose-400">{selectedStat.risk_multiplier}x</span>
              </div>
              <div>
                <span className="text-slate-500 text-[10px] block">Выборка:</span>
                <span className="text-slate-300">{selectedStat.total_transactions} операций</span>
              </div>
            </div>
          </div>

          <p className="text-xs text-slate-300 font-sans leading-relaxed">
            {selectedStat.explanation}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 font-sans">
            <div className="p-3 rounded bg-slate-900 border border-slate-800 text-xs">
              <span className="text-slate-400 font-bold block mb-1 font-mono uppercase text-[10px]">
                Политика мониторинга:
              </span>
              <span className="text-slate-300">
                {selectedStat.hour >= 1 && selectedStat.hour <= 5
                  ? "[ ВЫСОКИЙ РИСК ] Жесткий холд: операции на новые счета свыше 100 000 ₸ требуют ручного подтверждения."
                  : selectedStat.hour === 0 || selectedStat.hour === 23 || selectedStat.hour === 6
                  ? "[ СРЕДНИЙ РИСК ] Обязательный OTP / SMS: запрос второго фактора при отклонении от среднего чека."
                  : "[ БЕЗОПАСНО ] Автоматический пропуск стандартных бытовых платежей."}
              </span>
            </div>

            <div className="p-3 rounded bg-slate-900 border border-slate-800 text-xs">
              <span className="text-slate-400 font-bold block mb-1 font-mono uppercase text-[10px]">
                Вклад в SHAP скор:
              </span>
              <span className="text-slate-300">
                {selectedStat.hour >= 1 && selectedStat.hour <= 5
                  ? "Признак hour добавляет +28% к вероятности фрода (один из главных триггеров модели)."
                  : selectedStat.hour >= 9 && selectedStat.hour <= 19
                  ? "Признак hour снижает итоговый скор риска на -10% (фактор доверенного времени)."
                  : "Нейтральное влияние признака времени (±0-4%)."}
              </span>
            </div>

            <div className="p-3 rounded bg-slate-900 border border-slate-800 text-xs">
              <span className="text-slate-400 font-bold block mb-1 font-mono uppercase text-[10px]">
                Паттерн кибератак:
              </span>
              <span className="text-slate-300">
                {selectedStat.hour >= 1 && selectedStat.hour <= 5
                  ? "Массовый запуск ботов, вывод украденных депозитов на подставные карты дроп-сети."
                  : "Одиночные попытки мимикрии под стандартные коммерческие платежи (smurfing)."}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* 3 Rationale Cards */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono text-xs">
        <div className="p-4 rounded bg-slate-900 border border-slate-800 space-y-1.5">
          <div className="flex items-center gap-2 text-slate-300 font-bold uppercase">
            <Moon className="w-4 h-4 text-blue-500" />
            <span>1. Окно «Спящей жертвы»</span>
          </div>
          <p className="text-slate-400 font-sans text-xs leading-relaxed">
            В интервале 01:00–05:00 владелец счета не видит Push-уведомления или SMS. Это дает злоумышленникам окно в 4–6 часов до первого обращения клиента в банк.
          </p>
        </div>

        <div className="p-4 rounded bg-slate-900 border border-slate-800 space-y-1.5">
          <div className="flex items-center gap-2 text-slate-300 font-bold uppercase">
            <Lock className="w-4 h-4 text-blue-500" />
            <span>2. Credential Stuffing</span>
          </div>
          <p className="text-slate-400 font-sans text-xs leading-relaxed">
            Автоматизированные скрипты проверки скомпрометированных учетных записей запускаются ночью для снижения нагрузки на сеть и обхода очередей скоринга.
          </p>
        </div>

        <div className="p-4 rounded bg-slate-900 border border-slate-800 space-y-1.5">
          <div className="flex items-center gap-2 text-slate-300 font-bold uppercase">
            <TrendingUp className="w-4 h-4 text-blue-500" />
            <span>3. Дроп-обналичивание</span>
          </div>
          <p className="text-slate-400 font-sans text-xs leading-relaxed">
            Срочный вывод украденных средств через серию быстрых P2P переводов на подставные счета с интервалом в 2-3 минуты до начала рабочего дня банка.
          </p>
        </div>
      </section>
    </div>
  );
}
