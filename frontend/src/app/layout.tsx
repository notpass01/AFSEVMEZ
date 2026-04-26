import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";
import Header from "@/components/Header";
import { Toaster } from "react-hot-toast";

export const metadata: Metadata = {
  title: "WinWin Casino",
  description: "Crypto casino — Roulette, Dice, Coin Flip",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <Header />
          <main className="min-h-screen pt-20">{children}</main>
          <Toaster
            position="top-right"
            toastOptions={{
              style: { background: "#1A1A2E", color: "#fff", border: "1px solid #2A2A4A" },
            }}
          />
        </Providers>
      </body>
    </html>
  );
}
