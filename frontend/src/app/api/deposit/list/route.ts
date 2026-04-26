import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { getUserFromRequest } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const userId = getUserFromRequest(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const deposits = db.prepare(`
    SELECT id, coin, network, to_address, unique_amount, status, tx_hash, confirmed_at, created_at, expires_at
    FROM deposits
    WHERE user_id=? AND status IN ('pending', 'confirmed', 'expired')
    ORDER BY created_at DESC LIMIT 20
  `).all(userId);

  return NextResponse.json({ deposits });
}
