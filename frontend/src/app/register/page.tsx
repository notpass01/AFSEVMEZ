"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";

export default function RegisterPage() {
  const { register } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (password !== confirm) { setError("Passwords do not match"); return; }
    setLoading(true);
    try {
      const result = await register(email, password);
      if (result.needsVerify) {
        setDone(true);
      } else {
        router.push("/login?verified=1");
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  if (done) return (
    <div className="flex items-center justify-center min-h-screen px-4">
      <div className="card p-10 w-full max-w-md text-center">
        <p className="text-5xl mb-4">📧</p>
        <h2 className="text-2xl font-bold text-gold-gradient mb-2">Check your email</h2>
        <p className="text-gray-400">We sent a verification link to <strong>{email}</strong>. Click it to activate your account.</p>
        <Link href="/login" className="btn-gold inline-block mt-6">Go to Login</Link>
      </div>
    </div>
  );

  return (
    <div className="flex items-center justify-center min-h-screen px-4">
      <div className="card p-10 w-full max-w-md">
        <h1 className="font-display text-3xl font-bold text-gold-gradient mb-2">Create Account</h1>
        <p className="text-gray-400 text-sm mb-8">Join WinWin Casino</p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="text-xs text-gray-400 uppercase tracking-wider">Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
              className="w-full mt-1 bg-black/30 border border-[#2A2A4A] rounded-xl px-4 py-3 text-white outline-none focus:border-yellow-500 transition-colors" />
          </div>
          <div>
            <label className="text-xs text-gray-400 uppercase tracking-wider">Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} required minLength={8}
              className="w-full mt-1 bg-black/30 border border-[#2A2A4A] rounded-xl px-4 py-3 text-white outline-none focus:border-yellow-500 transition-colors" />
          </div>
          <div>
            <label className="text-xs text-gray-400 uppercase tracking-wider">Confirm Password</label>
            <input type="password" value={confirm} onChange={e => setConfirm(e.target.value)} required
              className="w-full mt-1 bg-black/30 border border-[#2A2A4A] rounded-xl px-4 py-3 text-white outline-none focus:border-yellow-500 transition-colors" />
          </div>

          {error && <p className="text-red-400 text-sm bg-red-500/10 rounded-lg px-4 py-2">{error}</p>}

          <button type="submit" disabled={loading} className="btn-gold w-full py-3 mt-2">
            {loading ? "Creating account..." : "Create Account"}
          </button>
        </form>

        <p className="text-center text-gray-400 text-sm mt-6">
          Already have an account?{" "}
          <Link href="/login" className="text-yellow-400 hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
