import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import db from "@/lib/db";
import { getUserFromRequest } from "@/lib/auth";

const HOUSE_EDGE = 0.02; // 2%

function secureRandom(max: number): number {
  return crypto.randomInt(0, max);
}

/* ── Gates of Olympus: 6×5 Cluster Pays ─────────────────── */
const COLS = 6, ROWS = 5;

// Pay table: symbol index → cluster size → multiplier
const GOO_PAY: Record<number, [number, number][]> = {
  7: [[8,2],[9,3],[10,4],[12,6],[15,15],[20,25],[25,50],[30,100]], // Zeus
  6: [[8,1],[9,1.5],[10,2],[12,4],[15,8],[20,15],[25,30],[30,50]], // Crown
  5: [[8,0.5],[9,0.7],[10,1],[12,2],[15,4],[20,8],[25,15],[30,25]], // Goblet
  4: [[8,0.3],[9,0.4],[10,0.5],[12,1],[15,2],[20,4],[25,8],[30,15]], // Diamond
  3: [[8,0.2],[9,0.25],[10,0.3],[12,0.6],[15,1.2],[20,2.5],[25,5],[30,10]], // Orb Blue
  2: [[8,0.15],[9,0.2],[10,0.25],[12,0.5],[15,1],[20,2],[25,4],[30,8]],  // Orb Red
  1: [[8,0.1],[9,0.12],[10,0.15],[12,0.3],[15,0.7],[20,1.5],[25,3],[30,6]], // Orb Purple
  0: [[8,0.08],[9,0.1],[10,0.12],[12,0.25],[15,0.5],[20,1],[25,2],[30,4]], // Orb Green
};

function gooClusterMult(sym: number, size: number): number {
  const table = GOO_PAY[sym] ?? [];
  let mult = 0;
  for (const [minSize, m] of table) {
    if (size >= minSize) mult = m;
  }
  return mult;
}

function findClusters(grid: number[]) {
  const visited = new Set<number>();
  const clusters: { sym: number; cells: number[]; mult: number }[] = [];

  for (let i = 0; i < grid.length; i++) {
    if (visited.has(i)) continue;
    const sym = grid[i];
    const queue = [i];
    const cluster: number[] = [];

    while (queue.length > 0) {
      const pos = queue.shift()!;
      if (visited.has(pos)) continue;
      if (grid[pos] !== sym) continue;
      visited.add(pos);
      cluster.push(pos);
      const col = pos % COLS, row = Math.floor(pos / COLS);
      if (col > 0)         queue.push(pos - 1);
      if (col < COLS - 1)  queue.push(pos + 1);
      if (row > 0)         queue.push(pos - COLS);
      if (row < ROWS - 1)  queue.push(pos + COLS);
    }

    if (cluster.length >= 8) {
      clusters.push({ sym, cells: cluster, mult: gooClusterMult(sym, cluster.length) });
    }
  }
  return clusters;
}

function generateGooGrid(): number[] {
  return Array.from({ length: ROWS * COLS }, () => secureRandom(8));
}

export async function POST(req: NextRequest) {
  const userId = getUserFromRequest(req);
  if (!userId) return NextResponse.json({ error: "Please sign in to play" }, { status: 401 });

  const { game, coin, amount, param1, param2 } = await req.json();

  if (!["roulette","dice","coinflip","slots_fruit","slots_diamond","slots_lucky7","slots_olympus"].includes(game))
    return NextResponse.json({ error: "Invalid game" }, { status: 400 });

  if (!amount || amount <= 0)
    return NextResponse.json({ error: "Invalid amount" }, { status: 400 });

  // Check balance
  const bal = db.prepare("SELECT amount FROM balances WHERE user_id=? AND currency=?").get(userId, coin) as any;
  if (!bal || bal.amount < amount)
    return NextResponse.json({ error: `Insufficient ${coin} balance` }, { status: 400 });

  // Deduct bet
  db.prepare("UPDATE balances SET amount=amount-? WHERE user_id=? AND currency=?").run(amount, userId, coin);

  let result: number = 0;
  let win = false;
  let multiplier = 0;
  let extraData: Record<string, unknown> = {};

  if (game === "roulette") {
    result = secureRandom(37);
    const start = parseInt(param1), end = parseInt(param2);
    win = result >= start && result <= end;
    if (win) multiplier = Math.floor(36 / (end - start + 1));

  } else if (game === "dice") {
    result = secureRandom(6) + 1;
    win = result === parseInt(param1);
    if (win) multiplier = 6;

  } else if (game === "coinflip") {
    result = secureRandom(2);
    win = result === parseInt(param1);
    if (win) multiplier = 2;

  } else if (game === "slots_fruit") {
    const r0 = secureRandom(7), r1 = secureRandom(7), r2 = secureRandom(7);
    result = r0 * 100 + r1 * 10 + r2;
    const diamonds = [r0,r1,r2].filter(r => r===6).length;
    if (r0===r1 && r1===r2) {
      win = true;
      if (r0===6) multiplier=15; else if (r0===5) multiplier=10;
      else if (r0===4) multiplier=7; else multiplier=3;
    } else if (diamonds===2) { win=true; multiplier=2; }

  } else if (game === "slots_diamond") {
    const r0 = secureRandom(4), r1 = secureRandom(4), r2 = secureRandom(4);
    result = r0 * 100 + r1 * 10 + r2;
    if (r0===r1 && r1===r2) {
      win=true;
      if (r0===3) multiplier=20; else if (r0===2) multiplier=8;
      else if (r0===1) multiplier=4; else multiplier=2;
    }

  } else if (game === "slots_lucky7") {
    const r0 = secureRandom(5), r1 = secureRandom(5), r2 = secureRandom(5);
    result = r0 * 100 + r1 * 10 + r2;
    if (r0===r1 && r1===r2) {
      win=true;
      if (r0===4) multiplier=8; else if (r0===3) multiplier=5;
      else if (r0===2) multiplier=3; else multiplier=2;
    }

  } else {
    // slots_olympus — 6×5 cluster pays
    const grid = generateGooGrid();
    const clusters = findClusters(grid);
    const totalMult = clusters.reduce((sum, c) => sum + c.mult, 0);

    win = totalMult > 0;
    multiplier = parseFloat(totalMult.toFixed(2));
    result = Math.round(totalMult * 100); // store as int (mult×100)
    extraData = { grid, clusters };
  }

  let payout = 0;
  if (win) {
    payout = parseFloat((amount * multiplier * (1 - HOUSE_EDGE)).toFixed(6));
    db.prepare("UPDATE balances SET amount=amount+? WHERE user_id=? AND currency=?").run(payout, userId, coin);
  }

  db.prepare(`
    INSERT INTO game_history (user_id, game, coin, bet, payout, result, win, multiplier)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(userId, game, coin, amount, payout, result, win ? 1 : 0, multiplier);

  const newBal = db.prepare("SELECT amount FROM balances WHERE user_id=? AND currency=?").get(userId, coin) as any;

  return NextResponse.json({ result, win, payout, amount, multiplier, balance: newBal?.amount ?? 0, ...extraData });
}
