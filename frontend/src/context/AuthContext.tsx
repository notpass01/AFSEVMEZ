"use client";

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";

interface User { id: number; email: string }
interface Balance { currency: string; amount: number }

interface AuthContextType {
  user: User | null;
  balances: Balance[];
  loading: boolean;
  login: (email: string, password: string) => Promise<any>;
  logout: () => void;
  register: (email: string, password: string) => Promise<any>;
  getBalance: (currency: string) => number;
  refetch: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [balances, setBalances] = useState<Balance[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMe = useCallback(async (t?: string) => {
    const tk = t ?? (typeof window !== "undefined" ? localStorage.getItem("ww_token") : null);
    if (!tk) { setLoading(false); return; }
    try {
      const res = await fetch("/api/auth/me", { headers: { Authorization: `Bearer ${tk}` } });
      if (!res.ok) { localStorage.removeItem("ww_token"); setUser(null); setBalances([]); return; }
      const data = await res.json();
      setUser(data.user);
      setBalances(data.balances ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchMe(); }, [fetchMe]);

  const login = async (email: string, password: string) => {
    const res = await fetch("/api/auth/login", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    localStorage.setItem("ww_token", data.token);
    await fetchMe(data.token);
    return data;
  };

  const logout = () => {
    localStorage.removeItem("ww_token");
    setUser(null);
    setBalances([]);
  };

  const register = async (email: string, password: string) => {
    const res = await fetch("/api/auth/register", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    return data;
  };

  const getBalance = (currency: string) =>
    balances.find(b => b.currency === currency)?.amount ?? 0;

  return (
    <AuthContext.Provider value={{ user, balances, loading, login, logout, register, getBalance, refetch: fetchMe }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
