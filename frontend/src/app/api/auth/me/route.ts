import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { getUserFromRequest } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const userId = getUserFromRequest(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = db.prepare("SELECT id, email, created_at FROM users WHERE id=?").get(userId) as any;
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const balances = db.prepare("SELECT currency, amount FROM balances WHERE user_id=?").all(userId);
  return NextResponse.json({ user, balances });
}
