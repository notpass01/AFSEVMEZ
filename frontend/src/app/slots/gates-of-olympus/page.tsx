"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronLeft, Maximize2, Info } from "lucide-react";

export default function GatesOfOlympusPage() {
  const [fullscreen, setFullscreen] = useState(false);
  const [showInfo, setShowInfo] = useState(false);

  return (
    <div className="flex flex-col items-center px-4 py-6 gap-6 max-w-4xl mx-auto">

      {/* Top bar */}
      <div className="w-full flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/slots" className="text-gray-400 hover:text-white transition-colors">
            <ChevronLeft size={22} />
          </Link>
          <div className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/games/gates-of-olympus.avif" alt="Gates of Olympus"
                 className="w-10 h-10 rounded-lg object-cover" />
            <div>
              <h1 className="font-display text-2xl font-bold text-white">Gates of Olympus</h1>
              <p className="text-xs text-gray-400">Pragmatic Play · up to 5000x</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowInfo(!showInfo)}
            className="p-2 rounded-lg border border-[#2A2A4A] text-gray-400 hover:text-white
                       hover:border-gray-500 transition-colors">
            <Info size={16} />
          </button>
          <button onClick={() => setFullscreen(true)}
            className="p-2 rounded-lg border border-[#2A2A4A] text-gray-400 hover:text-white
                       hover:border-gray-500 transition-colors">
            <Maximize2 size={16} />
          </button>
        </div>
      </div>

      {/* Info panel */}
      {showInfo && (
        <div className="w-full card p-4 flex flex-col gap-3">
          <p className="font-bold text-white">About Gates of Olympus</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
            {[
              { label: "Provider",   value: "Pragmatic Play" },
              { label: "Max Win",    value: "5,000x"         },
              { label: "RTP",        value: "96.50%"         },
              { label: "Volatility", value: "High"           },
            ].map(s => (
              <div key={s.label} className="bg-black/30 rounded-xl p-3">
                <p className="text-yellow-400 font-bold text-sm">{s.value}</p>
                <p className="text-xs text-gray-400 mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-500">
            Gates of Olympus is a 6×5 cluster pays slot featuring cascading wins, multipliers,
            and a Free Spins bonus where multipliers collect.
          </p>
        </div>
      )}

      {/* Game iframe */}
      <div className="w-full rounded-2xl overflow-hidden border border-[#2A2A4A] bg-black"
           style={{ aspectRatio: "16/10" }}>
        <iframe
          src="https://demogamesfree.pragmaticplay.net/gs2c/openGame.do?gameSymbol=vs20olympgate&lang=en&cur=USD&jurisdiction=99"
          className="w-full h-full"
          allow="fullscreen"
          title="Gates of Olympus"
        />
      </div>

      {/* Fullscreen overlay */}
      {fullscreen && (
        <div className="fixed inset-0 z-50 bg-black flex flex-col">
          <button onClick={() => setFullscreen(false)}
            className="absolute top-4 right-4 z-10 bg-black/80 text-white px-3 py-1.5
                       rounded-lg text-sm border border-white/20 hover:bg-white/10 transition-colors">
            ✕ Close
          </button>
          <iframe
            src="https://demogamesfree.pragmaticplay.net/gs2c/openGame.do?gameSymbol=vs20olympgate&lang=en&cur=USD&jurisdiction=99"
            className="w-full flex-1"
            allow="fullscreen"
            title="Gates of Olympus"
          />
        </div>
      )}

      {/* Demo notice */}
      <div className="w-full flex items-center gap-3 bg-blue-500/10 border border-blue-500/30
                      rounded-xl px-4 py-3">
        <span className="text-lg">ℹ️</span>
        <div>
          <p className="text-blue-300 text-sm font-medium">Demo Mode</p>
          <p className="text-gray-400 text-xs">Playing with virtual coins. No real money involved.</p>
        </div>
        <Link href="/deposit" className="ml-auto">
          <button className="btn-gold py-1.5 px-4 text-xs whitespace-nowrap">Deposit</button>
        </Link>
      </div>
    </div>
  );
}
