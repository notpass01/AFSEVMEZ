"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import Link from "next/link";
import { Search, SlidersHorizontal, ChevronDown, Check } from "lucide-react";

interface SlotGame {
  href: string;
  name: string;
  provider: string;
  maxWin: string;
  online: number;
  emoji: string[];
  grad: string;
  image?: string;   // optional: real image path, overrides emoji+grad
  available: boolean;
  hot?: boolean;
  isNew?: boolean;
}

const ALL_GAMES: SlotGame[] = [
  // ── WinWin Originals ──────────────────────────────────────
  {
    href: "/slots/fruit",
    name: "Fruit Frenzy",
    provider: "WinWin Original",
    maxWin: "15x",
    online: 347,
    emoji: ["🍒", "💎", "🍋"],
    grad: "from-green-700 via-emerald-600 to-teal-700",
    available: true,
    isNew: true,
  },
  {
    href: "/slots/diamond",
    name: "Diamond Rush",
    provider: "WinWin Original",
    maxWin: "20x",
    online: 512,
    emoji: ["💎", "🔷", "💠"],
    grad: "from-cyan-700 via-blue-600 to-indigo-700",
    available: true,
    hot: true,
  },
  {
    href: "/slots/lucky7",
    name: "Lucky 7s",
    provider: "WinWin Original",
    maxWin: "8x",
    online: 289,
    emoji: ["7️⃣", "⭐", "🔔"],
    grad: "from-purple-700 via-violet-600 to-fuchsia-700",
    available: true,
  },
  {
    href: "/slots/olympus",
    name: "Gates of Olympus",
    provider: "WinWin Original",
    maxWin: "50x",
    online: 763,
    emoji: ["⚡", "👑", "💎"],
    grad: "from-purple-900 via-violet-800 to-indigo-900",
    image: "/games/gates-of-olympus.avif",
    available: true,
    hot: true,
  },
  // ── Pragmatic Play ────────────────────────────────────────
  {
    href: "/slots/gates-of-olympus",
    name: "Gates of Olympus",
    provider: "Pragmatic Play",
    maxWin: "5000x",
    online: 914,
    emoji: ["⚡", "👑", "💎"],
    grad: "from-purple-900 via-blue-800 to-indigo-900",
    image: "/games/gates-of-olympus.avif",
    available: true,
  },
  // ── WinWin Originals — Coming Soon ───────────────────────
  {
    href: "#",
    name: "Halloween Nights",
    provider: "WinWin Original",
    maxWin: "25x",
    online: 0,
    emoji: ["🎃", "👻", "🕷️"],
    grad: "from-orange-900 via-orange-700 to-red-800",
    available: false,
  },
  {
    href: "#",
    name: "Gold Rush",
    provider: "WinWin Original",
    maxWin: "30x",
    online: 0,
    emoji: ["💰", "🏆", "⭐"],
    grad: "from-yellow-700 via-amber-600 to-orange-700",
    available: false,
  },
  {
    href: "#",
    name: "Cosmic Spin",
    provider: "WinWin Original",
    maxWin: "50x",
    online: 0,
    emoji: ["🚀", "🪐", "⭐"],
    grad: "from-indigo-900 via-purple-700 to-pink-800",
    available: false,
  },
  {
    href: "#",
    name: "Ocean Treasure",
    provider: "WinWin Original",
    maxWin: "18x",
    online: 0,
    emoji: ["🐬", "💎", "🐚"],
    grad: "from-blue-800 via-cyan-700 to-teal-800",
    available: false,
  },
  {
    href: "#",
    name: "Dragon Fire",
    provider: "WinWin Original",
    maxWin: "40x",
    online: 0,
    emoji: ["🐉", "🔥", "💎"],
    grad: "from-red-800 via-rose-700 to-orange-800",
    available: false,
  },
];

const SORT_OPTIONS = ["Popular", "New", "Max Win"];

// Provider badge short names
const PROVIDER_BADGE: Record<string, string> = {
  "WinWin Original": "W",
  "Pragmatic Play":  "PP",
};

// Provider badge colors
const PROVIDER_COLOR: Record<string, string> = {
  "WinWin Original": "text-yellow-400",
  "Pragmatic Play":  "text-red-400",
};

