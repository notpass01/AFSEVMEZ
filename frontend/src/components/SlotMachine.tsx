"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import BetPanel from "@/components/BetPanel";
import { useAuth } from "@/hooks/useAuth";

export interface SymbolDef {
  icon: string;
  label: string;
}

export interface PayEntry {
  combo: string;
  mult: string;
  color: string;
}

function Reel({
  symbol,
  spinning,
  symbols,
}: {
  symbol: number;
  spinning: boolean;
  symbols: SymbolDef[];
}) {
  const [display, setDisplay] = useState(symbol);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (spinning) {
      intervalRef.current = setInterval(() => {
        setDisplay(Math.floor(Math.random() * symbols.length));
      }, 75);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
      setDisplay(symbol);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [spinning, symbol, symbols.length]);

  const sym = symbols[display] ?? symbols[0];

  return (
    <div
      className="flex items-center justify-center w-24 h-24 rounded-2xl
                 border-2 border-[#2A2A4A] bg-black/50 shadow-inner shadow-black/60
                 overflow-hidden"
    >
      <motion.span
        key={spinning ? undefined : display}
        initial={spinning ? {} : { scale: 1.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.18 }}
        className="text-5xl select-none"
      >
        {sym.icon}
      </motion.span>
    </div>
  );
}

interface Props {
  gameType: string;          // "slots_fruit" | "slots_diamond" | "slots_lucky7"
  symbols: SymbolDef[];
  payTable: PayEntry[];
  jackpotMultiplier: number; // at or above this → jackpot flash
  hint?: string;
}

export default function SlotMachine({
  gameType,
  symbols,
  payTable,
  jackpotMultiplier,
  hint,
}: Props) {
  const { refetch } = useAuth();
  const [spinning, setSpinning] = useState(false);
  const [reels, setReels] = useState([0, 1, 2]);
  const [won, setWon] = useState<boolean | null>(null);
  const [payout, setPayout] = useState(0);
  const [multiplier, setMultiplier] = useState(0);
  const [coin, setCoin] = useState("USDT");

  const handleBet = async (selectedCoin: string, amount: number): Promise<void> => {
    setSpinning(true);
    setWon(null);
    setCoin(selectedCoin);
    try {
      const token = localStorage.getItem("ww_token");
      const res = await fetch("/api/game", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ game: gameType, coin: selectedCoin, amount, param1: 0, param2: 0 }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error); return; }

      // Spin for at least 1.5s then reveal
      await new Promise(r => setTimeout(r, 1500));

      const r0 = Math.floor(data.result / 100);
      const r1 = Math.floor((data.result % 100) / 10);
      const r2 = data.result % 10;
      setReels([r0, r1, r2]);
      setWon(data.win);
      setPayout(data.payout);
      setMultiplier(data.multiplier);

      if (data.win) {
        data.multiplier >= jackpotMultiplier
          ? toast.success(`✨ JACKPOT! ${data.multiplier}x — +${data.payout.toFixed(4)} ${selectedCoin}`, { duration: 5000 })
          : toast.success(`🎰 ${data.multiplier}x win! +${data.payout.toFixed(4)} ${selectedCoin}`);
      } else {
        toast.error("No match — spin again!");
      }
      refetch();
    } finally {
      setSpinning(false);
    }
  };

  const isJackpot = !!won && multiplier >= jackpotMultiplier;

  return (
    <div className="flex flex-col items-center gap-8 w-full">

      {/* Machine frame */}
      <div className="relative">
        <AnimatePresence>
          {isJackpot && (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="absolute -top-10 left-1/2 -translate-x-1/2 whitespace-nowrap
                         text-xl font-black text-yellow-300 animate-pulse z-10"
            >
              ✨ JACKPOT! ✨
            </motion.div>
          )}
        </AnimatePresence>

        <div
          className="p-6 rounded-3xl border-2 border-yellow-500/40
                     bg-gradient-to-b from-[#1A1A2E] to-[#0D0D1A]
                     shadow-[0_0_40px_rgba(212,175,55,0.12)]"
        >
          {/* Reels */}
          <div className="flex gap-4 mb-5">
            {reels.map((sym, i) => (
              <Reel key={i} symbol={sym} spinning={spinning} symbols={symbols} />
            ))}
          </div>

          {/* Pay line */}
          <div className="h-px w-full bg-yellow-500/30 rounded mb-2" />
          <p className="text-center text-[10px] text-gray-600 uppercase tracking-widest mb-4">
            — pay line —
          </p>

          {/* Result */}
          <AnimatePresence>
            {won !== null && !spinning && (
              <motion.div
                initial={{ y: -8, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ opacity: 0 }}
                className={`text-center py-3 rounded-xl font-bold text-base
                            ${won
                              ? isJackpot
                                ? "bg-yellow-500/20 text-yellow-300 border border-yellow-500/40"
                                : "bg-green-500/20 text-green-400 border border-green-500/40"
                              : "bg-red-500/10 text-red-400 border border-red-500/20"}`}
              >
                {won
                  ? `🎉 +${payout.toFixed(6)} ${coin}  (${multiplier}x)`
                  : "No match — try again!"}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Pay table */}
      <div className="card p-5 w-full max-w-md">
        <p className="text-xs text-gray-400 uppercase tracking-wider mb-3 text-center">
          Pay Table
        </p>
        <div className="flex flex-col gap-2">
          {payTable.map((p) => (
            <div key={p.combo} className="flex items-center justify-between text-sm">
              <span className="text-gray-200">{p.combo}</span>
              <span className={`font-black ${p.color}`}>{p.mult}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Bet panel */}
      <BetPanel onBet={handleBet} loading={spinning}>
        {hint && (
          <p className="text-center text-xs text-gray-500">{hint}</p>
        )}
      </BetPanel>
    </div>
  );
}
