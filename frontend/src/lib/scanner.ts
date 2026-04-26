import axios from "axios";
import db from "./db";
import { sendDepositConfirmedEmail } from "./email";

// Etherscan V2 — tek key tüm zincirlerde çalışır
const EVM_CHAIN_IDS: Record<string, number> = {
  BSC:   56,
  ETH:   1,
  POL:   137,
  AVAXC: 43114,
};

const EVM_V2_URL = "https://api.etherscan.io/v2/api";

// USDT contract addresses per network
const USDT_CONTRACTS: Record<string, string> = {
  BSC:   "0x55d398326f99059fF775485246999027B3197955",
  ETH:   "0xdAC17F958D2ee523a2206206994597C13D831ec7",
  POL:   "0xc2132D05D31c914a87C6611C10748AEb04B58e8F",
  AVAXC: "0x9702230A8Ea53601f5cD2dc00fDBc13d4dF4A8c7",
};

const WBTC_CONTRACTS: Record<string, string> = {
  ETH: "0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599",
  BSC: "0x7130d2A12B9BCbFAe4f2634d864A1Ee1Ce3Ead9c",
};

const WETH_BSC = "0x2170Ed0880ac9A755fd29B2688956BD959F933F8";

// tolerance for unique amount matching (±0.001%)
const TOLERANCE = 0.00001;

function amountMatches(received: number, expected: number): boolean {
  return Math.abs(received - expected) <= Math.max(expected * TOLERANCE, 0.00001);
}

async function scanEVMNative(network: string, address: string, pendingDeposits: any[]) {
  const chainId = EVM_CHAIN_IDS[network];
  if (!chainId) return;
  const key = process.env.ETHERSCAN_API_KEY || "YourApiKeyToken";
  try {
    const { data } = await axios.get(EVM_V2_URL, {
      params: { chainid: chainId, module: "account", action: "txlist", address, sort: "desc", page: 1, offset: 50, apikey: key },
    });
    if (data.status !== "1") return;
    for (const tx of data.result) {
      if (tx.isError !== "0") continue;
      const received = parseInt(tx.value) / 1e18;
      for (const dep of pendingDeposits) {
        if (dep.network !== network || dep.coin !== "BNB") continue;
        if (tx.to?.toLowerCase() !== dep.to_address.toLowerCase()) continue;
        if (amountMatches(received, dep.unique_amount)) {
          confirmDeposit(dep, tx.hash, tx.from, received);
        }
      }
    }
  } catch {}
}

async function scanEVMToken(network: string, address: string, coin: string, contractAddress: string, pendingDeposits: any[]) {
  const chainId = EVM_CHAIN_IDS[network];
  if (!chainId) return;
  const key = process.env.ETHERSCAN_API_KEY || "YourApiKeyToken";
  try {
    const { data } = await axios.get(EVM_V2_URL, {
      params: { chainid: chainId, module: "account", action: "tokentx", contractaddress: contractAddress, address, sort: "desc", page: 1, offset: 50, apikey: key },
    });
    if (data.status !== "1") return;
    for (const tx of data.result) {
      const decimals = parseInt(tx.tokenDecimal) || 18;
      const received = parseInt(tx.value) / Math.pow(10, decimals);
      for (const dep of pendingDeposits) {
        if (dep.network !== network || dep.coin !== coin) continue;
        if (tx.to?.toLowerCase() !== dep.to_address.toLowerCase()) continue;
        if (amountMatches(received, dep.unique_amount)) {
          confirmDeposit(dep, tx.hash, tx.from, received);
        }
      }
    }
  } catch {}
}

async function scanTRON(address: string, pendingDeposits: any[]) {
  try {
    const { data } = await axios.get(`https://apilist.tronscan.org/api/transfer`, {
      params: { sort: "-timestamp", count: true, limit: 50, toAddress: address, tokenId: "TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t" },
    });
    for (const tx of data.data || []) {
      const received = tx.amount / 1e6;
      for (const dep of pendingDeposits) {
        if (dep.network !== "TRX" || dep.coin !== "USDT") continue;
        if (amountMatches(received, dep.unique_amount)) {
          confirmDeposit(dep, tx.transactionHash, tx.transferFromAddress, received);
        }
      }
    }
  } catch {}
}

async function scanSOL(address: string, pendingDeposits: any[]) {
  // USDT on Solana (via Solscan)
  const USDT_MINT = "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB";
  try {
    const { data } = await axios.get(`https://public-api.solscan.io/account/token/txs`, {
      params: { account: address, tokenAddress: USDT_MINT, limit: 50 },
      headers: { Accept: "application/json" },
    });
    for (const tx of data.data || []) {
      const received = tx.changeAmount / 1e6;
      if (received <= 0) continue;
      for (const dep of pendingDeposits) {
        if (dep.network !== "SOL" || dep.coin !== "USDT") continue;
        if (amountMatches(received, dep.unique_amount)) {
          confirmDeposit(dep, tx.txHash, tx.src, received);
        }
      }
    }
  } catch {}
}