function GameCard({ game }: { game: SlotGame }) {
  const [imgError, setImgError] = useState(false);
  const badge = PROVIDER_BADGE[game.provider] ?? "?";
  const badgeColor = PROVIDER_COLOR[game.provider] ?? "text-white";
  const showImage = !!game.image && !imgError;

  const inner = (
    <div
      className={`relative rounded-xl overflow-hidden aspect-[3/4] cursor-pointer group
                  border-2 transition-all duration-200
                  ${game.available
                    ? "border-transparent hover:border-yellow-500/60 hover:shadow-[0_0_20px_rgba(212,175,55,0.2)] hover:-translate-y-0.5"
                    : "border-transparent opacity-50 cursor-not-allowed"}`}
    >
      {/* Background: real image OR gradient+emoji fallback */}
      <div className={`absolute inset-0 bg-gradient-to-b ${game.grad}`} />

      {showImage ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={game.image}
          alt={game.name}
          onError={() => setImgError(true)}
          className="absolute inset-0 w-full h-full object-cover
                     group-hover:scale-105 transition-transform duration-300"
        />
      ) : (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 pb-10">
          <span className="text-5xl drop-shadow-lg group-hover:scale-110 transition-transform duration-300">
            {game.emoji[0]}
          </span>
          <div className="flex gap-1 opacity-70">
            <span className="text-2xl">{game.emoji[1]}</span>
            <span className="text-2xl">{game.emoji[2]}</span>
          </div>
        </div>
      )}

      {/* Provider badge — top left */}
      <div className="absolute top-2 left-2 px-1.5 py-0.5 rounded bg-black/60 border border-white/10
                      flex items-center justify-center min-w-[22px]">
        <span className={`text-[9px] font-black ${badgeColor}`}>{badge}</span>
      </div>

      {/* Status badges — top right */}
      {game.hot && (
        <div className="absolute top-2 right-2 bg-red-500 text-white text-[9px] font-black
                        px-1.5 py-0.5 rounded-full">HOT</div>
      )}
      {game.isNew && !game.hot && (
        <div className="absolute top-2 right-2 bg-yellow-500 text-black text-[9px] font-black
                        px-1.5 py-0.5 rounded-full">NEW</div>
      )}
      {!game.available && (
        <div className="absolute top-2 right-2 bg-gray-700 text-gray-300 text-[9px] font-black
                        px-1.5 py-0.5 rounded-full">SOON</div>
      )}

      {/* Dark gradient overlay */}
      <div className="absolute bottom-0 left-0 right-0 h-2/5
                      bg-gradient-to-t from-black/90 via-black/60 to-transparent" />

      {/* Text */}
      <div className="absolute bottom-0 left-0 right-0 p-2.5">
        <p className="text-white font-black text-xs leading-tight uppercase tracking-wide
                      drop-shadow-[0_1px_3px_rgba(0,0,0,0.8)]">
          {game.name}
        </p>
        <p className="text-gray-400 text-[10px]">{game.provider}</p>
        <div className="flex items-center gap-1 mt-1">
          {game.available ? (
            <>
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              <span className="text-[10px] text-gray-300">{game.online.toLocaleString()} online</span>
            </>
          ) : (
            <span className="text-[10px] text-gray-600">Coming soon</span>
          )}
        </div>
      </div>
    </div>
  );

  if (!game.available) return <div>{inner}</div>;
  return <Link href={game.href}>{inner}</Link>;
}

