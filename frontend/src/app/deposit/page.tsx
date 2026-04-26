"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { QRCodeSVG } from "qrcode.react";
import toast from "react-hot-toast";
import { useAuth } from "@/hooks/useAuth";
import { usePrices } from "@/hooks/usePrices";
import { DEPOSIT_ADDRESSES, NETWORK_LABELS } from "@/lib/depositAddresses";

const COINS = Object.keys(DEPOSIT_ADDRESSES);
const COIN_ICONS: Record<string, string> = { BNB: "🟡", USDT: "💵", ETH: "🔷", BTC: "🟠" };

interface DepositRequest {
  id: number;
  coin: string;
  network: string;
  address: string;
  uniqueAmount: number;
  expiresAt: string;
}

export default function DepositPage() {
  const { user, loading, getBalance } = useAuth();
  const { currency, prices } = usePrices();
  const router = useRouter();

  const [coin, setCoin] = useState("USDT");
  const [network, setNetwork] = useState("BSC");
  const [fiatAmount, setFiatAmount] = useState("500");
  const [creating, setCreating] = useState(false);
  const [request, setRequest] = useState<DepositRequest | null>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [timeLeft, setTimeLeft] = useState("");

  useEffect(() => {
    if (!loading && !user) router.push("/login");
  }, [user, loading, router]);

  // Reset network when coin changes
  useEffect(() => {
    const networks = Object.keys(DEPOSIT_ADDRESSES[coin] ?? {});
    if (!networks.includes(network)) setNetwork(networks[0] ?? "");
  }, [coin]);

  // Countdown timer
  useEffect(() => {
    if (!request) return;
    const interval = setInterval(() => {
      const diff = new Date(request.expiresAt).getTime() - Date.now();
      if (diff <= 0) { setTimeLeft("Expired"); clearInterval(interval); return; }
      const m = Math.floor(diff / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setTimeLeft(`${m}:${s.toString().padStart(2, "0")}`);
    }, 1000);
    return () => clearInterval(interval);
  }, [request]);

  // Load deposit history
  useEffect(() => {
    if (!user) return;
    const token = localStorage.getItem("ww_token");
    fetch("/api/deposit/list", { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json()).then(d => setHistory(d.deposits ?? []));
  }, [user, request]);

  // Fiat → Crypto conversion
  const price = prices[coin] ?? 0;
  const fiatNum = parseFloat(fiatAmount) || 0;
  const cryptoAmount = price > 0 ? fiatNum / price : 0;

  // Quick fiat amounts based on currency
  const quickAmounts =
    currency.code === "TRY" ? ["100", "250", "500", "1000", "2500"] :
    currency.code === "JPY" || currency.code === "KRW" ? ["1000", "5000", "10000", "50000"] :
    ["10", "25", "50", "100", "250"];

  const createDeposit = async () => {
    if (cryptoAmount <= 0) { toast.error("Enter a valid amount"); return; }
    setCreating(true);
    try {
      const token = localStorage.getItem("ww_token");
      const res = await fetch("/api/deposit/create", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ coin, network, baseAmount: cryptoAmount }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error); return; }
      setRequest(data);
    } finally {
      setCreating(false);
    }
  };

  const copy = (text: string) => { navigator.clipboard.writeText(text); toast.success("Copied!"); };

  const networks = Object.keys(DEPOSIT_ADDRESSES[coin] ?? {});

  if (loading || !user) return null;

  return (
    <div className="flex flex-col items-center px-4 py-10 gap-8 max-w-2xl mx-auto">
      <h1 className="font-display text-4xl font-bold text-gold-gradient">Deposit</h1>

      {/* Balances */}
      <div className="card p-5 w-full">
        <p className="text-xs text-gray-400 uppercase tracking-wider mb-3">Your Balances</p>
        <div className="grid grid-cols-4 gap-3">
          {COINS.map(c => (
            <div key={c} className="text-center">
              <p className="text-xl">{COIN_ICONS[c]}</p>
              <p className="text-yellow-400 font-bold text-sm">{getBalance(c).toFixed(4)}</p>
              <p className="text-xs text-gray-400">{c}</p>
            </div>
          ))}
        </div>
      </div>

      {!request ? (
        <div className="card p-6 w-full flex flex-col gap-6">
          <p className="font-bold text-lg">Create Deposit Request</p>

          {/* Coin selector */}
          <div>
            <p className="text-xs text-gray-400 mb-2 uppercase tracking-wider">Coin</p>
            <div className="grid grid-cols-4 gap-2">
              {COINS.map(c => (
                <button key={c} onClick={() => setCoin(c)}
                  className={`py-3 rounded-xl border-2 flex flex-col items-center gap-1 text-sm font-medium transition-all
                               ${coin === c
                                ? "border-yellow-500 bg-yellow-500/10 text-yellow-400"
                                : "border-[#2A2A4A] text-gray-400 hover:border-gray-500"}`}>
                  <span className="text-2xl">{COIN_ICONS[c]}</span>{c}
                </button>
              ))}
            </div>
          </div>

          {/* Network selector */}
          <div>
            <p className="text-xs text-gray-400 mb-2 uppercase tracking-wider">Network</p>
            <div className="flex flex-wrap gap-2">
              {networks.map(n => (
                <button key={n} onClick={() => setNetwork(n)}
                  className={`px-4 py-2 rounded-lg border text-sm transition-all
                               ${network === n
                                ? "border-yellow-500 text-yellow-400 bg-yellow-500/10"
                                : "border-[#2A2A4A] text-gray-400 hover:border-gray-500"}`}>
                  {NETWORK_LABELS[n] ?? n}
                </button>
              ))}
            </div>
          </div>

          {/* Fiat amount input */}
          <div>
            <p className="text-xs text-gray-400 mb-2 uppercase tracking-wider">
              Amount ({currency.code})
            </p>
            <div className={`flex items-center gap-2 bg-black/30 border border-[#2A2A4A]
                             rounded-xl px-4 py-3 focus-within:border-yellow-500/60 transition-colors`}>
              <span className="text-yellow-400 font-bold text-lg">{currency.symbol}</span>
              <input
                type="number"
                value={fiatAmount}
                onChange={e => setFiatAmount(e.target.value)}
                min="0"
                step="1"
                className="flex-1 bg-transparent text-white text-xl outline-none"
                placeholder="0"
              />
              <span className="text-gray-400 font-medium">{currency.code}</span>
            </div>

            {/* Quick amounts */}
            <div className="flex gap-2 mt-2 flex-wrap">
              {quickAmounts.map(v => (
                <button key={v} onClick={() => setFiatAmount(v)}
                  className="px-3 py-1 text-xs rounded-full border border-[#2A2A4A]
                             text-gray-400 hover:border-yellow-500 hover:text-yellow-400 transition-colors">
                  {currency.symbol}{v}
                </button>
              ))}
            </div>
          </div>

          {/* Crypto equivalent — the key info box */}
          {cryptoAmount > 0 && (
            <div className="rounded-xl border border-yellow-500/40 bg-yellow-500/5 p-4 flex flex-col gap-2">
              <p className="text-xs text-gray-400 uppercase tracking-wider">You will send exactly</p>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-black text-yellow-400">
                    ≈ {cryptoAmount.toFixed(coin === "BTC" ? 8 : 4)} {coin}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    (exact amount shown after generating address)
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-300">
                    {currency.symbol}{fiatNum.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                  <p className="text-xs text-gray-500">via {NETWORK_LABELS[network] ?? network}</p>
                </div>
              </div>
              {price > 0 && (
                <p className="text-xs text-gray-500 border-t border-white/5 pt-2">
                  1 {coin} = {currency.symbol}{price.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {currency.code}
                </p>
              )}
            </div>
          )}

          <button
            onClick={createDeposit}
            disabled={creating || cryptoAmount <= 0}
            className="btn-gold w-full py-4 text-base disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {creating ? "Generating..." : `Generate Deposit Address`}
          </button>
        </div>

      ) : (
        /* Address display after generation */
        <div className="card p-6 w-full flex flex-col items-center gap-5">
          <div className="flex items-center justify-between w-full">
            <p className="font-bold text-lg">Send exactly this amount</p>
            <span className="text-sm text-gray-400">
              Expires in <span className="text-yellow-400 font-bold">{timeLeft}</span>
            </span>
          </div>

          {/* THE exact amount to send */}
          <div className="w-full bg-yellow-500/10 border-2 border-yellow-500 rounded-xl p-5 text-center">
            <p className="text-xs text-gray-400 mb-2 uppercase tracking-wider">Send Exactly</p>
            <p className="text-4xl font-black text-yellow-400 tracking-tight">
              {request.uniqueAmount} {request.coin}
            </p>
            <p className="text-sm text-gray-300 mt-2">
              ≈ {currency.symbol}
              {price > 0
                ? (request.uniqueAmount * price).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                : "—"} {currency.code}
            </p>
            <p className="text-xs text-gray-500 mt-1">via {NETWORK_LABELS[request.network] ?? request.network}</p>
            <p className="text-red-400 text-xs mt-3 font-medium">
              ⚠️ Send the exact amount — it identifies your deposit automatically
            </p>
          </div>

          {/* Copy amount button */}
          <button
            onClick={() => copy(request.uniqueAmount.toString())}
            className="btn-gold w-full py-3 text-sm"
          >
            Copy Amount: {request.uniqueAmount} {request.coin}
          </button>

          {/* QR code */}
          <div className="bg-white p-4 rounded-xl">
            <QRCodeSVG value={request.address} size={160} />
          </div>

          {/* Address */}
          <div className="w-full">
            <p className="text-xs text-gray-400 mb-2 uppercase tracking-wider">To Address</p>
            <div className="flex gap-2 items-center bg-black/30 border border-[#2A2A4A] rounded-xl px-4 py-3">
              <p className="flex-1 text-sm text-white break-all font-mono">{request.address}</p>
              <button onClick={() => copy(request.address)}
                className="text-yellow-400 hover:text-yellow-300 text-sm whitespace-nowrap">
                Copy
              </button>
            </div>
          </div>

          <button onClick={() => setRequest(null)}
            className="text-gray-400 hover:text-white text-sm transition-colors">
            ← Create new request
          </button>
        </div>
      )}

      {/* Real deposit history (no game records) */}
      {history.length > 0 && (
        <div className="w-full">
          <p className="text-xs text-gray-400 uppercase tracking-wider mb-3">Recent Deposits</p>
          <div className="flex flex-col gap-2">
            {history.map((d: any) => {
              const depPrice = prices[d.coin] ?? 0;
              const fiatVal = depPrice > 0
                ? (d.unique_amount * depPrice).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                : null;
              return (
                <div key={d.id} className="card p-4 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{COIN_ICONS[d.coin] ?? "💰"}</span>
                    <div>
                      <p className="font-medium text-white">
                        {d.unique_amount} {d.coin}
                        {fiatVal && (
                          <span className="text-gray-400 text-sm ml-2">
                            ≈ {currency.symbol}{fiatVal}
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-gray-500">
                        {NETWORK_LABELS[d.network] ?? d.network} · {new Date(d.created_at).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                  </div>
                  <span className={`text-xs px-3 py-1 rounded-full font-medium whitespace-nowrap
                    ${d.status === "confirmed"
                      ? "bg-green-500/20 text-green-400"
                      : d.status === "expired"
                      ? "bg-red-500/20 text-red-400"
                      : "bg-yellow-500/20 text-yellow-400"}`}>
                    {d.status}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
