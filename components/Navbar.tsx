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
  Lock,
  Mail,
  Wallet
} from "lucide-react";
import { useState, useEffect } from "react";
import { BankUser } from "@/lib/firebase/db";

export default function Navbar() {
  const pathname = usePathname();
  const [currentUser, setCurrentUser] = useState<BankUser | null>(null);
  const [showAuthModal, setShowAuthModal] = useState<"LOGIN" | "REGISTER" | null>(null);
  const [authName, setAuthName] = useState("");
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authBalance, setAuthBalance] = useState("500000");
  const [allUsers, setAllUsers] = useState<BankUser[]>([]);
  const [authError, setAuthError] = useState("");

  useEffect(() => {
    fetchUsers();

    // Load local stored session if exists
    const saved = localStorage.getItem("finforcing_session_user");
    if (saved) {
      try {
        const u = JSON.parse(saved);
        setCurrentUser(u);
        syncUserProfile(u.id);
      } catch {}
    }

    // Periodic sync
    const interval = setInterval(() => {
      fetchUsers();
      const current = localStorage.getItem("finforcing_session_user");
      if (current) {
        try {
          const u = JSON.parse(current);
          syncUserProfile(u.id);
        } catch {}
      }
    }, 3000);

    const onUserChanged = () => {
      const current = localStorage.getItem("finforcing_session_user");
      if (current) {
        try {
          setCurrentUser(JSON.parse(current));
        } catch {}
      } else {
        setCurrentUser(null);
      }
      fetchUsers();
    };

    window.addEventListener("finforcing_user_changed", onUserChanged);

    return () => {
      clearInterval(interval);
      window.removeEventListener("finforcing_user_changed", onUserChanged);
    };
  }, []);

  const syncUserProfile = async (userId: string) => {
    try {
      const res = await fetch(`/api/auth/me?userId=${userId}`);
      const data = await res.json();
      if (data.success && data.user) {
        setCurrentUser(data.user);
        localStorage.setItem("finforcing_session_user", JSON.stringify(data.user));
      }
    } catch {}
  };

  const fetchUsers = async () => {
    try {
      const res = await fetch("/api/users");
      const data = await res.json();
      if (data.users) {
        setAllUsers(data.users);
      }
    } catch {}
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");
    if (!authEmail) return;
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          identifier: authEmail,
          password: authPassword || "password123"
        })
      });
      const data = await res.json();
      if (data.success && data.user) {
        setCurrentUser(data.user);
        localStorage.setItem("finforcing_session_user", JSON.stringify(data.user));
        setShowAuthModal(null);
        setAuthEmail("");
        setAuthPassword("");
        fetchUsers();
        window.dispatchEvent(new Event("finforcing_user_changed"));
      } else {
        setAuthError(data.error || "Неверный логин или пароль");
      }
    } catch (err: any) {
      setAuthError("Ошибка подключения к серверу: " + err.message);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");
    if (!authName || !authEmail) return;
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: authName,
          email: authEmail,
          password: authPassword || "password123",
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
        setAuthPassword("");
        fetchUsers();
        window.dispatchEvent(new Event("finforcing_user_changed"));
      } else {
        setAuthError(data.error || "Ошибка регистрации");
      }
    } catch (err: any) {
      setAuthError("Ошибка: " + err.message);
    }
  };

  const handleLogout = async () => {
    if (currentUser) {
      try {
        await fetch("/api/auth/logout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: currentUser.id })
        });
      } catch {}
    }
    localStorage.removeItem("finforcing_session_user");
    setCurrentUser(null);
    window.dispatchEvent(new Event("finforcing_user_changed"));
  };

  const quickLoginAs = (user: BankUser) => {
    setCurrentUser(user);
    localStorage.setItem("finforcing_session_user", JSON.stringify(user));
    setShowAuthModal(null);
    window.dispatchEvent(new Event("finforcing_user_changed"));
  };

  const navLinks = [
    { href: "/", label: "Мониторинг", icon: ShieldAlert },
    { href: "/transfer", label: "P2P Переводы", icon: ArrowRightLeft },
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
                <div className="flex items-center gap-3">
                  {/* Active user status display */}
                  <div className="flex flex-col items-end text-right font-mono">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-200">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      <span>{currentUser.name}</span>
                    </div>
                    <div className="text-[11px] text-emerald-400 font-bold">
                      {currentUser.balance.toLocaleString("ru-RU")} ₸
                    </div>
                  </div>

                  {/* Switch user selector */}
                  <select
                    value={currentUser.id}
                    onChange={(e) => {
                      const sel = allUsers.find((u) => u.id === e.target.value);
                      if (sel) quickLoginAs(sel);
                    }}
                    className="hidden sm:block bg-slate-900 border border-slate-800 text-slate-300 text-xs font-mono rounded px-2 py-1 outline-none focus:border-slate-700"
                    title="Сменить активного пользователя"
                  >
                    {allUsers.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name} ({u.balance.toLocaleString()} ₸)
                      </option>
                    ))}
                  </select>

                  <button
                    onClick={handleLogout}
                    className="p-1.5 rounded border border-slate-800 bg-slate-900 hover:bg-rose-950/40 hover:border-rose-800 text-slate-400 hover:text-rose-400 transition-colors"
                    title="Выйти из аккаунта"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setAuthError("");
                      setShowAuthModal("LOGIN");
                    }}
                    className="px-3 py-1.5 rounded border border-slate-800 bg-slate-900 hover:bg-slate-800 text-xs font-mono text-slate-300 transition-colors flex items-center gap-1.5"
                  >
                    <LogIn className="w-3.5 h-3.5" />
                    <span>ВХОД</span>
                  </button>
                  <button
                    onClick={() => {
                      setAuthError("");
                      setShowAuthModal("REGISTER");
                    }}
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
          <div className="bg-slate-950 border border-slate-800 rounded-lg max-w-sm w-full p-6 shadow-2xl space-y-4 font-mono">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  {showAuthModal === "LOGIN" ? "Вход в Банковскую Систему" : "Регистрация Нового Клиента"}
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Безопасный доступ • Firebase Firestore
                </p>
              </div>
              <button
                onClick={() => setShowAuthModal(null)}
                className="text-slate-500 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            {authError && (
              <div className="p-2.5 rounded bg-rose-950/40 border border-rose-800 text-rose-300 text-xs">
                {authError}
              </div>
            )}

            {showAuthModal === "LOGIN" ? (
              <form onSubmit={handleLogin} className="space-y-3 text-xs">
                <div>
                  <label className="text-slate-400 block mb-1">Email или Имя пользователя:</label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      value={authEmail}
                      onChange={(e) => setAuthEmail(e.target.value)}
                      placeholder="alice@finforcing.kz"
                      className="w-full bg-slate-900 border border-slate-800 rounded px-3 py-2 text-white outline-none focus:border-slate-600 pl-8"
                    />
                    <Mail className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" />
                  </div>
                </div>

                <div>
                  <label className="text-slate-400 block mb-1">Пароль:</label>
                  <div className="relative">
                    <input
                      type="password"
                      value={authPassword}
                      onChange={(e) => setAuthPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-slate-900 border border-slate-800 rounded px-3 py-2 text-white outline-none focus:border-slate-600 pl-8"
                    />
                    <Lock className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" />
                  </div>
                  <span className="text-[10px] text-slate-500 mt-0.5 block">Для тестовых аккаунтов: password123</span>
                </div>

                <div className="pt-2 flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setAuthError("");
                      setShowAuthModal("REGISTER");
                    }}
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

                {/* Quick login for presentation */}
                <div className="pt-3 border-t border-slate-900">
                  <div className="text-[10px] text-slate-500 uppercase mb-2">Быстрый тестовый вход:</div>
                  <div className="grid grid-cols-2 gap-2">
                    {allUsers.slice(0, 4).map((u) => (
                      <button
                        key={u.id}
                        type="button"
                        onClick={() => quickLoginAs(u)}
                        className="p-1.5 rounded bg-slate-900/60 border border-slate-800 hover:border-slate-700 text-left text-[11px] text-slate-300 hover:text-white truncate"
                      >
                        {u.name.split(" ")[0]}
                      </button>
                    ))}
                  </div>
                </div>
              </form>
            ) : (
              <form onSubmit={handleRegister} className="space-y-3 text-xs">
                <div>
                  <label className="text-slate-400 block mb-1">ФИО Клиента:</label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      value={authName}
                      onChange={(e) => setAuthName(e.target.value)}
                      placeholder="Иванов Иван"
                      className="w-full bg-slate-900 border border-slate-800 rounded px-3 py-2 text-white outline-none focus:border-slate-600 pl-8"
                    />
                    <User className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" />
                  </div>
                </div>

                <div>
                  <label className="text-slate-400 block mb-1">Email:</label>
                  <div className="relative">
                    <input
                      type="email"
                      required
                      value={authEmail}
                      onChange={(e) => setAuthEmail(e.target.value)}
                      placeholder="ivan@bank.kz"
                      className="w-full bg-slate-900 border border-slate-800 rounded px-3 py-2 text-white outline-none focus:border-slate-600 pl-8"
                    />
                    <Mail className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" />
                  </div>
                </div>

                <div>
                  <label className="text-slate-400 block mb-1">Пароль:</label>
                  <div className="relative">
                    <input
                      type="password"
                      required
                      value={authPassword}
                      onChange={(e) => setAuthPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-slate-900 border border-slate-800 rounded px-3 py-2 text-white outline-none focus:border-slate-600 pl-8"
                    />
                    <Lock className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" />
                  </div>
                </div>

                <div>
                  <label className="text-slate-400 block mb-1">Начальный баланс (₸):</label>
                  <div className="relative">
                    <input
                      type="number"
                      min="10000"
                      step="50000"
                      value={authBalance}
                      onChange={(e) => setAuthBalance(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded px-3 py-2 text-white outline-none focus:border-slate-600 pl-8 font-mono"
                    />
                    <Wallet className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" />
                  </div>
                </div>

                <div className="pt-2 flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setAuthError("");
                      setShowAuthModal("LOGIN");
                    }}
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