// ── Provider dropdown with checkboxes ─────────────────────────────────────────
function ProviderDropdown({
  selected,
  onChange,
}: {
  selected: Set<string>;
  onChange: (s: Set<string>) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Count games per provider
  const counts: Record<string, number> = {};
  for (const g of ALL_GAMES) {
    counts[g.provider] = (counts[g.provider] ?? 0) + 1;
  }

  const providers = [
    { name: "WinWin Original", count: counts["WinWin Original"] ?? 0 },
    { name: "Pragmatic Play",  count: counts["Pragmatic Play"]  ?? 0 },
  ];

  const toggle = (name: string) => {
    const next = new Set(selected);
    if (next.has(name)) next.delete(name);
    else next.add(name);
    onChange(next);
  };

  const activeCount = selected.size;

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-sm transition-all
                    ${activeCount > 0
                      ? "border-yellow-500 bg-yellow-500/10 text-yellow-400"
                      : "border-[#2A2A4A] text-gray-400 hover:border-gray-500"}`}
      >
        Providers
        {activeCount > 0 && (
          <span className="w-5 h-5 rounded-full bg-yellow-500 text-black text-[10px] font-black
                           flex items-center justify-center">
            {activeCount}
          </span>
        )}
        <ChevronDown size={14} className={`transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute left-0 top-11 w-64 rounded-xl border border-[#2A2A4A]
                        bg-[#1A1A2E] shadow-2xl z-50 overflow-hidden">
          <div className="px-4 py-3 border-b border-[#2A2A4A]">
            <p className="text-xs font-bold text-gray-300 uppercase tracking-wider">Popular</p>
          </div>
          <div className="py-1 max-h-72 overflow-y-auto">
            {providers.map(p => (
              <button
                key={p.name}
                onClick={() => toggle(p.name)}
                className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-[#2A2A4A]
                           transition-colors text-left"
              >
                {/* Checkbox */}
                <div className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0
                                 transition-colors
                                 ${selected.has(p.name)
                                   ? "border-yellow-500 bg-yellow-500"
                                   : "border-gray-600 bg-transparent"}`}>
                  {selected.has(p.name) && <Check size={10} className="text-black" strokeWidth={3} />}
                </div>
                <span className="flex-1 text-sm text-gray-200">{p.name}</span>
                {p.count > 0 && (
                  <span className="bg-blue-600 text-white text-[10px] font-bold
                                   px-2 py-0.5 rounded-full min-w-[24px] text-center">
                    {p.count}
                  </span>
                )}
              </button>
            ))}
          </div>
          {activeCount > 0 && (
            <div className="px-4 py-3 border-t border-[#2A2A4A]">
              <button
                onClick={() => onChange(new Set())}
                className="text-xs text-gray-400 hover:text-white transition-colors"
              >
                Clear all
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function SlotsLobbyPage() {
  const [search, setSearch]               = useState("");
  const [sortBy, setSortBy]               = useState("Popular");
  const [showSort, setShowSort]           = useState(false);
  const [onlyAvailable, setOnlyAvailable] = useState(false);
  const [providers, setProviders]         = useState<Set<string>>(new Set());
  const sortRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (sortRef.current && !sortRef.current.contains(e.target as Node)) setShowSort(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const filtered = useMemo(() => {
    let list = ALL_GAMES;

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(g => g.name.toLowerCase().includes(q) || g.provider.toLowerCase().includes(q));
    }
    if (onlyAvailable) list = list.filter(g => g.available);
    if (providers.size > 0) list = list.filter(g => providers.has(g.provider));

    if (sortBy === "Popular")  list = [...list].sort((a, b) => b.online - a.online);
    if (sortBy === "New")      list = [...list].sort((a, b) => (b.isNew ? 1 : 0) - (a.isNew ? 1 : 0));
    if (sortBy === "Max Win")  list = [...list].sort((a, b) => parseInt(b.maxWin) - parseInt(a.maxWin));

    return list;
  }, [search, sortBy, onlyAvailable, providers]);

  const playableCount = ALL_GAMES.filter(g => g.available).length;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 flex flex-col gap-6">

      {/* Title */}
      <div>
        <h1 className="font-display text-3xl font-bold text-gold-gradient">🎰 Slots</h1>
        <p className="text-gray-500 text-sm mt-1">
          {playableCount} playable · more coming soon
        </p>
      </div>

      {/* Search */}
      <div className="flex items-center gap-3 bg-[#1A1A2E] border border-[#2A2A4A]
                      rounded-xl px-4 py-3 focus-within:border-yellow-500/50 transition-colors">
        <Search size={18} className="text-gray-500 flex-shrink-0" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search games..."
          className="flex-1 bg-transparent text-white outline-none placeholder-gray-600 text-sm"
        />
        {search && (
          <button onClick={() => setSearch("")} className="text-gray-500 hover:text-white text-sm">✕</button>
        )}
      </div>

      {/* Filter row */}
      <div className="flex items-center gap-3 flex-wrap">
        <button
          onClick={() => setOnlyAvailable(!onlyAvailable)}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-sm transition-all
                      ${onlyAvailable
                        ? "border-yellow-500 bg-yellow-500/10 text-yellow-400"
                        : "border-[#2A2A4A] text-gray-400 hover:border-gray-500"}`}
        >
          <SlidersHorizontal size={14} />
          Playable only
        </button>

        <ProviderDropdown selected={providers} onChange={setProviders} />

        <div className="flex-1" />

        {/* Sort */}
        <div ref={sortRef} className="relative">
          <button
            onClick={() => setShowSort(!showSort)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-[#2A2A4A]
                       text-sm text-gray-300 hover:border-gray-500 transition-colors"
          >
            {sortBy}
            <ChevronDown size={14} className={`transition-transform ${showSort ? "rotate-180" : ""}`} />
          </button>
          {showSort && (
            <div className="absolute right-0 top-11 w-40 rounded-xl border border-[#2A2A4A]
                            bg-[#1A1A2E] shadow-2xl z-50 overflow-hidden">
              {SORT_OPTIONS.map(opt => (
                <button
                  key={opt}
                  onClick={() => { setSortBy(opt); setShowSort(false); }}
                  className={`w-full flex items-center justify-between px-4 py-2.5 text-sm
                              transition-colors hover:bg-[#2A2A4A]
                              ${sortBy === opt ? "text-yellow-400 font-medium" : "text-gray-300"}`}
                >
                  {opt}
                  {sortBy === opt && <Check size={12} className="text-yellow-400" />}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Results */}
      {filtered.length > 0 ? (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
          {filtered.map(g => <GameCard key={g.href} game={g} />)}
        </div>
      ) : (
        <div className="flex flex-col items-center py-20 gap-3 text-center">
          <span className="text-4xl">🔍</span>
          <p className="text-gray-400">No games found</p>
          <button
            onClick={() => { setSearch(""); setProviders(new Set()); setOnlyAvailable(false); }}
            className="text-yellow-400 text-sm hover:underline"
          >
            Clear filters
          </button>
        </div>
      )}
    </div>
  );
}
