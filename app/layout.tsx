import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";

export const metadata: Metadata = {
  title: "FinForcing AI — Интеллектуальная система выявления мошеннических транзакций",
  description: "AI Anti-Fraud & Explainable AI (SHAP) for Banking Transactions. AI for Finance track.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru" className="dark">
      <body className="bg-slate-950 text-slate-100 min-h-screen flex flex-col antialiased selection:bg-blue-600/30 selection:text-blue-200">
        <Navbar />
        <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {children}
        </main>
        
        {/* Academic / Competition Footer */}
        <footer className="border-t border-slate-900 bg-slate-950/90 py-8 px-4 text-center text-xs text-slate-500">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="text-left">
              <p className="font-semibold text-slate-300">
                Конкурсный трек: AI for Finance (Скоринг, антифрод и XAI)
              </p>
              <p className="text-slate-500 mt-0.5">
                Проект: «Интеллектуальная система выявления мошеннических банковских транзакций с использованием ML и SHAP»
              </p>
            </div>
            <div className="flex items-center gap-4 text-slate-400 text-xs">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                LightGBM (Recall 98.9% | F1 0.972)
              </span>
              <span>•</span>
              <span>Explainable AI (TreeSHAP)</span>
              <span>•</span>
              <span>Firebase & Vercel Ready</span>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
