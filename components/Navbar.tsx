"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ShieldAlert,
  ArrowRightLeft,
  Clock,
  Layers,
  Award,
  User,
  LogOut,
  LogIn,
  UserPlus,
  Radio
} from "lucide-react";
import { useState, useEffect } from "react";
import { BankUser } from "@/lib/firebase/db";

export default function Navbar() {
  const pathname = usePathname();
  const [currentUser, setCurrentUser] = useState<BankUser | null>(null);
  const [showAuthModal, setShowAuthModal] = useState<"LOGIN" | "REGISTER" | null>(null);
  const [authName, setAuthName] = useState("");
  const [authEmail, setAuthEmail] = useState("");
  const [authBalance, setAuthBalance] = useState("500000");
  const [allUsers, setAllUsers] = useState<BankUser[]>([]);

  useEffect(() => {
    fetchUsers();
    // Load local stored session
    const saved = localStorage.getItem("finforcing_session_user");
    if (saved) {
      try {
        setCurrentUser(JSON.parse(saved));
      } catch {}
    }
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await fetch("/api/users");
      const data = await res.json();
      if (data.users && data.users.length > 0) {
        setAllUsers(data.users);
        if (!localStorage.getItem("finforcing_session_user")) {
          setCurrentUser(data.users[0]);
          localStorage.setItem("finforcing_session_user", JSON.stringify(data.users[0]));
        }
      }
    } catch {}
  };

  const handleSelectUser = (user: BankUser) => {
    setCurrentUser(user);
    localStorage.setItem("finforcing_session_user", JSON.stringify(user));
    window.dispatchEvent(new Event("finforcing_user_changed"));
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authEmail) return;
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier: authEmail })
      });
      const data = await res.json();
      if (data.success && data.user) {
        setCurrentUser(data.user);
        localStorage.setItem("finforcing_session_user", JSON.stringify(data.user));
        setShowAuthModal(null);
        setAuthEmail("");
        fetchUsers();
        window.dispatchEvent(new Event("finforcing_user_changed"));
      } else {
        alert(data.error || "Пользователь не найден");
      }
    } catch (err: any) {
      alert("Ошибка входа: " + err.message);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authName || !authEmail) return;
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: authName,
          email: authEmail,
          initialBalance: Number(authBalance) || 500000
        })
      });
      const data = await res.json();
      if (data.success && data.user) {
        setCurrentUser(data.user);
        localStorage.setItem("finforcing_session_user", JSON.stringify(data.user));
        setShowAuthModal(null);
        setAuthName("");
        setAuthEmail("");
        fetchUsers();
        window.dispatchEvent(new Event("finforcing_user_changed"));
      } else {
        alert(data.error || "Ошибка регистрации");
      }
    } catch (err: any) {
      alert("Ошибка: " + err.message);
    }
  };

  const navLinks = [
    { href: "/", label: "Мониторинг", icon: ShieldAlert },
    { href: "/transfer", label: "P2P Транзакции", icon: ArrowRightLeft },
    { href: "/time-analysis", label: "Временной профиль", icon: Clock },
    { href: "/batch", label: "Пакетный аудит", icon: Layers },
    { href: "/benchmark", label: "ML Бенчмарк", icon: Award },
  ];

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b border-slate-800 bg-slate-950/95 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Bank Brand Logo */}
            <Link href="/" className="flex items-center gap-3">
              <div className="w-8 h-8 rounded border border-slate-700 bg-slate-900 flex items-center justify-center">
                <ShieldAlert className="w-4 h-4 text-blue-500" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-sm tracking-wider text-white">
                    FINFORCING
                  </span>
                  <span className="text-[10px] font-mono px-1 py-0.2 rounded bg-slate-800 text-slate-300 border border-slate-700">
                    ANTI-FRAUD
                  </span>
                </div>
                <p className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">
                  Enterprise Financial Security
                </p>
              </div>
            </Link>

            {/* Navigation (Strict, No Emojis, No Vectorizer) */}
            <nav className="hidden md:flex items-center gap-1">
              {navLinks.map((link) => {
                const Icon = link.icon;
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded text-xs font-mono transition-colors ${
                      isActive
                        ? "bg-slate-800 text-white border border-slate-700 font-semibold"
                        : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5 text-slate-400" />
                    {link.label}
                  </Link>
                );
              })}
            </nav>

            {/* User Session & Authentication Bar */}
            <div className="flex items-center gap-2.5">
              {currentUser ? (
                <div className="flex items-center gap-2">
                  {/* Active user status display */}
                  <div className="hidden sm:flex flex-col items-end text-right font-mono">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-200">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      <span>{currentUser.name}</span>
                    </div>
                    <div className="text-[11px] text-slate-400">
                      {currentUser.balance.toLocaleString("ru-RU")} ₸
                    </div>
                  </div>

                  {/* Switch user selector */}
                  <select
                    value={currentUser.id}
                    onChange={(e) => {
                      const sel = allUsers.find((u) => u.id === e.target.value);
                      if (sel) handleSelectUser(sel);
                    }}
                    className="bg-slate-900 border border-slate-800 text-slate-300 text-xs font-mono rounded px-2 py-1 outline-none focus:border-slate-700"
                    title="Сменить активного пользователя"
                  >
                    {allUsers.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name} ({u.balance.toLocaleString()} ₸)
                      </option>
                    ))}
                  </select>

                  <button
                    onClick={() => setShowAuthModal("REGISTER")}
                    className="p-1.5 rounded border border-slate-800 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
                    title="Создать новый банковский аккаунт"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowAuthModal("LOGIN")}
                    className="px-3 py-1.5 rounded border border-slate-800 bg-slate-900 hover:bg-slate-800 text-xs font-mono text-slate-300 transition-colors flex items-center gap-1.5"
                  >
                    <LogIn className="w-3.5 h-3.5" />
                    <span>ВХОД</span>
                  </button>
                  <button
                    onClick={() => setShowAuthModal("REGISTER")}
                    className="px-3 py-1.5 rounded border border-blue-600 bg-blue-600 hover:bg-blue-500 text-xs font-mono text-white font-semibold transition-colors flex items-center gap-1.5"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>РЕГИСТРАЦИЯ</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Mobile menu bar */}
        <div className="md:hidden flex items-center justify-around py-1.5 px-2 border-t border-slate-900 bg-slate-950 text-xs font-mono">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`py-1 px-2 rounded ${
                  isActive ? "text-white font-bold bg-slate-900" : "text-slate-500"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </div>
      </header>

      {/* Auth Modal (Login / Register) */}
      {showAuthModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-slate-950 border border-slate-800 rounded-lg max-w-sm w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="font-mono text-sm font-bold text-white uppercase tracking-wider">
                  {showAuthModal === "LOGIN" ? "Авторизация Клиента" : "Регистрация Нового Клиента"}
                </h3>
                <p className="text-[11px] font-mono text-slate-500 mt-0.5">
                  База данных: Firebase Firestore
                </p>
              </div>
              <button
                onClick={() => setShowAuthModal(null)}
                className="text-slate-500 hover:text-white font-mono text-sm"
              >
                ✕
              </button>
            </div>

            {showAuthModal === "LOGIN" ? (
              <form onSubmit={handleLogin} className="space-y-3 font-mono text-xs">
                <div>
                  <label className="text-slate-400 block mb-1">Имя или Email:</label>
                  <input
                    type="text"
                    required
                    value={authEmail}
                    onChange={(e) => setAuthEmail(e.target.value)}
                    placeholder="Например: Алиса Смирнова или alice@finforcing.kz"
                    className="w-full bg-slate-900 border border-slate-800 rounded px-3 py-2 text-white outline-none focus:border-slate-600"
                  />
                </div>
                <div className="pt-2 flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowAuthModal("REGISTER")}
                    className="flex-1 py-2 rounded bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 text-xs"
                  >
                    Регистрация
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2 rounded bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs"
                  >
                    Войти
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleRegister} className="space-y-3 font-mono text-xs">
                <div>
                  <label className="text-slate-400 block mb-1">ФИО Клиента:</label>
                  <input
                    type="text"
                    required
                    value={authName}
                    onChange={(e) => setAuthName(e.target.value)}
                    placeholder="Иванов Иван Иванович"
                    className="w-full bg-slate-900 border border-slate-800 rounded px-3 py-2 text-white outline-none focus:border-slate-600"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Рабочий Email:</label>
                  <input
                    type="email"
                    required
                    value={authEmail}
                    onChange={(e) => setAuthEmail(e.target.value)}
                    placeholder="user@bank.kz"
                    className="w-full bg-slate-900 border border-slate-800 rounded px-3 py-2 text-white outline-none focus:border-slate-600"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Начальный баланс (₸):</label>
                  <input
                    type="number"
                    min="10000"
                    step="50000"
                    value={authBalance}
                    onChange={(e) => setAuthBalance(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded px-3 py-2 text-white outline-none focus:border-slate-600 font-mono"
                  />
                </div>
                <div className="pt-2 flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowAuthModal("LOGIN")}
                    className="flex-1 py-2 rounded bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 text-xs"
                  >
                    Есть аккаунт
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2 rounded bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs"
                  >
                    Открыть счет
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
