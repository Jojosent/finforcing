"use client";

import { useState } from "react";
import {
  FileSpreadsheet,
  Upload,
  Play,
  Download,
  Search,
  Eye,
  Activity,
  Layers
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
      alert("Ошибка при загрузке: " + err);
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

  // Process CSV & parallel ML scoring
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

        processed.sort((a, b) => b.analysis.fraudRiskScore - a.analysis.fraudRiskScore);
        setData(processed);
        setIsLoading(false);
      }
    });
  };

  // Export filtered list to CSV
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

  const totalCount = data.length;
  const highRiskCount = data.filter((d) => d.analysis.riskLevel === "HIGH").length;
  const mediumRiskCount = data.filter((d) => d.analysis.riskLevel === "MEDIUM").length;
  const lowRiskCount = data.filter((d) => d.analysis.riskLevel === "LOW").length;
  const totalFraudBlockedAmount = data
    .filter((d) => d.analysis.riskLevel === "HIGH")
    .reduce((sum, d) => sum + d.amount, 0);

  return (
    <div className="space-y-6 pb-16 font-sans">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-widest text-slate-400 mb-1">
            <FileSpreadsheet className="w-3.5 h-3.5 text-blue-500" />
            <span>Пакетная обработка платежных реестров</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold font-mono text-white tracking-tight">
            Пакетный Скоринг и Аудит 1000+ Транзакций
          </h1>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
            Высокоскоростная пакетная обработка входящего потока банковских платежей с автоматическим ранжированием по шкале риска.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5 font-mono text-xs">
          <label className="cursor-pointer inline-flex items-center gap-2 px-3 py-2 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 transition-colors">
            <Upload className="w-3.5 h-3.5 text-slate-400" />
            <span>Загрузить CSV</span>
            <input type="file" accept=".csv" onChange={handleFileUpload} className="hidden" />
          </label>

          <button
            onClick={handleLoadSample1000}
            disabled={isLoading}
            className="inline-flex items-center gap-2 px-4 py-2 rounded bg-blue-600 hover:bg-blue-500 text-white font-bold transition-colors"
          >
            {isLoading ? (
              <span>Обработка 1000 записей...</span>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Загрузить 1000 транзакций</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* KPI Counters Bar */}
      {totalCount > 0 && (
        <section className="grid grid-cols-2 md:grid-cols-4 gap-3 font-mono text-xs">
          <div className="p-3.5 rounded bg-slate-900 border border-slate-800">
            <span className="text-[10px] text-slate-500 uppercase block">Всего в реестре</span>
            <span className="text-xl font-bold text-white mt-1 block">
              {totalCount.toLocaleString()}
            </span>
            <span className="text-[10px] text-slate-500">обработано без ошибок</span>
          </div>

          <div className="p-3.5 rounded bg-slate-900 border border-slate-800">
            <span className="text-[10px] text-rose-400 uppercase block font-bold">
              Высокий риск (HIGH)
            </span>
            <span className="text-xl font-bold text-rose-400 mt-1 block">
              {highRiskCount} ({((highRiskCount / totalCount) * 100).toFixed(1)}%)
            </span>
            <span className="text-[10px] text-slate-500">подлежит блокировке</span>
          </div>

          <div className="p-3.5 rounded bg-slate-900 border border-slate-800">
            <span className="text-[10px] text-amber-400 uppercase block font-bold">
              Средний риск (MEDIUM)
            </span>
            <span className="text-xl font-bold text-amber-400 mt-1 block">
              {mediumRiskCount} ({((mediumRiskCount / totalCount) * 100).toFixed(1)}%)
            </span>
            <span className="text-[10px] text-slate-500">запрос 2FA / биометрии</span>
          </div>

          <div className="p-3.5 rounded bg-slate-900 border border-slate-800">
            <span className="text-[10px] text-emerald-400 uppercase block font-bold">
              Предотвращенный ущерб
            </span>
            <span className="text-xl font-bold text-emerald-400 mt-1 block truncate">
              {totalFraudBlockedAmount.toLocaleString("ru-RU")} ₸
            </span>
            <span className="text-[10px] text-slate-500">сохранено клиентам</span>
          </div>
        </section>
      )}

      {/* Main Table Container */}
      <section className="bg-slate-900 border border-slate-800 rounded p-6 space-y-4">
        {totalCount === 0 ? (
          <div className="text-center py-16 space-y-4 font-mono">
            <div className="w-12 h-12 rounded border border-slate-800 bg-slate-950 mx-auto flex items-center justify-center text-slate-500">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white uppercase">Реестр транзакций не загружен</h3>
              <p className="text-xs text-slate-500 mt-1 font-sans">
                Загрузите подготовленный файл 1000 транзакций для проведения автоматического скоринга.
              </p>
            </div>
            <button
              onClick={handleLoadSample1000}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs uppercase rounded transition-colors"
            >
              [ Загрузить 1000 транзакций ]
            </button>
          </div>
        ) : (
          <>
            {/* Filter Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-b border-slate-800 pb-3 font-mono text-xs">
              <div className="flex items-center gap-1.5 w-full sm:w-auto">
                <button
                  onClick={() => setFilterRisk("ALL")}
                  className={`px-3 py-1.5 rounded transition-colors ${
                    filterRisk === "ALL"
                      ? "bg-slate-800 text-white font-bold border border-slate-700"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  Все ({totalCount})
                </button>
                <button
                  onClick={() => setFilterRisk("HIGH")}
                  className={`px-3 py-1.5 rounded transition-colors ${
                    filterRisk === "HIGH"
                      ? "bg-rose-950 text-rose-300 font-bold border border-rose-800"
                      : "text-rose-400 hover:text-rose-300"
                  }`}
                >
                  HIGH RISK ({highRiskCount})
                </button>
                <button
                  onClick={() => setFilterRisk("MEDIUM")}
                  className={`px-3 py-1.5 rounded transition-colors ${
                    filterRisk === "MEDIUM"
                      ? "bg-amber-950 text-amber-300 font-bold border border-amber-800"
                      : "text-amber-400 hover:text-amber-300"
                  }`}
                >
                  MEDIUM ({mediumRiskCount})
                </button>
                <button
                  onClick={() => setFilterRisk("LOW")}
                  className={`px-3 py-1.5 rounded transition-colors ${
                    filterRisk === "LOW"
                      ? "bg-emerald-950 text-emerald-300 font-bold border border-emerald-800"
                      : "text-emerald-400 hover:text-emerald-300"
                  }`}
                >
                  LOW ({lowRiskCount})
                </button>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <div className="relative flex-1 sm:w-60">
                  <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" />
                  <input
                    type="text"
                    placeholder="Поиск по ID или клиенту..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded pl-8 pr-3 py-1 text-xs text-white outline-none focus:border-slate-700"
                  />
                </div>

                <button
                  onClick={handleExportCsv}
                  className="px-3 py-1 rounded bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 text-xs flex items-center gap-1.5"
                >
                  <Download className="w-3 h-3 text-slate-400" />
                  <span>Экспорт CSV</span>
                </button>
              </div>
            </div>

            {/* Data Table */}
            <div className="overflow-x-auto max-h-[560px] overflow-y-auto font-mono text-xs">
              <table className="w-full text-left">
                <thead className="bg-slate-950 sticky top-0 z-10 text-slate-400 border-b border-slate-800 uppercase text-[10px]">
                  <tr>
                    <th className="py-2.5 px-3">ID / Время</th>
                    <th className="py-2.5 px-3">Отправитель → Получатель</th>
                    <th className="py-2.5 px-3">Сумма (₸)</th>
                    <th className="py-2.5 px-3">Назначение</th>
                    <th className="py-2.5 px-3">Главный триггер</th>
                    <th className="py-2.5 px-3">Fraud Risk</th>
                    <th className="py-2.5 px-3 text-right">Детали</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {filteredData.slice(0, 100).map((row) => (
                    <tr
                      key={row.id}
                      className={`hover:bg-slate-800/30 ${
                        row.analysis.riskLevel === "HIGH" ? "bg-rose-950/10" : ""
                      }`}
                    >
                      <td className="py-2 px-3">
                        <div className="font-bold text-white">{row.id}</div>
                        <div className="text-[10px] text-slate-500">{row.timeFormatted}</div>
                      </td>
                      <td className="py-2 px-3 text-slate-300 font-sans">
                        <div>{row.sender_id} → {row.recipient_id}</div>
                        {row.is_new_recipient && (
                          <span className="text-[9px] text-rose-400 font-mono">
                            НОВЫЙ ПОЛУЧАТЕЛЬ
                          </span>
                        )}
                      </td>
                      <td className="py-2 px-3 font-bold text-white">
                        {row.amount.toLocaleString("ru-RU")} ₸
                      </td>
                      <td className="py-2 px-3 font-sans text-slate-400 max-w-xs truncate">
                        {row.memo_text}
                      </td>
                      <td className="py-2 px-3 font-sans text-[11px] text-slate-300 max-w-xs truncate">
                        {row.analysis.topRiskFactors[0]}
                      </td>
                      <td className="py-2 px-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                            row.analysis.riskLevel === "HIGH"
                              ? "bg-rose-950 text-rose-400 border-rose-800"
                              : row.analysis.riskLevel === "MEDIUM"
                              ? "bg-amber-950 text-amber-400 border-amber-800"
                              : "bg-emerald-950 text-emerald-400 border-emerald-800"
                          }`}
                        >
                          {row.analysis.fraudRiskScore}% ({row.analysis.riskLevel})
                        </span>
                      </td>
                      <td className="py-2 px-3 text-right font-sans">
                        <button
                          onClick={() => setSelectedTxn(row)}
                          className="px-2 py-0.5 rounded bg-slate-950 border border-slate-800 hover:border-slate-700 text-blue-400 text-[10px] font-mono inline-flex items-center gap-1"
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

            <div className="flex items-center justify-between text-[11px] font-mono text-slate-500 border-t border-slate-800 pt-2">
              <div>Отображено первых {Math.min(100, filteredData.length)} из {filteredData.length} записей</div>
              <div>Алгоритм скоринга: LightGBM TreeExplainer</div>
            </div>
          </>
        )}
      </section>

      {/* SHAP Modal */}
      {selectedTxn && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-slate-950 border border-slate-800 rounded max-w-md w-full p-6 shadow-2xl space-y-4 font-mono text-xs">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="font-bold text-white uppercase">SHAP Аудит: {selectedTxn.id}</h3>
                <span className="text-[10px] text-slate-500">Декомпозиция факторов риска</span>
              </div>
              <button onClick={() => setSelectedTxn(null)} className="text-slate-500 hover:text-white">
                ✕
              </button>
            </div>

            <div className="p-3 rounded bg-slate-900 border border-slate-800 flex justify-between items-center">
              <div>
                <span className="text-[10px] text-slate-400 uppercase block">Риск-скор:</span>
                <span className="text-xl font-bold text-white">{selectedTxn.analysis.fraudRiskScore}%</span>
              </div>
              <div className="text-right">
                <span className="text-white font-bold">{selectedTxn.amount.toLocaleString()} ₸</span>
                <span className="text-[10px] text-slate-500 block">{selectedTxn.timeFormatted}</span>
              </div>
            </div>

            <div className="p-3 rounded bg-slate-900 border border-slate-800 text-[11px] font-sans text-slate-300 leading-relaxed">
              <span className="font-bold text-white block mb-1 font-mono uppercase text-[10px]">
                Заключение XAI:
              </span>
              {selectedTxn.analysis.riskExplanation}
            </div>

            <div className="space-y-1.5">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">
                Факторы влияния SHAP:
              </span>
              {selectedTxn.analysis.shapContributions.map((factor, idx) => (
                <div
                  key={idx}
                  className="p-2 rounded bg-slate-900 border border-slate-800 flex justify-between items-center text-xs"
                >
                  <span className="text-slate-300 font-sans">{factor.name}</span>
                  <span
                    className={`font-bold ${
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
              className="w-full py-2 rounded bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 font-bold"
            >
              Закрыть
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
