"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import BetPanel from "@/components/BetPanel";
import { useAuth } from "@/hooks/useAuth";

const DICE_FACES = ["⚀","⚁","⚂","⚃","⚄","⚅"];

export default function DicePage() {
  const { refetch } = useAuth();
  const [target, setTarget] = useState(1);
  const [rolling, setRolling] = useState(false);
  const [result, setResult] = useState<number | null>(null);
  const [won, setWon] = useState<boolean | null>(null);
  const [payout, setPayout] = useState(0);

  const handleBet = async (coin: string, amount: number) => {
    setRolling(true); setResult(null); setWon(null);
    try {
      const token = localStorage.getItem("ww_token");
      const res = await fetch("/api/game", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ game: "dice", coin, amount, param1: target }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error); return; }
      setResult(data.result);
      setWon(data.win);
      setPayout(data.payout);
      data.win
        ? toast.success(`🎲 Rolled ${data.result} — +${data.payout.toFixed(4)} ${coin}`)
        : toast.error(`🎲 Rolled ${data.result} — Lost`);
      refetch();
    } finally {
      setRolling(false);
    }
  };

  return (
    <div className="flex flex-col items-center px-4 py-10 gap-8">
      <h1 className="font-display text-4xl font-bold text-gold-gradient">🎲 Dice</h1>
      <p className="text-gray-400 text-sm">Pick a number 1–6. Hit it exactly and win 6x!</p>

      <motion.div
        animate={rolling ? { rotate: [0,90,180,270,360], scale:[1,1.2,1,1.2,1] } : {}}
        transition={{ duration: 1, repeat: rolling ? Infinity : 0 }}
        className="text-[120px] select-none">
        {result !== null ? DICE_FACES[result-1] : DICE_FACES[target-1]}
      </motion.div>

      <div className="card p-5 w-full max-w-md">
        <p className="text-xs text-gray-400 mb-3 uppercase tracking-wider">Pick Your Number</p>
        <div className="grid grid-cols-6 gap-3">
          {[1,2,3,4,5,6].map((n) => (
            <button key={n} onClick={() => setTarget(n)}
              className={`aspect-square text-4xl flex items-center justify-center rounded-xl border-2 transition-all
                          ${target === n ? "border-yellow-500 bg-yellow-500/10 scale-110" : "border-[#2A2A4A] hover:border-gray-500"}`}>
              {DICE_FACES[n-1]}
            </button>
          ))}
        </div>
        <p className="text-center text-sm text-gray-400 mt-3">
          Selected: <span className="text-yellow-400 font-bold">{target}</span> · Multiplier: <span className="text-yellow-400 font-bold">6x</span>
        </p>
      </div>

      <BetPanel onBet={handleBet} loading={rolling} />

      <AnimatePresence>
        {won !== null && (
          <motion.div initial={{ y:20, opacity:0 }} animate={{ y:0, opacity:1 }} exit={{ opacity:0 }}
            className={`card p-6 text-center w-full max-w-md ${won ? "border-green-500" : "border-red-500"}`}>
            <p className="text-4xl mb-2">{won ? "🎉" : "😞"}</p>
            <p className="text-xl font-bold">{won ? `You Won +${payout.toFixed(4)}!` : "You Lost"}</p>
            <p className="text-gray-400 mt-1">Rolled: <span className="text-white font-bold text-2xl">{result !== null ? DICE_FACES[result-1] : ""}</span></p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
