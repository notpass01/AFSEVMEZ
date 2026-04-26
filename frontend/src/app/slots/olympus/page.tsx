"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import { ChevronLeft } from "lucide-react";
import BetPanel from "@/components/BetPanel";
import { useAuth } from "@/hooks/useAuth";

/* ── Semboller ─────────────────────────────────────────── */
const SYMBOLS = [
  { id: 0, src: "/games/goo/orb-green.png",   label: "Green Orb",    mult: 2  },
  { id: 1, src: "/games/goo/orb-purple.png",  label: "Purple Orb",   mult: 3  },
  { id: 2, src: "/games/goo/orb-red.png",     label: "Red Orb",      mult: 5  },
  { id: 3, src: "/games/goo/orb-blue.png",    label: "Blue Orb",     mult: 7  },
  { id: 4, src: "/games/goo/diamond.png",     label: "Diamond",      mult: 10 },
  { id: 5, src: "/games/goo/goblet.png",      label: "Goblet",       mult: 15 },
  { id: 6, src: "/games/goo/crown.png",       label: "Crown",        mult: 20 },
  { id: 7, src: "/games/goo/scatter.png",     label: "Zeus",         mult: 50 },
];

/* ── Reel bileşeni ─────────────────────────────────────── */
function Reel({ symId, spinning }: { symId: number; spinning: boolean }) {
  const [display, setDisplay] = useState(symId);
  const interval = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (spinning) {
      interval.current = setInterval(
        () => setDisplay(Math.floor(Math.random() * SYMBOLS.length)),
        80
      );
    } else {
      if (interval.current) clearInterval(interval.current);
      setDisplay(symId);
    }
    return () => { if (interval.current) clearInterval(interval.current); };
  }, [spinning, symId]);

  const sym = SYMBOLS[display] ?? SYMBOLS[0];

  return (
    <div
      className="relative flex items-center justify-center overflow-hidden"
      style={{
        width: 120, height: 120,
        background: "linear-gradient(135deg,#1a0a2e 0%,#2d1060 100%)",
        borderRadius: 12,
        border: "2px solid rgba(212,175,55,0.4)",
        boxShadow: "inset 0 0 20px rgba(0,0,0,0.6)",
      }}
    >
      <motion.div
        key={spinning ? undefined : display}
        initial={spinning ? {} : { scale: 1.3, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.2 }}
        className="relative w-20 h-20"
      >
        <Image src={sym.src} alt={sym.label} fill className="object-contain drop-shadow-lg" />
      </motion.div>
    </div>
  );
}