async function scanBTC(address: string, pendingDeposits: any[]) {
  try {
    const { data } = await axios.get(`https://blockstream.info/api/address/${address}/txs`);
    for (const tx of data) {
      for (const vout of tx.vout || []) {
        if (vout.scriptpubkey_address !== address) continue;
        const received = vout.value / 1e8;
        for (const dep of pendingDeposits) {
          if (dep.network !== "BTC" || dep.coin !== "BTC") continue;
          if (amountMatches(received, dep.unique_amount)) {
            const confirmed = tx.status?.confirmed ?? false;
            if (confirmed) confirmDeposit(dep, tx.txid, null, received);
          }
        }
      }
    }
  } catch {}
}

function confirmDeposit(dep: any, txHash: string, fromAddress: string | null, amount: number) {
  const alreadyDone = db.prepare("SELECT id FROM deposits WHERE tx_hash = ?").get(txHash);
  if (alreadyDone) return;

  db.prepare(`
    UPDATE deposits SET status='confirmed', tx_hash=?, from_address=?, confirmed_at=datetime('now')
    WHERE id=?
  `).run(txHash, fromAddress, dep.id);

  const existing = db.prepare("SELECT amount FROM balances WHERE user_id=? AND currency=?").get(dep.user_id, dep.coin) as any;
  if (existing) {
    db.prepare("UPDATE balances SET amount=amount+? WHERE user_id=? AND currency=?").run(amount, dep.user_id, dep.coin);
  } else {
    db.prepare("INSERT INTO balances (user_id, currency, amount) VALUES (?,?,?)").run(dep.user_id, dep.coin, amount);
  }

  const user = db.prepare("SELECT email FROM users WHERE id=?").get(dep.user_id) as any;
  if (user?.email) {
    sendDepositConfirmedEmail(user.email, amount, dep.coin, dep.network).catch(() => {});
  }

  console.log(`[Scanner] ✅ Deposit confirmed: ${amount} ${dep.coin} (${dep.network}) — user ${dep.user_id} — tx ${txHash}`);
}

export async function runScanner() {
  const now = new Date().toISOString();
  const pending = db.prepare(`
    SELECT * FROM deposits WHERE status='pending' AND expires_at > ?
  `).all(now) as any[];

  if (pending.length === 0) return;
  console.log(`[Scanner] Checking ${pending.length} pending deposits...`);

  // Group by network for efficiency
  const byNetwork: Record<string, any[]> = {};
  for (const dep of pending) {
    (byNetwork[dep.network] ||= []).push(dep);
  }

  const promises: Promise<void>[] = [];
  const ownerAddr = "0xf8bf5ca0dd6d31729b91ca6d0b0d3f6928b7d35f";

  if (byNetwork.BSC) {
    // BNB native
    promises.push(scanEVMNative("BSC", ownerAddr, pending));
    // USDT BEP-20
    promises.push(scanEVMToken("BSC", ownerAddr, "USDT", USDT_CONTRACTS.BSC, pending));
    // ETH BEP-20
    promises.push(scanEVMToken("BSC", ownerAddr, "ETH", WETH_BSC, pending));
    // BTC BEP-20
    promises.push(scanEVMToken("BSC", ownerAddr, "BTC", WBTC_CONTRACTS.BSC, pending));
  }
  if (byNetwork.ETH) {
    promises.push(scanEVMToken("ETH", ownerAddr, "USDT", USDT_CONTRACTS.ETH, pending));
    promises.push(scanEVMToken("ETH", ownerAddr, "ETH", "", pending)); // native ETH
    promises.push(scanEVMToken("ETH", ownerAddr, "BTC", WBTC_CONTRACTS.ETH, pending));
  }
  if (byNetwork.POL)   promises.push(scanEVMToken("POL",   ownerAddr, "USDT", USDT_CONTRACTS.POL,   pending));
  if (byNetwork.AVAXC) promises.push(scanEVMToken("AVAXC", ownerAddr, "USDT", USDT_CONTRACTS.AVAXC, pending));
  if (byNetwork.TRX)   promises.push(scanTRON("TMpQHGgbCMTtgwQrMAt7RNpuSvsLKTdzMR", pending));
  if (byNetwork.SOL)   promises.push(scanSOL("A8LQrqcSFjqKBmERAHWihUWG8N78XLu4kFwzAha36hzo", pending));
  if (byNetwork.BTC)   promises.push(scanBTC("13m89d2ZSjqu3yYxrVUQt6UFucAiUtabG4", pending));

  await Promise.allSettled(promises);
}
