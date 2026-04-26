"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import BetPanel from "@/components/BetPanel";
import { useAuth } from "@/hooks/useAuth";

export default function CoinFlipPage() {
  const { refetch } = useAuth();
  const [side, setSide] = useState<0|1>(0);
  const [flipping, setFlipping] = useState(false);
  const [result, setResult] = useState<number | null>(null);
  const [won, setWon] = useState<boolean | null>(null);
  const [payout, setPayout] = useState(0);

  const handleBet = async (coin: string, amount: number) => {
    setFlipping(true); setResult(null); setWon(null);
    try {
      const token = localStorage.getItem("ww_token");
      const res = await fetch("/api/game", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ game: "coinflip", coin, amount, param1: side }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error); return; }
      setResult(data.result);
      setWon(data.win);
      setPayout(data.payout);
      data.win
        ? toast.success(`🪙 ${data.result===0?"Heads":"Tails"} — +${data.payout.toFixed(4)} ${coin}`)
        : toast.error(`🪙 ${data.result===0?"Heads":"Tails"} — Lost`);
      refetch();
    } finally {
      setFlipping(false);
    }
  };

  return (
    <div className="flex flex-col items-center px-4 py-10 gap-8">
      <h1 className="font-display text-4xl font-bold text-gold-gradient">🪙 Coin Flip</h1>
      <p className="text-gray-400 text-sm">Heads or tails? Win 2x your bet.</p>

      <motion.div
        animate={flipping ? { rotateY:[0,180,360,540,720] } : result !== null ? { rotateY: result===0?0:180 } : {}}
        transition={{ duration: flipping ? 1.5 : 0.3 }}
        className="w-40 h-40 rounded-full flex items-center justify-center text-7xl border-4 border-yellow-500 shadow-[0_0_40px_rgba(212,175,55,0.4)]"
        style={{ background: "radial-gradient(circle, #D4AF37, #A8882A)" }}>
        {result !== null ? (result===0?"👑":"🦅") : (side===0?"👑":"🦅")}
      </motion.div>

      <div className="card p-5 w-full max-w-md">
        <p className="text-xs text-gray-400 mb-3 uppercase tracking-wider">Choose Side</p>
        <div className="grid grid-cols-2 gap-4">
          {([{ value:0 as const, label:"Heads", icon:"👑" }, { value:1 as const, label:"Tails", icon:"🦅" }]).map((opt) => (
            <button key={opt.value} onClick={() => setSide(opt.value)}
              className={`py-6 rounded-xl border-2 flex flex-col items-center gap-2 transition-all
                          ${side===opt.value ? "border-yellow-500 bg-yellow-500/10 scale-105" : "border-[#2A2A4A] hover:border-gray-500"}`}>
              <span className="text-5xl">{opt.icon}</span>
              <span className={`font-bold ${side===opt.value?"text-yellow-400":"text-gray-300"}`}>{opt.label}</span>
            </button>
          ))}
        </div>
        <p className="text-center text-sm text-gray-400 mt-3">Multiplier: <span className="text-yellow-400 font-bold">2x</span></p>
      </div>

      <BetPanel onBet={handleBet} loading={flipping} />

      <AnimatePresence>
        {won !== null && (
          <motion.div initial={{ y:20, opacity:0 }} animate={{ y:0, opacity:1 }} exit={{ opacity:0 }}
            className={`card p-6 text-center w-full max-w-md ${won ? "border-green-500" : "border-red-500"}`}>
            <p className="text-4xl mb-2">{won ? "🎉" : "😞"}</p>
            <p className="text-xl font-bold">{won ? `You Won +${payout.toFixed(4)}!` : "You Lost"}</p>
            <p className="text-gray-400 mt-1">Result: <span className="text-white font-bold">{result===0?"👑 Heads":"🦅 Tails"}</span></p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
