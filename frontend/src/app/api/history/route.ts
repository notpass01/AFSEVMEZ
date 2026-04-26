import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { getUserFromRequest } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const userId = getUserFromRequest(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rows = db.prepare(`
    SELECT id, game, coin, bet, payout, result, win, multiplier, created_at
    FROM game_history
    WHERE user_id = ?
    ORDER BY created_at DESC
    LIMIT 100
  `).all(userId);

  return NextResponse.json({ history: rows });
}
