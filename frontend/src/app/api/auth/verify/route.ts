import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");
  if (!token) return NextResponse.redirect(new URL("/login?error=invalid_token", req.url));

  const user = db.prepare("SELECT id FROM users WHERE verify_token=? AND verified=0").get(token) as any;
  if (!user) return NextResponse.redirect(new URL("/login?error=invalid_token", req.url));

  db.prepare("UPDATE users SET verified=1, verify_token=NULL WHERE id=?").run(user.id);
  return NextResponse.redirect(new URL("/login?verified=1", req.url));
}
