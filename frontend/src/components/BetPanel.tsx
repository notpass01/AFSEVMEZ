"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { usePrices } from "@/hooks/usePrices";

const TOKENS = [
  { symbol: "BNB",  icon: "🟡" },
  { symbol: "USDT", icon: "💵" },
  { symbol: "ETH",  icon: "🔷" },
  { symbol: "BTC",  icon: "🟠" },
];

interface Props {
  onBet: (coin: string, amount: number) => Promise<void>;
  loading: boolean;
  children?: React.ReactNode;
}

export default function BetPanel({ onBet, loading, children }: Props) {
  const { user, getBalance } = useAuth();
  const { currency, prices } = usePrices();
  const [selectedCoin, setSelectedCoin] = useState("USDT");
  const [fiatAmount, setFiatAmount] = useState("10");

  const price = prices[selectedCoin] ?? 1;
  const balanceCrypto = getBalance(selectedCoin);
  const balanceFiat = balanceCrypto * price;

  const fiatNum = parseFloat(fiatAmount) || 0;
  const cryptoAmount = price > 0 ? fiatNum / price : 0;
  const insufficient = fiatNum > balanceFiat;

  // Quick amounts in fiat
  const quickAmounts = currency.code === "TRY"
    ? ["10", "50", "100", "500"]
    : currency.code === "JPY" || currency.code === "KRW"
    ? ["500", "1000", "5000", "10000"]
    : ["1", "5", "10", "50"];

  const handleBet = () => {
    if (!user || insufficient || cryptoAmount <= 0) return;
    onBet(selectedCoin, cryptoAmount);
  };

  if (!user) return (
    <div className="card p-6 w-full max-w-md text-center flex flex-col gap-4">
      <p className="text-gray-400">Sign in to play</p>
      <div className="flex gap-3 justify-center">
        <Link href="/login">
          <button className="border border-[#2A2A4A] text-gray-300 hover:text-white px-6 py-2 rounded-lg transition-colors">Sign In</button>
        </Link>
        <Link href="/register">
          <button className="btn-gold px-6 py-2">Register</button>
        </Link>
      </div>
    </div>
  );

  return (
    <div className="card p-6 w-full max-w-md flex flex-col gap-5">

      {/* Token selector */}
      <div>
        <p className="text-xs text-gray-400 mb-2 uppercase tracking-wider">Select Token</p>
        <div className="grid grid-cols-4 gap-2">
          {TOKENS.map((t) => (
            <button key={t.symbol} onClick={() => setSelectedCoin(t.symbol)}
              className={`flex flex-col items-center py-2 px-1 rounded-lg border text-xs font-medium transition-all
                          ${selectedCoin === t.symbol
                            ? "border-yellow-500 bg-yellow-500/10 text-yellow-400"
                            : "border-[#2A2A4A] text-gray-400 hover:border-gray-500"}`}>
              <span className="text-lg">{t.icon}</span>
              {t.symbol}
            </button>
          ))}
        </div>

        {/* Balance in fiat */}
        <div className="mt-2 flex items-center justify-between">
          <p className="text-xs text-gray-400">
            Balance: <span className={`font-bold ${insufficient ? "text-red-400" : "text-yellow-400"}`}>
              {currency.symbol}{balanceFiat.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {currency.code}
            </span>
          </p>
          <p className="text-xs text-gray-500">{balanceCrypto.toFixed(6)} {selectedCoin}</p>
        </div>
      </div>

      {/* Fiat amount input */}
      <div>
        <p className="text-xs text-gray-400 mb-2 uppercase tracking-wider">Bet Amount ({currency.code})</p>
        <div className={`flex items-center gap-2 p-3 rounded-xl border transition-colors
                         ${insufficient ? "border-red-500" : "border-[#2A2A4A]"} bg-black/30`}>
          <span className="text-gray-400 font-bold">{currency.symbol}</span>
          <input type="number" value={fiatAmount} onChange={(e) => setFiatAmount(e.target.value)}
            min="0.01" step="0.01"
            className="flex-1 bg-transparent text-white text-lg outline-none" />
          <span className="text-gray-500 text-sm">{currency.code}</span>
        </div>
        {/* Show crypto equivalent */}
        <p className="text-xs text-gray-500 mt-1">
          ≈ {cryptoAmount.toFixed(6)} {selectedCoin}
        </p>
        {insufficient && <p className="text-xs text-red-400 mt-1">Insufficient balance</p>}
      </div>

      {/* Quick amounts in fiat */}
      <div className="flex gap-2">
        {quickAmounts.map((v) => (
          <button key={v} onClick={() => setFiatAmount(v)}
            className="flex-1 py-1.5 text-xs rounded-lg border border-[#2A2A4A]
                       text-gray-400 hover:border-yellow-500 hover:text-yellow-400 transition-colors">
            {currency.symbol}{v}
          </button>
        ))}
        <button onClick={() => setFiatAmount(balanceFiat.toFixed(2))}
          className="flex-1 py-1.5 text-xs rounded-lg border border-[#2A2A4A]
                     text-gray-400 hover:border-yellow-500 hover:text-yellow-400 transition-colors">
          MAX
        </button>
      </div>

      {/* Game-specific controls */}
      {children}

      <button className="btn-gold w-full py-4 text-base" onClick={handleBet}
        disabled={loading || insufficient || cryptoAmount <= 0}>
        {loading ? "Playing..." : `Place Bet — ${currency.symbol}${fiatNum.toFixed(2)}`}
      </button>
    </div>
  );
}
