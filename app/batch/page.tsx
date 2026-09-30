"use client";

import { useState } from "react";
import {
  FileSpreadsheet,
  Upload,
  Play,
  Filter,
  Download,
  AlertTriangle,
  ShieldCheck,
  ShieldAlert,
  Search,
  CheckCircle,
  Eye,
  Sparkles,
  ArrowUpDown
} from "lucide-react";
import Papa from "papaparse";
import { analyzeTransaction, FraudAnalysisResult } from "@/lib/ml/fraudDetector";

interface BatchItem {
  id: string;
  sender_id: string;
  recipient_id: string;
  amount: number;
  hour: number;
  minute: number;
  timeFormatted: string;
  transaction_type: string;
  memo_text: string;
  is_new_recipient: boolean;
  is_new_device: boolean;
  is_foreign_ip: boolean;
  analysis: FraudAnalysisResult;
}

export default function BatchAuditPage() {
  const [data, setData] = useState<BatchItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [filterRisk, setFilterRisk] = useState<"ALL" | "HIGH" | "MEDIUM" | "LOW">("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedTxn, setSelectedTxn] = useState<BatchItem | null>(null);

  // Load sample 1,000 transactions from backend API
  const handleLoadSample1000 = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/batch-sample");
      const csvText = await res.text();
      processCsvContent(csvText);
    } catch (err) {
      alert("Ошибка при загрузке 1000 образцов: " + err);
      setIsLoading(false);
    }
  };

  // Upload custom CSV file
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsLoading(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      processCsvContent(content);
    };
    reader.readAsText(file, "utf-8");
  };

  // Core processing & parallel ML scoring
  const processCsvContent = (csvText: string) => {
    Papa.parse(csvText, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const rows = results.data as any[];
        const processed: BatchItem[] = rows.map((row, idx) => {
          const amount = parseFloat(row.amount || row.Amount || 50000) || 50000;
          const hour = parseInt(row.hour || row.Hour || (row.timestamp ? new Date(row.timestamp).getHours() : 12)) || 12;
          const minute = parseInt(row.minute || 15) || 15;
          const isNewRecipient = row.is_new_recipient === "1" || row.is_new_recipient === 1 || row.is_new_recipient === true;
          const isNewDevice = row.is_new_device === "1" || row.is_new_device === 1 || row.is_new_device === true;
          const isForeignIp = row.is_foreign_ip === "1" || row.is_foreign_ip === 1 || row.is_foreign_ip === true;
          const memoText = row.memo_text || row.Memo || "Перевод";
          const senderAvg = parseFloat(row.sender_avg_amount || 60000) || 60000;
          const senderBal = parseFloat(row.sender_balance_before || amount * 1.5) || amount * 1.5;

          const analysis = analyzeTransaction({
            amount,
            hour,
            minute,
            transactionType: row.transaction_type || "P2P_TRANSFER",
            senderBalanceBefore: senderBal,
            senderAvgAmount: senderAvg,
            isNewRecipient,
            velocityLast24h: parseInt(row.velocity_last_24h || 1) || 1,
            isNewDevice,
            isForeignIp,
            memoText
          });

          return {
            id: row.transaction_id || `TXN-BATCH-${idx + 1}`,
            sender_id: row.sender_id || `KZ_USR_${idx + 100}`,
            recipient_id: row.recipient_id || `KZ_REC_${idx + 500}`,
            amount,
            hour,
            minute,
            timeFormatted: `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`,
            transaction_type: row.transaction_type || "P2P_TRANSFER",
            memo_text: memoText,
            is_new_recipient: isNewRecipient,
            is_new_device: isNewDevice,
            is_foreign_ip: isForeignIp,
            analysis
          };
        });

        // Sort descending by fraud risk score by default
        processed.sort((a, b) => b.analysis.fraudRiskScore - a.analysis.fraudRiskScore);
        setData(processed);
        setIsLoading(false);
      }
    });
  };

  // Export filtered high-risk list
  const handleExportCsv = () => {
    if (data.length === 0) return;
    const exportRows = filteredData.map((d) => ({
      Transaction_ID: d.id,
      Amount_KZT: d.amount,
      Time: d.timeFormatted,
      Sender: d.sender_id,
      Recipient: d.recipient_id,
      New_Recipient: d.is_new_recipient ? "YES" : "NO",
      Fraud_Probability: d.analysis.fraudProbability,
      Risk_Score_0_100: d.analysis.fraudRiskScore,
      Risk_Level: d.analysis.riskLevel,
      Decision: d.analysis.decision,
      Top_Risk_Reason: d.analysis.topRiskFactors[0] || "Normal"
    }));

    const csvStr = Papa.unparse(exportRows);
    const blob = new Blob([csvStr], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `fraud_audit_report_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filtered dataset
  const filteredData = data.filter((item) => {
    if (filterRisk !== "ALL" && item.analysis.riskLevel !== filterRisk) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        item.id.toLowerCase().includes(q) ||
        item.sender_id.toLowerCase().includes(q) ||
        item.recipient_id.toLowerCase().includes(q) ||
        item.memo_text.toLowerCase().includes(q)
      );
    }
    return true;
  });

  // KPI calculations
  const totalCount = data.length;
  const highRiskCount = data.filter((d) => d.analysis.riskLevel === "HIGH").length;
  const mediumRiskCount = data.filter((d) => d.analysis.riskLevel === "MEDIUM").length;
  const lowRiskCount = data.filter((d) => d.analysis.riskLevel === "LOW").length;
  const totalFraudBlockedAmount = data
    .filter((d) => d.analysis.riskLevel === "HIGH")
    .reduce((sum, d) => sum + d.amount, 0);

  return (
    <div className="space-y-8 pb-16">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-2">
            <FileSpreadsheet className="w-3.5 h-3.5" />
            Batch Financial Transaction Auditor
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Пакетный Анализ и Аудит 1000+ Транзакций
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl leading-relaxed">
            Автоматическая пакетная скоринг-проверка всего потока платежей. Мгновенная сортировка по уровню риска и выявление наиболее опасных мошеннических операций.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          <label className="cursor-pointer inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 text-xs font-semibold transition-all">
            <Upload className="w-4 h-4 text-blue-400" />
            <span>Загрузить CSV файл</span>
            <input type="file" accept=".csv" onChange={handleFileUpload} className="hidden" />
          </label>

          <button
            onClick={handleLoadSample1000}
            disabled={isLoading}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold shadow-lg shadow-emerald-600/25 transition-all"
          >
            {isLoading ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Скоринг 1000 транзакций...</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Загрузить 1000 транзакций</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* KPI Cards (when data loaded) */}
      {totalCount > 0 && (
        <section className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-fade-in">
          <div className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800">
            <div className="text-xs text-slate-400 font-medium">Всего проверено:</div>
            <div className="text-2xl font-black font-mono text-white mt-1">
              {totalCount.toLocaleString()}
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">Транзакций в реестре</div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900/70 border border-rose-500/30 glow-rose">
            <div className="text-xs text-rose-300 font-medium flex items-center justify-between">
              <span>Высокий риск (HIGH):</span>
              <span className="w-2 h-2 rounded-full bg-rose-500" />
            </div>
            <div className="text-2xl font-black font-mono text-rose-400 mt-1">
              {highRiskCount}{" "}
              <span className="text-xs font-normal text-rose-300">
                ({((highRiskCount / totalCount) * 100).toFixed(1)}%)
              </span>
            </div>
            <div className="text-[11px] text-rose-400/80 mt-0.5 font-semibold">
              Заблокировано антифродом
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900/70 border border-amber-500/30">
            <div className="text-xs text-amber-300 font-medium flex items-center justify-between">
              <span>Средний риск (MEDIUM):</span>
              <span className="w-2 h-2 rounded-full bg-amber-500" />
            </div>
            <div className="text-2xl font-black font-mono text-amber-400 mt-1">
              {mediumRiskCount}{" "}
              <span className="text-xs font-normal text-amber-300">
                ({((mediumRiskCount / totalCount) * 100).toFixed(1)}%)
              </span>
            </div>
            <div className="text-[11px] text-amber-400/80 mt-0.5">Требуют 2FA проверки</div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900/70 border border-emerald-500/30">
            <div className="text-xs text-emerald-300 font-medium flex items-center justify-between">
              <span>Предотвращенный ущерб:</span>
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
            </div>
            <div className="text-xl sm:text-2xl font-black font-mono text-emerald-400 mt-1 truncate">
              {totalFraudBlockedAmount.toLocaleString("ru-RU")} ₸
            </div>
            <div className="text-[11px] text-emerald-400/80 mt-0.5">Сохраненные средства</div>
          </div>
        </section>
      )}

      {/* Main Table Container */}
      <section className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5">
        {totalCount === 0 ? (
          <div className="text-center py-16 space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-slate-800/80 border border-slate-700 mx-auto flex items-center justify-center text-slate-400">
              <FileSpreadsheet className="w-8 h-8 text-blue-400" />
            </div>
            <div className="max-w-md mx-auto">
              <h3 className="text-base font-bold text-white">Пакетный список пуст</h3>
              <p className="text-xs text-slate-400 mt-1">
                Нажмите кнопку ниже, чтобы загрузить демонстрационный набор из 1 000 банковских операций, или загрузите свой собственный CSV файл.
              </p>
            </div>
            <button
              onClick={handleLoadSample1000}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-lg shadow-blue-600/30"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>Загрузить 1000 транзакций</span>
            </button>
          </div>
        ) : (
          <>
            {/* Filter & Search Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-b border-slate-800 pb-4">
              {/* Risk Filter Buttons */}
              <div className="flex items-center gap-1.5 w-full sm:w-auto">
                <button
                  onClick={() => setFilterRisk("ALL")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    filterRisk === "ALL"
                      ? "bg-blue-600 text-white"
                      : "bg-slate-950 text-slate-400 hover:text-white border border-slate-800"
                  }`}
                >
                  Все ({totalCount})
                </button>
                <button
                  onClick={() => setFilterRisk("HIGH")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    filterRisk === "HIGH"
                      ? "bg-rose-600 text-white"
                      : "bg-slate-950 text-rose-400 hover:text-rose-300 border border-rose-900/60"
                  }`}
                >
                  🔴 High Risk ({highRiskCount})
                </button>
                <button
                  onClick={() => setFilterRisk("MEDIUM")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    filterRisk === "MEDIUM"
                      ? "bg-amber-600 text-white"
                      : "bg-slate-950 text-amber-400 hover:text-amber-300 border border-amber-900/60"
                  }`}
                >
                  🟡 Medium ({mediumRiskCount})
                </button>
                <button
                  onClick={() => setFilterRisk("LOW")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    filterRisk === "LOW"
                      ? "bg-emerald-600 text-white"
                      : "bg-slate-950 text-emerald-400 hover:text-emerald-300 border border-emerald-900/60"
                  }`}
                >
                  🟢 Low ({lowRiskCount})
                </button>
              </div>

              {/* Search & Export */}
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <div className="relative flex-1 sm:w-64">
                  <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="Поиск по ID, клиенту..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white outline-none focus:border-blue-500"
                  />
                </div>

                <button
                  onClick={handleExportCsv}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium"
                  title="Скачать отфильтрованный отчет в CSV"
                >
                  <Download className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Экспорт CSV</span>
                </button>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto max-h-[580px] overflow-y-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950/90 sticky top-0 z-10 text-slate-400 font-semibold border-b border-slate-800 uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="py-2.5 px-3">ID / Время</th>
                    <th className="py-2.5 px-3">Отправитель → Получатель</th>
                    <th className="py-2.5 px-3">Сумма (₸)</th>
                    <th className="py-2.5 px-3">Назначение платежа</th>
                    <th className="py-2.5 px-3">Факторы риска</th>
                    <th className="py-2.5 px-3">Fraud Score</th>
                    <th className="py-2.5 px-3 text-right">Действие</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono">
                  {filteredData.slice(0, 100).map((row) => (
                    <tr
                      key={row.id}
                      className={`hover:bg-slate-800/30 transition-colors ${
                        row.analysis.riskLevel === "HIGH" ? "bg-rose-950/10" : ""
                      }`}
                    >
                      <td className="py-2.5 px-3">
                        <div className="font-bold text-white">{row.id}</div>
                        <div className="text-[10px] text-slate-500">{row.timeFormatted}</div>
                      </td>
                      <td className="py-2.5 px-3 text-slate-300 font-sans">
                        <div className="text-[11px]">{row.sender_id} → {row.recipient_id}</div>
                        {row.is_new_recipient && (
                          <span className="text-[9px] text-rose-400 font-mono font-semibold">
                            ⚠️ Новый получатель
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 font-bold text-white">
                        {row.amount.toLocaleString("ru-RU")} ₸
                      </td>
                      <td className="py-2.5 px-3 font-sans text-slate-400 max-w-xs truncate">
                        {row.memo_text}
                      </td>
                      <td className="py-2.5 px-3 font-sans text-[11px] text-slate-300 max-w-xs truncate">
                        {row.analysis.topRiskFactors[0]}
                      </td>
                      <td className="py-2.5 px-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[11px] font-bold border ${row.analysis.decisionBadgeColor}`}
                        >
                          {row.analysis.fraudRiskScore}% ({row.analysis.riskLevel})
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right font-sans">
                        <button
                          onClick={() => setSelectedTxn(row)}
                          className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-blue-400 text-[11px] font-medium inline-flex items-center gap-1"
                        >
                          <Eye className="w-3 h-3" />
                          <span>SHAP</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between text-xs text-slate-500 border-t border-slate-800 pt-3">
              <div>
                Показано первых {Math.min(100, filteredData.length)} из {filteredData.length} записей
              </div>
              <div className="font-mono text-[11px]">
                Inference Engine: LightGBM TreeExplainer • Vercel Serverless
              </div>
            </div>
          </>
        )}
      </section>

      {/* SHAP Inspection Modal for Individual Transaction */}
      {selectedTxn && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-blue-400" />
                <h3 className="text-base font-bold text-white">
                  SHAP Аудит: {selectedTxn.id}
                </h3>
              </div>
              <button
                onClick={() => setSelectedTxn(null)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            {/* Score Banner */}
            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
              <div>
                <div className="text-[11px] text-slate-400 uppercase">Оценка мошенничества:</div>
                <div className="text-2xl font-black font-mono text-white mt-0.5">
                  {selectedTxn.analysis.fraudRiskScore}%
                </div>
                <span
                  className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded border inline-block mt-1 ${selectedTxn.analysis.decisionBadgeColor}`}
                >
                  {selectedTxn.analysis.riskLevel} RISK • {selectedTxn.analysis.decision}
                </span>
              </div>
              <div className="text-right text-xs font-mono">
                <div className="text-slate-500">Сумма:</div>
                <div className="font-bold text-white">{selectedTxn.amount.toLocaleString()} ₸</div>
                <div className="text-slate-500 mt-1">Время:</div>
                <div className="text-amber-400">{selectedTxn.timeFormatted}</div>
              </div>
            </div>

            {/* Natural language summary */}
            <div className="p-3 rounded-xl bg-slate-950/80 border border-blue-500/20 text-xs text-slate-200 leading-relaxed font-sans">
              <span className="font-bold text-blue-300 block mb-1">Заключение XAI:</span>
              {selectedTxn.analysis.riskExplanation}
            </div>

            {/* SHAP Factors */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                Факторы влияния SHAP:
              </span>
              {selectedTxn.analysis.shapContributions.map((factor, idx) => (
                <div
                  key={idx}
                  className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-xs flex justify-between items-center"
                >
                  <div>
                    <div className="font-medium text-slate-200">{factor.name}</div>
                    <div className="text-[10px] text-slate-400">{factor.detail}</div>
                  </div>
                  <span
                    className={`font-mono font-bold ${
                      factor.direction === "UP" ? "text-rose-400" : "text-emerald-400"
                    }`}
                  >
                    {factor.direction === "UP" ? `+${factor.impactScore}%` : `${factor.impactScore}%`}
                  </span>
                </div>
              ))}
            </div>

            <button
              onClick={() => setSelectedTxn(null)}
              className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold"
            >
              Закрыть окно аудита
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
