"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import BetPanel from "@/components/BetPanel";
import { useAuth } from "@/hooks/useAuth";

const RED_NUMBERS = [1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36];

function numberColor(n: number) {
  if (n === 0) return "roulette-number-green";
  if (RED_NUMBERS.includes(n)) return "roulette-number-red";
  return "roulette-number-black";
}

export default function RoulettePage() {
  const { refetch } = useAuth();
  const [start, setStart] = useState(1);
  const [end, setEnd] = useState(18);
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState<number | null>(null);
  const [won, setWon] = useState<boolean | null>(null);
  const [payout, setPayout] = useState(0);

  const handleBet = async (coin: string, amount: number): Promise<void> => {
    if (start > end || end > 36) { toast.error("Invalid range"); return; }
    setSpinning(true); setResult(null); setWon(null);
    try {
      const token = localStorage.getItem("ww_token");
      const res = await fetch("/api/game", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ game: "roulette", coin, amount, param1: start, param2: end }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error); return; }
      setResult(data.result);
      setWon(data.win);
      setPayout(data.payout);
      data.win
        ? toast.success(`🎉 Won! Number: ${data.result} — +${data.payout.toFixed(4)} ${coin}`)
        : toast.error(`😞 Lost. Number: ${data.result}`);
      refetch();
    } finally {
      setSpinning(false);
    }
  };

  return (
    <div className="flex flex-col items-center px-4 py-10 gap-8">
      <h1 className="font-display text-4xl font-bold text-gold-gradient">🎡 Roulette</h1>
      <p className="text-gray-400 text-sm">Pick a range (0–36). Win multiplier = 36 ÷ range size.</p>

      {/* Wheel */}
      <div className="relative flex items-center justify-center">
        <div className={`w-48 h-48 rounded-full border-4 border-yellow-500 flex items-center justify-center
                         ${spinning ? "animate-spin-slow" : ""}`}
          style={{ background: "conic-gradient(#C0392B, #1a1a1a, #C0392B, #1a1a1a, #27AE60, #C0392B, #1a1a1a, #C0392B)" }} />
        <AnimatePresence>
          {result !== null && (
            <motion.div key={result} initial={{ scale: 0 }} animate={{ scale: 1 }}
              className="absolute">
              <span className={`w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold ${numberColor(result)}`}>
                {result}
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Number grid */}
      <div className="card p-4 w-full max-w-md">
        <p className="text-xs text-gray-400 mb-3 uppercase tracking-wider">Select Range</p>
        <div className="grid grid-cols-7 gap-1 mb-4">
          {Array.from({ length: 37 }, (_, i) => i).map((n) => (
            <button key={n}
              onClick={() => { if (n < start) setStart(n); else if (n > end) setEnd(n); else if (n === start && n < end) setStart(n+1); else if (n === end && n > start) setEnd(n-1); }}
              className={`aspect-square rounded text-xs font-bold transition-all ${numberColor(n)}
                           ${n >= start && n <= end ? "ring-2 ring-yellow-400 scale-105" : "opacity-60 hover:opacity-100"}`}>
              {n}
            </button>
          ))}
        </div>
        <div className="flex gap-4">
          <div className="flex-1">
            <p className="text-xs text-gray-400 mb-1">From</p>
            <input type="number" min={0} max={end} value={start}
              onChange={(e) => setStart(Math.max(0, Math.min(end, +e.target.value)))}
              className="w-full bg-black/30 border border-[#2A2A4A] rounded-lg px-3 py-2 text-white outline-none" />
          </div>
          <div className="flex-1">
            <p className="text-xs text-gray-400 mb-1">To</p>
            <input type="number" min={start} max={36} value={end}
              onChange={(e) => setEnd(Math.min(36, Math.max(start, +e.target.value)))}
              className="w-full bg-black/30 border border-[#2A2A4A] rounded-lg px-3 py-2 text-white outline-none" />
          </div>
          <div className="flex-1">
            <p className="text-xs text-gray-400 mb-1">Multiplier</p>
            <div className="w-full bg-black/30 border border-yellow-500/40 rounded-lg px-3 py-2 text-yellow-400 font-bold">
              {Math.floor(36 / (end - start + 1))}x
            </div>
          </div>
        </div>
        <div className="flex gap-2 mt-3 flex-wrap">
          {[{ label: "1–18", s:1, e:18 }, { label: "19–36", s:19, e:36 }, { label: "1–12", s:1, e:12 }, { label: "13–24", s:13, e:24 }, { label: "0", s:0, e:0 }]
            .map((p) => (
              <button key={p.label} onClick={() => { setStart(p.s); setEnd(p.e); }}
                className="px-3 py-1 text-xs rounded-full border border-[#2A2A4A] text-gray-400 hover:border-yellow-500 hover:text-yellow-400 transition-colors">
                {p.label}
              </button>
            ))}
        </div>
      </div>

      <BetPanel onBet={handleBet} loading={spinning} />

      <AnimatePresence>
        {won !== null && (
          <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ opacity: 0 }}
            className={`card p-6 text-center w-full max-w-md ${won ? "border-green-500" : "border-red-500"}`}>
            <p className="text-4xl mb-2">{won ? "🎉" : "😞"}</p>
            <p className="text-xl font-bold">{won ? `You Won +${payout.toFixed(4)}!` : "You Lost"}</p>
            <p className="text-gray-400 mt-1">Result: <span className="text-white font-bold">{result}</span></p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
