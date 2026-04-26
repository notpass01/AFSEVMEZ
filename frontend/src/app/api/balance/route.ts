import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { getUserFromRequest } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const userId = getUserFromRequest(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const balances = db.prepare("SELECT currency, amount FROM balances WHERE user_id=?").all(userId);
  return NextResponse.json({ balances });
}
