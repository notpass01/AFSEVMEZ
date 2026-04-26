"use client";

import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import SlotMachine, { SymbolDef, PayEntry } from "@/components/SlotMachine";

const SYMBOLS: SymbolDef[] = [
  { icon: "🍒", label: "Cherry"  },
  { icon: "🍋", label: "Lemon"   },
  { icon: "🍊", label: "Orange"  },
  { icon: "🍇", label: "Grape"   },
  { icon: "⭐", label: "Star"    },
  { icon: "7️⃣", label: "Seven"   },
  { icon: "💎", label: "Diamond" },
];

const PAY_TABLE: PayEntry[] = [
  { combo: "💎 💎 💎",        mult: "15x", color: "text-cyan-300"   },
  { combo: "7️⃣ 7️⃣ 7️⃣",        mult: "10x", color: "text-blue-400"   },
  { combo: "⭐ ⭐ ⭐",        mult: "7x",  color: "text-yellow-400" },
  { combo: "🍒/🍋/🍊/🍇 ×3", mult: "3x",  color: "text-green-400"  },
  { combo: "💎 💎 (any pos)", mult: "2x",  color: "text-cyan-400"   },
];

export default function FruitPage() {
  return (
    <div className="flex flex-col items-center px-4 py-10 gap-6 max-w-lg mx-auto">
      <div className="w-full flex items-center gap-3">
        <Link href="/slots" className="text-gray-400 hover:text-white transition-colors">
          <ChevronLeft size={22} />
        </Link>
        <div>
          <h1 className="font-display text-3xl font-bold text-gold-gradient">🍒 Fruit Frenzy</h1>
          <p className="text-gray-400 text-sm">Match 3 symbols · up to 15x jackpot</p>
        </div>
      </div>

      <SlotMachine
        gameType="slots_fruit"
        symbols={SYMBOLS}
        payTable={PAY_TABLE}
        jackpotMultiplier={15}
        hint="Hit 💎💎💎 for the jackpot! Two 💎 anywhere also pays 2x."
      />
    </div>
  );
}
