"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ShieldAlert,
  ArrowRightLeft,
  Clock,
  Binary,
  Layers,
  Award,
  Wallet,
  Sparkles
} from "lucide-react";
import { useState, useEffect } from "react";
import { P2PService, P2PUser } from "@/lib/firebase/p2pService";

export default function Navbar() {
  const pathname = usePathname();
  const [users, setUsers] = useState<P2PUser[]>([]);
  const [activeUser, setActiveUser] = useState<P2PUser | null>(null);

  useEffect(() => {
    const loadedUsers = P2PService.getUsers();
    setUsers(loadedUsers);
    if (loadedUsers.length > 0) {
      setActiveUser(loadedUsers[0]);
    }
  }, []);

  const navLinks = [
    { href: "/", label: "Анализатор", icon: ShieldAlert },
    { href: "/transfer", label: "P2P Переводы", icon: ArrowRightLeft },
    { href: "/time-analysis", label: "Временной риск", icon: Clock },
    { href: "/vectorizer", label: "Векторайзер", icon: Binary },
    { href: "/batch", label: "Пакетный CSV", icon: Layers },
    { href: "/benchmark", label: "ML Бенчмарк", icon: Award },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Title */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 via-indigo-600 to-emerald-500 p-0.5 shadow-lg shadow-blue-500/20 group-hover:scale-105 transition-all">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                <ShieldAlert className="w-5 h-5 text-blue-400 group-hover:text-emerald-400 transition-colors" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg text-slate-100 tracking-tight">FinForcing</span>
                <span className="text-xs font-semibold px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400 border border-blue-500/30">
                  XAI ML
                </span>
              </div>
              <p className="text-[10px] text-slate-400 -mt-0.5">AI for Finance • Anti-Fraud System</p>
            </div>
          </Link>

          {/* Nav Links */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                    isActive
                      ? "bg-blue-600/20 text-blue-300 border border-blue-500/30 shadow-sm shadow-blue-500/10"
                      : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? "text-blue-400" : "text-slate-500"}`} />
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {/* Quick Active User Indicator */}
          <div className="flex items-center gap-3">
            {activeUser && (
              <div className="hidden sm:flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800">
                <div className="w-7 h-7 rounded-lg bg-slate-800 flex items-center justify-center text-sm border border-slate-700">
                  {activeUser.avatar}
                </div>
                <div className="text-left">
                  <div className="text-xs font-medium text-slate-200 flex items-center gap-1.5">
                    {activeUser.name}
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  </div>
                  <div className="text-[11px] font-mono text-emerald-400 flex items-center gap-1">
                    <Wallet className="w-3 h-3 text-slate-500" />
                    {activeUser.balance.toLocaleString("ru-RU")} ₸
                  </div>
                </div>
              </div>
            )}

            <Link
              href="/transfer"
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-semibold shadow-md shadow-blue-600/20 transition-all active:scale-95"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Тест Перевода</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Mobile sub-navigation bar */}
      <div className="md:hidden flex items-center justify-around py-2 px-1 border-t border-slate-800/60 bg-slate-950/90 overflow-x-auto text-xs">
        {navLinks.map((link) => {
          const Icon = link.icon;
          const isActive = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex flex-col items-center py-1 px-2.5 rounded-md ${
                isActive ? "text-blue-400 font-semibold" : "text-slate-400"
              }`}
            >
              <Icon className="w-4 h-4 mb-0.5" />
              <span className="text-[10px]">{link.label}</span>
            </Link>
          );
        })}
      </div>
    </header>
  );
}
