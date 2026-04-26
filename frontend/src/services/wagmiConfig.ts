import { createConfig, http } from "wagmi";
import { bsc, bscTestnet } from "wagmi/chains";
import { getDefaultConfig } from "@rainbow-me/rainbowkit";

export const wagmiConfig = getDefaultConfig({
  appName: "WinWin Casino",
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || "winwin",
  chains: [bscTestnet, bsc],
  transports: {
    [bscTestnet.id]: http("https://data-seed-prebsc-1-s1.binance.org:8545"),
    [bsc.id]:        http("https://bsc-dataseed.binance.org/"),
  },
  ssr: true,
});
