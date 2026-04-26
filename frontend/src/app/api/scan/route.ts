import { NextRequest, NextResponse } from "next/server";
import { runScanner } from "@/lib/scanner";

// Simple secret to prevent unauthorized triggers
const SCAN_SECRET = process.env.SCAN_SECRET || "winwin-scan-secret";

export async function GET(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get("secret");
  if (secret !== SCAN_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  await runScanner();
  return NextResponse.json({ ok: true, time: new Date().toISOString() });
}
