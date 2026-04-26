import axios from "axios";

// CoinGecko free API — no key required
const COINGECKO = "https://api.coingecko.com/api/v3";

const TOKEN_IDS: Record<string, string> = {
  BNB:  "binancecoin",
  USDT: "tether",
  ETH:  "ethereum",
  BTC:  "bitcoin",
};

export const CURRENCIES = [
  { code: "USD", symbol: "$",  flag: "🇺🇸" },
  { code: "EUR", symbol: "€",  flag: "🇪🇺" },
  { code: "TRY", symbol: "₺",  flag: "🇹🇷" },
  { code: "GBP", symbol: "£",  flag: "🇬🇧" },
  { code: "JPY", symbol: "¥",  flag: "🇯🇵" },
  { code: "CAD", symbol: "C$", flag: "🇨🇦" },
  { code: "AUD", symbol: "A$", flag: "🇦🇺" },
  { code: "CHF", symbol: "Fr", flag: "🇨🇭" },
  { code: "CNY", symbol: "¥",  flag: "🇨🇳" },
  { code: "INR", symbol: "₹",  flag: "🇮🇳" },
  { code: "BRL", symbol: "R$", flag: "🇧🇷" },
  { code: "RUB", symbol: "₽",  flag: "🇷🇺" },
  { code: "KRW", symbol: "₩",  flag: "🇰🇷" },
  { code: "MXN", symbol: "$",  flag: "🇲🇽" },
  { code: "IDR", symbol: "Rp", flag: "🇮🇩" },
  { code: "SGD", symbol: "S$", flag: "🇸🇬" },
  { code: "SAR", symbol: "﷼",  flag: "🇸🇦" },
  { code: "AED", symbol: "د.إ",flag: "🇦🇪" },
  { code: "PLN", symbol: "zł", flag: "🇵🇱" },
  { code: "NGN", symbol: "₦",  flag: "🇳🇬" },
];

// Cache for 60 seconds — keyed by currency so switching currency always fetches fresh data
const cacheMap: Map<string, { data: Record<string, number>; ts: number }> = new Map();

export async function fetchPricesInCurrency(currency: string): Promise<Record<string, number>> {
  const now = Date.now();
  const key = currency.toLowerCase();
  const cached = cacheMap.get(key);
  if (cached && now - cached.ts < 60_000) return cached.data;

  const ids = Object.values(TOKEN_IDS).join(",");
  const res = await axios.get(`${COINGECKO}/simple/price`, {
    params: { ids, vs_currencies: currency.toLowerCase() },
  });

  const data: Record<string, number> = {};
  for (const [sym, id] of Object.entries(TOKEN_IDS)) {
    data[sym] = res.data[id]?.[currency.toLowerCase()] ?? 0;
  }

  cacheMap.set(key, { data, ts: now });
  return data;
}

// Convert token amount to fiat display string
export function formatFiat(
  amount: number,
  tokenSymbol: string,
  prices: Record<string, number>,
  currency: { code: string; symbol: string }
): string {
  const price = prices[tokenSymbol] ?? 0;
  const fiat = amount * price;
  const formatted = new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(fiat);
  return `${currency.symbol}${formatted} ${currency.code}`;
}
