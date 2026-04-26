"use client";

import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import SlotMachine, { SymbolDef, PayEntry } from "@/components/SlotMachine";

const SYMBOLS: SymbolDef[] = [
  { icon: "🍒", label: "Cherry" },
  { icon: "🔔", label: "Bell"   },
  { icon: "⭐", label: "Star"   },
  { icon: "🃏", label: "Joker"  },
  { icon: "7️⃣", label: "Seven"  },
];

const PAY_TABLE: PayEntry[] = [
  { combo: "7️⃣ 7️⃣ 7️⃣", mult: "8x", color: "text-yellow-400" },
  { combo: "🃏 🃏 🃏", mult: "5x", color: "text-purple-400" },
  { combo: "⭐ ⭐ ⭐", mult: "3x", color: "text-yellow-300" },
  { combo: "🔔 🔔 🔔", mult: "2x", color: "text-orange-400" },
  { combo: "🍒 🍒 🍒", mult: "2x", color: "text-red-400"    },
];

export default function Lucky7Page() {
  return (
    <div className="flex flex-col items-center px-4 py-10 gap-6 max-w-lg mx-auto">
      <div className="w-full flex items-center gap-3">
        <Link href="/slots" className="text-gray-400 hover:text-white transition-colors">
          <ChevronLeft size={22} />
        </Link>
        <div>
          <h1 className="font-display text-3xl font-bold" style={{ background: "linear-gradient(135deg,#fbbf24,#a78bfa)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            7️⃣ Lucky 7s
          </h1>
          <p className="text-gray-400 text-sm">Classic casino style · 5 symbols · 5 winning combos</p>
        </div>
      </div>

      <SlotMachine
        gameType="slots_lucky7"
        symbols={SYMBOLS}
        payTable={PAY_TABLE}
        jackpotMultiplier={8}
        hint="5 different winning combos — any 3 of a kind pays!"
      />
    </div>
  );
}
