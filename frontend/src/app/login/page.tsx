"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";

function LoginForm() {
  const { login } = useAuth();
  const router = useRouter();
  const params = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");

  useEffect(() => {
    if (params.get("verified") === "1") setInfo("Email verified! You can now log in.");
    if (params.get("error") === "invalid_token") setError("Invalid or expired verification link.");
  }, [params]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
      router.push("/");
      router.refresh();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card p-10 w-full max-w-md">
      <h1 className="font-display text-3xl font-bold text-gold-gradient mb-2">Sign In</h1>
      <p className="text-gray-400 text-sm mb-8">Welcome back to WinWin Casino</p>

      {info  && <p className="text-green-400 text-sm bg-green-500/10 rounded-lg px-4 py-2 mb-4">{info}</p>}
      {error && <p className="text-red-400 text-sm bg-red-500/10 rounded-lg px-4 py-2 mb-4">{error}</p>}

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label className="text-xs text-gray-400 uppercase tracking-wider">Email</label>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
            className="w-full mt-1 bg-black/30 border border-[#2A2A4A] rounded-xl px-4 py-3 text-white outline-none focus:border-yellow-500 transition-colors" />
        </div>
        <div>
          <label className="text-xs text-gray-400 uppercase tracking-wider">Password</label>
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} required
            className="w-full mt-1 bg-black/30 border border-[#2A2A4A] rounded-xl px-4 py-3 text-white outline-none focus:border-yellow-500 transition-colors" />
        </div>

        <button type="submit" disabled={loading} className="btn-gold w-full py-3 mt-2">
          {loading ? "Signing in..." : "Sign In"}
        </button>
      </form>

      <p className="text-center text-gray-400 text-sm mt-6">
        No account?{" "}
        <Link href="/register" className="text-yellow-400 hover:underline">Create one</Link>
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="flex items-center justify-center min-h-screen px-4">
      <Suspense fallback={<div className="w-8 h-8 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin" />}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