/* ── Ana sayfa ─────────────────────────────────────────── */
export default function OlympusSlotPage() {
  const { refetch } = useAuth();
  const [spinning, setSpinning] = useState(false);
  const [reels, setReels] = useState([0, 3, 6]);
  const [won, setWon] = useState<boolean | null>(null);
  const [payout, setPayout] = useState(0);
  const [multiplier, setMultiplier] = useState(0);
  const [coin, setCoin] = useState("USDT");
  const [showPay, setShowPay] = useState(false);

  const handleBet = async (selectedCoin: string, amount: number): Promise<void> => {
    setSpinning(true);
    setWon(null);
    setCoin(selectedCoin);
    try {
      const token = localStorage.getItem("ww_token");
      const res = await fetch("/api/game", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ game: "slots_olympus", coin: selectedCoin, amount }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error); return; }

      await new Promise(r => setTimeout(r, 1800));

      const r0 = Math.floor(data.result / 100);
      const r1 = Math.floor((data.result % 100) / 10);
      const r2 = data.result % 10;
      setReels([r0, r1, r2]);
      setWon(data.win);
      setPayout(data.payout);
      setMultiplier(data.multiplier);

      if (data.win) {
        data.multiplier >= 50
          ? toast.success(`✨ ZEUS JACKPOT! ${data.multiplier}x — +${data.payout.toFixed(4)} ${selectedCoin}`, { duration: 6000 })
          : toast.success(`⚡ ${data.multiplier}x WIN! +${data.payout.toFixed(4)} ${selectedCoin}`);
      } else {
        toast.error("The gods are not pleased. Try again!");
      }
      refetch();
    } finally {
      setSpinning(false);
    }
  };

  const isJackpot = !!won && multiplier >= 50;

  return (
    <div className="min-h-screen flex flex-col items-center px-4 py-6 gap-6 max-w-2xl mx-auto">

      {/* Header */}
      <div className="w-full flex items-center justify-between">
        <Link href="/slots" className="text-gray-400 hover:text-white transition-colors">
          <ChevronLeft size={22} />
        </Link>
        <div className="text-center">
          <h1 className="font-display text-2xl font-bold text-gold-gradient">
            Gates of Olympus
          </h1>
          <p className="text-xs text-gray-400">WinWin Original · up to 50x</p>
        </div>
        <button
          onClick={() => setShowPay(!showPay)}
          className="text-xs text-yellow-400 border border-yellow-500/30 px-3 py-1.5 rounded-lg
                     hover:bg-yellow-500/10 transition-colors"
        >
          Pay Table
        </button>
      </div>

      {/* Pay table */}
      <AnimatePresence>
        {showPay && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="w-full card p-4"
          >
            <p className="text-xs text-gray-400 uppercase tracking-wider mb-3 text-center">
              Match 3 identical symbols to win
            </p>
            <div className="grid grid-cols-2 gap-2">
              {[...SYMBOLS].reverse().map(s => (
                <div key={s.id} className="flex items-center gap-3 bg-black/30 rounded-xl px-3 py-2">
                  <div className="relative w-9 h-9 flex-shrink-0">
                    <Image src={s.src} alt={s.label} fill className="object-contain" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-300">{s.label} x3</p>
                    <p className={`font-black text-sm ${s.mult >= 50 ? "text-yellow-300" : s.mult >= 20 ? "text-yellow-400" : s.mult >= 10 ? "text-green-400" : "text-gray-300"}`}>
                      {s.mult}x
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Game area */}
      <div className="relative w-full">
        {/* Temple background */}
        <div className="absolute inset-0 rounded-3xl overflow-hidden opacity-40">
          <Image src="/games/goo/temple.png" alt="" fill className="object-cover object-bottom" />
        </div>

        {/* Machine frame */}
        <div
          className="relative rounded-3xl overflow-hidden p-6"
          style={{
            background: "linear-gradient(180deg,rgba(20,5,50,0.95) 0%,rgba(10,2,30,0.98) 100%)",
            border: "2px solid rgba(212,175,55,0.5)",
            boxShadow: "0 0 60px rgba(120,50,200,0.3), inset 0 0 40px rgba(0,0,0,0.5)",
          }}
        >
          {/* Jackpot flash */}
          <AnimatePresence>
            {isJackpot && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 pointer-events-none rounded-3xl z-10"
                style={{ boxShadow: "inset 0 0 80px rgba(255,215,0,0.4)" }}
              />
            )}
          </AnimatePresence>

          {/* Decorative top line */}
          <div className="flex items-center gap-2 mb-4 justify-center">
            <div className="h-px flex-1 bg-gradient-to-r from-transparent to-yellow-500/50" />
            <span className="text-yellow-500 text-xs tracking-[0.3em] uppercase font-bold">Olympus</span>
            <div className="h-px flex-1 bg-gradient-to-l from-transparent to-yellow-500/50" />
          </div>

          {/* Reels */}
          <div className="relative flex justify-center gap-3 mb-4">
            {/* Reel container bg */}
            <div
              className="absolute inset-0 rounded-2xl opacity-50"
              style={{ background: "url('/games/goo/reels-bg.png') center/cover" }}
            />
            <div className="relative flex gap-3 z-10 p-3">
              {reels.map((sym, i) => (
                <Reel key={i} symId={sym} spinning={spinning} />
              ))}
            </div>
          </div>

          {/* Win line */}
          <div
            className="mx-3 h-0.5 rounded mb-3"
            style={{ background: "linear-gradient(90deg, transparent, rgba(212,175,55,0.6), transparent)" }}
          />

          {/* Result */}
          <AnimatePresence>
            {won !== null && !spinning && (
              <motion.div
                initial={{ y: -8, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ opacity: 0 }}
                className={`text-center py-3 rounded-xl font-bold text-base mx-1
                            ${won
                              ? isJackpot
                                ? "text-yellow-300 border border-yellow-400/50"
                                : "text-green-400 border border-green-500/40"
                              : "text-red-400 border border-red-500/20"
                            }`}
                style={{
                  background: won
                    ? isJackpot ? "rgba(255,215,0,0.1)" : "rgba(0,200,100,0.08)"
                    : "rgba(200,0,0,0.06)"
                }}
              >
                {won
                  ? `⚡ +${payout.toFixed(6)} ${coin}  (${multiplier}x)`
                  : "The gods are silent... Try again!"}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Spinning indicator */}
          {spinning && (
            <div className="text-center text-yellow-400/60 text-xs animate-pulse py-1">
              The gates are opening...
            </div>
          )}
        </div>
      </div>

      {/* Bet panel */}
      <div className="w-full">
        <BetPanel onBet={handleBet} loading={spinning}>
          <p className="text-center text-xs text-gray-500">
            Match 3 symbols to win · Zeus x3 = 50x jackpot
          </p>
        </BetPanel>
      </div>
    </div>
  );
}
