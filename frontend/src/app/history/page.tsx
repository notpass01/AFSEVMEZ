"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { usePrices } from "@/hooks/usePrices";

interface BetRecord {
  id: number;
  game: string;
  coin: string;
  bet: number;
  payout: number;
  result: number;
  win: number;
  multiplier: number;
  created_at: string;
}

const GAME_LABELS: Record<string, string> = {
  roulette:      "🎡 Roulette",
  dice:          "🎲 Dice",
  coinflip:      "🪙 Coin Flip",
  slots_fruit:   "🍒 Fruit Frenzy",
  slots_diamond: "💎 Diamond Rush",
  slots_lucky7:  "7️⃣ Lucky 7s",
  slots_olympus: "⚡ Gates of Olympus",
};

const COIN_ICONS: Record<string, string> = {
  BNB:  "🟡",
  USDT: "💵",
  ETH:  "🔷",
  BTC:  "🟠",
};

const SLOT_SYMBOLS: Record<string, string[]> = {
  slots_fruit:   ["🍒","🍋","🍊","🍇","⭐","7️⃣","💎"],
  slots_diamond: ["⬛","💠","🔷","💎"],
  slots_lucky7:  ["🍒","🔔","⭐","🃏","7️⃣"],
};

function formatResult(game: string, result: number): string {
  if (game === "roulette") return `${result}`;
  if (game === "dice") return `${result}`;
  if (game === "coinflip") return result === 0 ? "Heads" : "Tails";
  if (game.startsWith("slots_")) {
    const syms = SLOT_SYMBOLS[game] ?? [];
    const r0 = Math.floor(result / 100);
    const r1 = Math.floor((result % 100) / 10);
    const r2 = result % 10;
    return `${syms[r0] ?? r0} ${syms[r1] ?? r1} ${syms[r2] ?? r2}`;
  }
  return `${result}`;
}

export default function HistoryPage() {
  const { user, loading: authLoading } = useAuth();
  const { currency, prices } = usePrices();
  const [history, setHistory] = useState<BetRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    const token = localStorage.getItem("ww_token");
    fetch("/api/history", { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(data => { if (data.history) setHistory(data.history); })
      .finally(() => setLoading(false));
  }, [user]);

  if (authLoading) return (
    <div className="flex items-center justify-center py-32">
      <div className="w-8 h-8 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!user) return (
    <div className="flex flex-col items-center py-24 gap-6">
      <p className="text-2xl font-bold text-gray-300">Sign in to see your history</p>
      <div className="flex gap-3">
        <Link href="/login">
          <button className="border border-[#2A2A4A] text-gray-300 hover:text-white px-6 py-2 rounded-lg transition-colors">
            Sign In
          </button>
        </Link>
        <Link href="/register">
          <button className="btn-gold px-6 py-2">Register</button>
        </Link>
      </div>
    </div>
  );

  const totalWon  = history.filter(h => h.win).reduce((s, h) => s + h.payout, 0);
  const totalLost = history.filter(h => !h.win).reduce((s, h) => s + h.bet, 0);
  const winRate   = history.length > 0
    ? ((history.filter(h => h.win).length / history.length) * 100).toFixed(1)
    : "0.0";

  return (
    <div className="max-w-3xl mx-auto px-4 py-10 flex flex-col gap-6">
      <h1 className="font-display text-4xl font-bold text-gold-gradient text-center">
        📜 Bet History
      </h1>

      {/* Stats bar */}
      {history.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          <div className="card p-4 text-center">
            <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Total Bets</p>
            <p className="text-2xl font-bold text-white">{history.length}</p>
          </div>
          <div className="card p-4 text-center">
            <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Win Rate</p>
            <p className="text-2xl font-bold text-yellow-400">{winRate}%</p>
          </div>
          <div className="card p-4 text-center">
            <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Net P&L</p>
            <p className={`text-2xl font-bold ${totalWon - totalLost >= 0 ? "text-green-400" : "text-red-400"}`}>
              {totalWon - totalLost >= 0 ? "+" : ""}{(totalWon - totalLost).toFixed(4)}
            </p>
          </div>
        </div>
      )}

      {loading && (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {!loading && history.length === 0 && (
        <div className="card p-12 text-center flex flex-col gap-4">
          <p className="text-4xl">🎮</p>
          <p className="text-gray-400 text-lg">No bets yet. Go play!</p>
          <div className="flex gap-3 justify-center mt-2">
            <Link href="/dice">
              <button className="btn-gold px-5 py-2 text-sm">Play Dice</button>
            </Link>
            <Link href="/roulette">
              <button className="border border-[#2A2A4A] text-gray-300 hover:text-white px-5 py-2 rounded-lg text-sm transition-colors">
                Play Roulette
              </button>
            </Link>
          </div>
        </div>
      )}

      {!loading && history.map((bet) => {
        const price = prices[bet.coin] ?? 0;
        const fiatBet    = (bet.bet * price).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        const fiatPayout = (bet.payout * price).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        const date = new Date(bet.created_at).toLocaleString("en-US", {
          month: "short", day: "numeric",
          hour: "2-digit", minute: "2-digit"
        });

        return (
          <div key={bet.id}
            className={`card p-4 flex items-center gap-4 border
                        ${bet.win ? "border-green-500/30" : "border-red-500/20"}`}>

            {/* Win/loss icon */}
            <div className={`w-12 h-12 rounded-full flex items-center justify-center text-xl flex-shrink-0
                             ${bet.win ? "bg-green-500/20" : "bg-red-500/20"}`}>
              {bet.win ? "🎉" : "😞"}
            </div>

            {/* Game info */}
            <div className="flex-1 min-w-0">
              <p className="font-bold text-white">{GAME_LABELS[bet.game] ?? bet.game}</p>
              <p className="text-sm text-gray-400">
                Result: <span className="text-gray-200">{formatResult(bet.game, bet.result)}</span>
                {bet.win && <span className="text-green-400 ml-2">{bet.multiplier}x</span>}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">{date}</p>
            </div>

            {/* Amounts */}
            <div className="text-right flex-shrink-0">
              <div className="flex items-center gap-1 justify-end mb-1">
                <span className="text-base">{COIN_ICONS[bet.coin] ?? "💰"}</span>
                <span className="text-xs text-gray-400">
                  {bet.bet.toFixed(6)} {bet.coin}
                </span>
              </div>
              {bet.win ? (
                <>
                  <p className="text-green-400 font-bold">+{bet.payout.toFixed(6)} {bet.coin}</p>
                  <p className="text-xs text-green-500/70">
                    +{currency.symbol}{fiatPayout} {currency.code}
                  </p>
                </>
              ) : (
                <>
                  <p className="text-red-400 font-bold">-{bet.bet.toFixed(6)} {bet.coin}</p>
                  <p className="text-xs text-red-500/70">
                    -{currency.symbol}{fiatBet} {currency.code}
                  </p>
                </>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
