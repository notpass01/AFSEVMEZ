import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { hashPassword, generateVerifyToken } from "@/lib/auth";
import { sendVerificationEmail } from "@/lib/email";

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) return NextResponse.json({ error: "Email and password required" }, { status: 400 });
    if (password.length < 8) return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return NextResponse.json({ error: "Invalid email" }, { status: 400 });

    const existing = db.prepare("SELECT id FROM users WHERE email=?").get(email.toLowerCase());
    if (existing) return NextResponse.json({ error: "Email already registered" }, { status: 409 });

    const hash = hashPassword(password);
    const token = generateVerifyToken();

    const smtpReady = !!(process.env.SMTP_USER && process.env.SMTP_PASS);

    if (smtpReady) {
      db.prepare("INSERT INTO users (email, password, verify_token) VALUES (?,?,?)").run(email.toLowerCase(), hash, token);
      await sendVerificationEmail(email, token);
      return NextResponse.json({ message: "Verification email sent. Please check your inbox.", needsVerify: true });
    } else {
      // Dev mode: auto-verify
      db.prepare("INSERT INTO users (email, password, verified, verify_token) VALUES (?,?,1,NULL)").run(email.toLowerCase(), hash);
      return NextResponse.json({ message: "Account created successfully. You can now sign in.", needsVerify: false });
    }
  } catch (e: any) {
    console.error(e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
