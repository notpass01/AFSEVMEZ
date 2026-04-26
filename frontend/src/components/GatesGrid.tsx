"use client";

import {
  useState, useEffect, useRef, useCallback,
  forwardRef, useImperativeHandle,
} from "react";
import { motion, AnimatePresence } from "framer-motion";

// ─── Layout ───────────────────────────────────────────────────────────────────
const COLS = 6;
const ROWS = 5;
const CELL = 74;
const GAP  = 6;

// ─── Symbols ─────────────────────────────────────────────────────────────────
export const SLOT_SYMBOLS = [
  { id: 0, icon: "⚡", label: "Zeus",      color: "#FFD700" },
  { id: 1, icon: "⏳", label: "Hourglass", color: "#60C0F8" },
  { id: 2, icon: "💍", label: "Ring",      color: "#D8A0E8" },
  { id: 3, icon: "🏺", label: "Chalice",   color: "#FFA040" },
  { id: 4, icon: "🔮", label: "Orb",       color: "#70D8E8" },
  { id: 5, icon: "👑", label: "Crown",     color: "#F8F060" },
  { id: 6, icon: "A",  label: "Ace",       color: "#FF5252", card: true },
  { id: 7, icon: "K",  label: "King",      color: "#4488FF", card: true },
  { id: 8, icon: "Q",  label: "Queen",     color: "#60FF80", card: true },
  { id: 9, icon: "J",  label: "Jack",      color: "#BBBBBB", card: true },
] as const;

// ─── Public types ─────────────────────────────────────────────────────────────
export type SlotGrid = number[][];  // [col][row], row 0 = alt
export type WinMask  = boolean[][];

export interface GatesGridRef {
  spin(result: SlotGrid, wins: WinMask): Promise<void>;
}

// ─── Internal cell ────────────────────────────────────────────────────────────
interface Cell {
  id:          string;
  symbol:      number;
  col:         number;
  row:         number;    // 0 = alt, ROWS-1 = üst
  entrance:    boolean;   // üstten inme animasyonu
  multiplier?: number;
}

const uid   = () => Math.random().toString(36).slice(2, 10);
const rnd   = (n: number) => Math.floor(Math.random() * n);
const sleep = (ms: number) => new Promise<void>(r => setTimeout(r, ms));

function buildGrid(): Cell[] {
  return Array.from({ length: COLS }, (_, col) =>
    Array.from({ length: ROWS }, (_, row) => ({
      id: uid(), symbol: rnd(SLOT_SYMBOLS.length), col, row, entrance: false,
    }))
  ).flat();
}

// ─── Tek hücre görünümü ───────────────────────────────────────────────────────
function CellView({
  symbol, isWin, spinning, size, multiplier,
}: {
  symbol:      number;
  isWin:       boolean;
  spinning:    boolean;
  size:        number;
  multiplier?: number;
}) {
  const sym    = SLOT_SYMBOLS[symbol];
  const isCard = "card" in sym;

  return (
    <div
      className="w-full h-full rounded-xl flex items-center justify-center relative overflow-hidden select-none"
      style={{
        background: `radial-gradient(ellipse at 35% 30%, ${sym.color}1C, #060514 100%)`,
        border:     `1.5px solid ${isWin ? sym.color + "A0" : "rgba(255,255,255,0.07)"}`,
        boxShadow:  isWin
          ? `0 0 20px ${sym.color}80, 0 0 44px ${sym.color}2C, inset 0 0 14px ${sym.color}16`
          : "0 2px 10px rgba(0,0,0,0.6)",
        filter:    spinning ? "blur(1.5px)" : undefined,
        transition: "box-shadow 0.2s, border-color 0.2s, filter 0.1s",
      }}
    >
      {isCard ? (
        <span
          style={{
            color:      sym.color,
            fontSize:   size * 0.38,
            fontFamily: '"Cinzel", "Times New Roman", serif',
            fontWeight: 900,
            textShadow: isWin ? `0 0 12px ${sym.color}` : "none",
          }}
        >
          {sym.icon}
        </span>
      ) : (
        <span
          style={{
            fontSize: size * 0.48,
            filter:   isWin
              ? `drop-shadow(0 0 6px ${sym.color}) drop-shadow(0 0 14px ${sym.color}80) brightness(1.15)`
              : undefined,
          }}
        >
          {sym.icon}
        </span>
      )}

      {/* Kazanç shimmer */}
      {isWin && (
        <motion.div
          className="absolute inset-0 rounded-xl pointer-events-none"
          animate={{ opacity: [0, 0.28, 0] }}
          transition={{ repeat: Infinity, duration: 0.9, ease: "easeInOut" }}
          style={{ background: `radial-gradient(circle, ${sym.color}55 0%, transparent 70%)` }}
        />
      )}

      {/* Çarpan badge */}
      {multiplier != null && (
        <div
          className="absolute bottom-1 right-1 text-[9px] font-black px-1 py-0.5 rounded leading-none"
          style={{ background: sym.color, color: "#000" }}
        >
          x{multiplier}
        </div>
      )}
    </div>
  );
}

