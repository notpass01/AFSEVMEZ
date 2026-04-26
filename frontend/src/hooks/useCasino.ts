"use client";

import { useWriteContract, useReadContract, useAccount } from "wagmi";
import { parseUnits, formatUnits } from "viem";
import { bscTestnet } from "wagmi/chains";
import addresses from "@/contracts/addresses.json";
import casinoAbi from "@/contracts/Casino.json";

const CONTRACT = addresses.casino as `0x${string}`;
const ABI = casinoAbi.abi;

const TOKEN_DECIMALS: Record<string, number> = {
  BNB: 18, USDT: 18, ETH: 18, BTCB: 18,
};

export function useCasino() {
  const { address } = useAccount();
  const { writeContractAsync } = useWriteContract();

  const playRoulette = async (
    tokenSymbol: string,
    tokenAddress: string,
    amount: string,
    start: number,
    end: number
  ) => {
    const decimals = TOKEN_DECIMALS[tokenSymbol] ?? 18;
    const amountWei = parseUnits(amount, decimals);
    const isNative = tokenAddress === "0x0000000000000000000000000000000000000000";

    return writeContractAsync({
      address: CONTRACT,
      abi: ABI,
      functionName: "playRoulette",
      args: [tokenAddress, amountWei, BigInt(start), BigInt(end)],
      value: isNative ? amountWei : undefined,
      chainId: bscTestnet.id,
    });
  };

  const playDice = async (
    tokenSymbol: string,
    tokenAddress: string,
    amount: string,
    target: number
  ) => {
    const decimals = TOKEN_DECIMALS[tokenSymbol] ?? 18;
    const amountWei = parseUnits(amount, decimals);
    const isNative = tokenAddress === "0x0000000000000000000000000000000000000000";

    return writeContractAsync({
      address: CONTRACT,
      abi: ABI,
      functionName: "playDice",
      args: [tokenAddress, amountWei, BigInt(target)],
      value: isNative ? amountWei : undefined,
      chainId: bscTestnet.id,
    });
  };

  const playCoinFlip = async (
    tokenSymbol: string,
    tokenAddress: string,
    amount: string,
    side: number
  ) => {
    const decimals = TOKEN_DECIMALS[tokenSymbol] ?? 18;
    const amountWei = parseUnits(amount, decimals);
    const isNative = tokenAddress === "0x0000000000000000000000000000000000000000";

    return writeContractAsync({
      address: CONTRACT,
      abi: ABI,
      functionName: "playCoinFlip",
      args: [tokenAddress, amountWei, BigInt(side)],
      value: isNative ? amountWei : undefined,
      chainId: bscTestnet.id,
    });
  };

  return { playRoulette, playDice, playCoinFlip };
}
