"use client";

import Link from "next/link";
import { usePrices } from "@/hooks/usePrices";
import { useAuth } from "@/hooks/useAuth";
import CurrencySelector from "./CurrencySelector";
import { LogOut, Wallet } from "lucide-react";

export default function Header() {
  const { currency, setCurrency, prices } = usePrices();
  const { user, balances, logout } = useAuth();

  // Toplam bakiyeyi seçili para birimine çevir
  const totalFiat = balances.reduce((sum, b) => {
    const price = prices[b.currency] ?? 0;
    return sum + b.amount * price;
  }, 0);

  const fiatDisplay = totalFiat.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  return (
    <header className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4"
      style={{ background: "rgba(13,13,13,0.92)", borderBottom: "1px solid #2A2A4A", backdropFilter: "blur(12px)" }}>

      <Link href="/">
        <span className="font-display text-2xl font-bold text-gold-gradient cursor-pointer">WinWin</span>
      </Link>

      <nav className="hidden md:flex gap-6 text-sm text-gray-300">
        <Link href="/slots"     className="hover:text-yellow-400 transition-colors font-semibold text-yellow-500">🎰 Slots</Link>
        <Link href="/roulette"  className="hover:text-yellow-400 transition-colors">Roulette</Link>
        <Link href="/dice"      className="hover:text-yellow-400 transition-colors">Dice</Link>
        <Link href="/coinflip"  className="hover:text-yellow-400 transition-colors">Coin Flip</Link>
        <Link href="/history"   className="hover:text-yellow-400 transition-colors">History</Link>
        {user && <Link href="/deposit" className="hover:text-yellow-400 transition-colors">Deposit</Link>}
      </nav>

      <div className="flex items-center gap-3">
        <CurrencySelector currency={currency} setCurrency={setCurrency} />

        {user ? (
          <div className="flex items-center gap-3">
            {/* Fiat bakiye göstergesi */}
            <div className="flex items-center gap-1.5 bg-[#1A1A2E] border border-yellow-500/40 rounded-lg px-4 py-2">
              <span className="text-yellow-400 font-bold text-sm">
                {currency.symbol}{fiatDisplay}
              </span>
              <span className="text-gray-400 text-xs">{currency.code}</span>
            </div>

            <Link href="/deposit">
              <button className="btn-gold py-2 px-4 text-sm flex items-center gap-2">
                <Wallet size={14} /> Deposit
              </button>
            </Link>

            <div className="flex items-center gap-2 bg-[#1A1A2E] border border-[#2A2A4A] rounded-lg px-3 py-2">
              <span className="text-sm text-gray-300 hidden sm:block">{user.email.split("@")[0]}</span>
              <button onClick={logout} className="text-gray-400 hover:text-red-400 transition-colors">
                <LogOut size={16} />
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Link href="/login">
              <button className="text-sm text-gray-300 hover:text-white border border-[#2A2A4A] rounded-lg px-4 py-2 transition-colors">
                Sign In
              </button>
            </Link>
            <Link href="/register">
              <button className="btn-gold py-2 px-4 text-sm">Register</button>
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}