// ─── Ana bileşen ──────────────────────────────────────────────────────────────
const GatesGrid = forwardRef<GatesGridRef>(function GatesGrid(_props, ref) {
  const [cells,    setCells   ] = useState<Cell[]>(buildGrid);
  const [spinCols, setSpinCols] = useState<boolean[]>(Array(COLS).fill(false));
  const [spinDisp, setSpinDisp] = useState<number[][]>(
    Array.from({ length: COLS }, () =>
      Array.from({ length: ROWS }, () => rnd(SLOT_SYMBOLS.length))
    )
  );
  const [winIds, setWinIds] = useState<Set<string>>(new Set());

  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const busy    = useRef(false);

  // Hızlı spin ticker — sadece dönen kolonlar aktifken çalışır
  useEffect(() => {
    if (spinCols.some(Boolean)) {
      tickRef.current = setInterval(() => {
        setSpinDisp(
          Array.from({ length: COLS }, () =>
            Array.from({ length: ROWS }, () => rnd(SLOT_SYMBOLS.length))
          )
        );
      }, 80);
    } else {
      if (tickRef.current) { clearInterval(tickRef.current); tickRef.current = null; }
    }
    return () => { if (tickRef.current) clearInterval(tickRef.current); };
  }, [spinCols]);

  const spin = useCallback(async (result: SlotGrid, wins: WinMask): Promise<void> => {
    if (busy.current) return;
    busy.current = true;

    try {
      // Faz 1: Tüm kolonlar döner
      setWinIds(new Set());
      setSpinCols(Array(COLS).fill(true));
      await sleep(700);

      // Faz 2: Kolonlar soldan sağa iner
      for (let col = 0; col < COLS; col++) {
        await sleep(140);
        setSpinCols(prev => { const n = [...prev]; n[col] = false; return n; });
        setCells(prev => [
          ...prev.filter(c => c.col !== col),
          ...result[col].map<Cell>((sym, row) => ({
            id: uid(), symbol: sym, col, row, entrance: true,
          })),
        ]);
      }
      await sleep(250);

      // Faz 3: Kazanç vurgusu
      const hasWins = wins.some(col => col.some(Boolean));
      if (!hasWins) return;

      const winSet = new Set<string>();
      setCells(prev => {
        for (const c of prev)
          if (wins[c.col]?.[c.row]) winSet.add(c.id);
        setWinIds(winSet);
        return prev;
      });
      await sleep(1300);
      setWinIds(new Set());

      // Faz 4: Cascade
      setCells(prev => {
        const next: Cell[] = [];
        for (let col = 0; col < COLS; col++) {
          // Kazanmayanları al, aşağıdan yukarıya sırala, row'larını yenile
          const kept = prev
            .filter(c => c.col === col && !winSet.has(c.id))
            .sort((a, b) => a.row - b.row)
            .map((c, i) => ({ ...c, row: i, entrance: false }));

          // Üstü yeni sembollerle doldur
          const fill: Cell[] = Array.from({ length: ROWS - kept.length }, (_, i) => ({
            id: uid(),
            symbol: rnd(SLOT_SYMBOLS.length),
            col,
            row: kept.length + i,
            entrance: true,
          }));

          next.push(...kept, ...fill);
        }
        return next;
      });
      await sleep(700);

    } finally {
      setSpinCols(Array(COLS).fill(false));
      busy.current = false;
    }
  }, []);

  useImperativeHandle(ref, () => ({ spin }), [spin]);

  const gridW = COLS * (CELL + GAP) - GAP;
  const gridH = ROWS * (CELL + GAP) - GAP;

  return (
    <div
      className="relative rounded-2xl"
      style={{ width: gridW, height: gridH }}
    >
      {/* Arkaplan */}
      <div className="absolute inset-0 rounded-2xl bg-[#060514]" />

      {/* Kolon ayırıcılar */}
      {Array.from({ length: COLS - 1 }, (_, i) => (
        <div
          key={i}
          className="absolute top-2 bottom-2 w-px"
          style={{
            left:       (i + 1) * (CELL + GAP) - GAP / 2,
            background: "rgba(255,255,255,0.03)",
          }}
        />
      ))}

      {/* Hücreler */}
      <AnimatePresence>
        {cells.map(cell => {
          const spinning = spinCols[cell.col];
          const symbol   = spinning ? (spinDisp[cell.col]?.[cell.row] ?? 0) : cell.symbol;
          const isWin    = winIds.has(cell.id);
          const x        = cell.col * (CELL + GAP);
          const y        = (ROWS - 1 - cell.row) * (CELL + GAP);  // row 0 = alt = büyük y

          return (
            <motion.div
              key={cell.id}
              initial={cell.entrance ? { x, y: y - CELL * 3.5, opacity: 0 } : false}
              animate={{
                x,
                y,
                opacity: 1,
                scale: isWin ? [1, 1.07, 1, 1.07, 1] : 1,
              }}
              exit={{ scale: 1.25, opacity: 0, transition: { duration: 0.22 } }}
              transition={{
                type:      "spring",
                stiffness: 270,
                damping:   26,
                scale: {
                  repeat:   isWin ? Infinity : 0,
                  duration: 0.55,
                },
              }}
              style={{ position: "absolute", width: CELL, height: CELL }}
            >
              <CellView
                symbol={symbol}
                isWin={isWin}
                spinning={spinning}
                size={CELL}
                multiplier={cell.multiplier}
              />
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
});

export default GatesGrid;
export { COLS, ROWS };
