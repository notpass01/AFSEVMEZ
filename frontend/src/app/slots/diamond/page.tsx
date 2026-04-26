"use client";

import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import SlotMachine, { SymbolDef, PayEntry } from "@/components/SlotMachine";

const SYMBOLS: SymbolDef[] = [
  { icon: "⬛", label: "Black"   },
  { icon: "💠", label: "Blue"    },
  { icon: "🔷", label: "Crystal" },
  { icon: "💎", label: "Diamond" },
];

const PAY_TABLE: PayEntry[] = [
  { combo: "💎 💎 💎", mult: "20x", color: "text-cyan-300"   },
  { combo: "🔷 🔷 🔷", mult: "8x",  color: "text-blue-400"   },
  { combo: "💠 💠 💠", mult: "4x",  color: "text-indigo-400" },
  { combo: "⬛ ⬛ ⬛", mult: "2x",  color: "text-gray-400"   },
];

export default function DiamondPage() {
  return (
    <div className="flex flex-col items-center px-4 py-10 gap-6 max-w-lg mx-auto">
      <div className="w-full flex items-center gap-3">
        <Link href="/slots" className="text-gray-400 hover:text-white transition-colors">
          <ChevronLeft size={22} />
        </Link>
        <div>
          <h1 className="font-display text-3xl font-bold" style={{ background: "linear-gradient(135deg,#67e8f9,#818cf8)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            💎 Diamond Rush
          </h1>
          <p className="text-gray-400 text-sm">High variance · only 4 symbols · up to 20x</p>
        </div>
      </div>

      <SlotMachine
        gameType="slots_diamond"
        symbols={SYMBOLS}
        payTable={PAY_TABLE}
        jackpotMultiplier={20}
        hint="Fewer symbols = higher hit rate. Land 💎💎💎 for 20x!"
      />
    </div>
  );
}
