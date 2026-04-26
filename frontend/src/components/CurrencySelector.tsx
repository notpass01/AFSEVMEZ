"use client";

import { useState, useRef, useEffect } from "react";
import { CURRENCIES } from "@/services/priceService";
import { ChevronDown } from "lucide-react";

type Currency = typeof CURRENCIES[0];

interface Props {
  currency: Currency;
  setCurrency: (c: Currency) => void;
}

export default function CurrencySelector({ currency, setCurrency }: Props) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const filtered = CURRENCIES.filter((c) =>
    c.code.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium
                   border border-[#2A2A4A] bg-[#1A1A2E] hover:border-yellow-500 transition-colors"
      >
        <span>{currency.flag}</span>
        <span className="text-yellow-400">{currency.code}</span>
        <ChevronDown size={14} className={`text-gray-400 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute right-0 top-12 w-64 rounded-xl shadow-2xl z-50 overflow-hidden"
          style={{ background: "#1A1A2E", border: "1px solid #2A2A4A" }}>
          <div className="p-2 border-b border-[#2A2A4A]">
            <input
              autoFocus
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search currency..."
              className="w-full bg-transparent text-sm text-white outline-none px-2 py-1 placeholder-gray-500"
            />
          </div>
          <div className="max-h-72 overflow-y-auto p-1">
            {filtered.map((c) => (
              <button
                key={c.code}
                onClick={() => { setCurrency(c); setOpen(false); setSearch(""); }}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm
                            hover:bg-[#2A2A4A] transition-colors text-left
                            ${c.code === currency.code ? "text-yellow-400" : "text-gray-200"}`}
              >
                <span className="text-lg">{c.flag}</span>
                <span className="font-medium">{c.code}</span>
                <span className="text-gray-400 ml-auto">{c.symbol}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
