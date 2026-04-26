import axios from "axios";

const COINGECKO_IDS: Record<string, string> = {
  BNB:  "binancecoin",
  USDT: "tether",
  ETH:  "ethereum",
  BTC:  "bitcoin",
};

const MIN_USD = 1; // $1 minimum

// Cache 5 minutes
let cache: { prices: Record<string, number>; ts: number } | null = null;

async function getPricesUSD(): Promise<Record<string, number>> {
  if (cache && Date.now() - cache.ts < 5 * 60 * 1000) return cache.prices;
  try {
    const ids = Object.values(COINGECKO_IDS).join(",");
    const { data } = await axios.get("https://api.coingecko.com/api/v3/simple/price", {
      params: { ids, vs_currencies: "usd" },
      timeout: 5000,
    });
    const prices: Record<string, number> = {};
    for (const [sym, id] of Object.entries(COINGECKO_IDS)) {
      prices[sym] = data[id]?.usd ?? 0;
    }
    cache = { prices, ts: Date.now() };
    return prices;
  } catch {
    // fallback sabit fiyatlar
    return { BNB: 600, USDT: 1, ETH: 3200, BTC: 95000 };
  }
}

export async function getMinDeposit(coin: string): Promise<number> {
  if (coin === "USDT") return MIN_USD;
  const prices = await getPricesUSD();
  const price = prices[coin];
  if (!price) return 0.001;
  const min = MIN_USD / price;
  // 4 anlamlı basamağa yuvarla
  const factor = Math.pow(10, 4);
  return Math.ceil(min * factor) / factor;
}
