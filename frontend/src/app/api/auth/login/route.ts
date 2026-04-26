import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { verifyPassword, signToken } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();
    if (!email || !password) return NextResponse.json({ error: "Email and password required" }, { status: 400 });

    const user = db.prepare("SELECT * FROM users WHERE email=?").get(email.toLowerCase()) as any;
    if (!user) return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    if (!user.verified) return NextResponse.json({ error: "Please verify your email first" }, { status: 403 });
    if (!verifyPassword(password, user.password)) return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });

    const token = signToken(user.id);
    return NextResponse.json({ token, user: { id: user.id, email: user.email } });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
