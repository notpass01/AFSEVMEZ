export const DEPOSIT_ADDRESSES: Record<string, Record<string, string>> = {
  BNB: {
    BSC: "0xf8bf5ca0dd6d31729b91ca6d0b0d3f6928b7d35f",
  },
  USDT: {
    BSC:    "0xf8bf5ca0dd6d31729b91ca6d0b0d3f6928b7d35f",
    TRX:    "TMpQHGgbCMTtgwQrMAt7RNpuSvsLKTdzMR",
    ETH:    "0xf8bf5ca0dd6d31729b91ca6d0b0d3f6928b7d35f",
    POL:    "0xf8bf5ca0dd6d31729b91ca6d0b0d3f6928b7d35f",
    AVAXC:  "0xf8bf5ca0dd6d31729b91ca6d0b0d3f6928b7d35f",
    SOL:    "A8LQrqcSFjqKBmERAHWihUWG8N78XLu4kFwzAha36hzo",
  },
  ETH: {
    ETH: "0xf8bf5ca0dd6d31729b91ca6d0b0d3f6928b7d35f",
    BSC: "0xf8bf5ca0dd6d31729b91ca6d0b0d3f6928b7d35f",
  },
  BTC: {
    BTC: "13m89d2ZSjqu3yYxrVUQt6UFucAiUtabG4",
    BSC: "0xf8bf5ca0dd6d31729b91ca6d0b0d3f6928b7d35f",
    ETH: "0xf8bf5ca0dd6d31729b91ca6d0b0d3f6928b7d35f",
  },
};

export const NETWORK_LABELS: Record<string, string> = {
  BSC:   "BNB Smart Chain (BEP-20)",
  ETH:   "Ethereum (ERC-20)",
  TRX:   "Tron (TRC-20)",
  POL:   "Polygon",
  AVAXC: "Avalanche C-Chain",
  SOL:   "Solana",
  BTC:   "Bitcoin",
};

// Minimum deposit amounts per coin
// ~$5 equivalent per coin
export const MIN_DEPOSIT: Record<string, number> = {
  BNB:  0.008,
  USDT: 5,
  ETH:  0.0015,
  BTC:  0.00005,
};

// Decimals for unique amount suffix
export const COIN_DECIMALS: Record<string, number> = {
  BNB:  4,
  USDT: 2,
  ETH:  5,
  BTC:  6,
};
