import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { getUserFromRequest } from "@/lib/auth";
import { DEPOSIT_ADDRESSES, COIN_DECIMALS } from "@/lib/depositAddresses";
import { getMinDeposit } from "@/lib/minDeposit";

export async function POST(req: NextRequest) {
  const userId = getUserFromRequest(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { coin, network, baseAmount } = await req.json();

  const address = DEPOSIT_ADDRESSES[coin]?.[network];
  if (!address) return NextResponse.json({ error: "Unsupported coin/network" }, { status: 400 });

  const min = await getMinDeposit(coin);
  if (!baseAmount || baseAmount < min) return NextResponse.json({ error: `Minimum deposit: ${min} ${coin} (~$5)` }, { status: 400 });

  // Generate unique suffix: 4 random digits after the main decimals (e.g. 10 → 10.0068)
  const decimals = COIN_DECIMALS[coin] ?? 4;
  const suffix = Math.floor(Math.random() * 90 + 10) / Math.pow(10, decimals + 2);
  const uniqueAmount = parseFloat((baseAmount + suffix).toFixed(decimals + 2));

  // Expire in 2 hours
  const expiresAt = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString();

  const result = db.prepare(`
    INSERT INTO deposits (user_id, coin, network, to_address, unique_amount, expires_at)
    VALUES (?,?,?,?,?,?)
  `).run(userId, coin, network, address, uniqueAmount, expiresAt);

  return NextResponse.json({
    id: result.lastInsertRowid,
    coin,
    network,
    address,
    uniqueAmount,
    expiresAt,
  });
}
