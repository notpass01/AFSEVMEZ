const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

// BSC Testnet addresses
const CONFIG = {
  bscTestnet: {
    vrfCoordinator: "0x6A2AAd07396B36Fe02a168b098E2aE7E008E0a10",
    keyHash: "0xd4bb89654db74673a187bd804519e65e3f71a52bc55f11da7601a13dcf505314",
    subscriptionId: process.env.VRF_SUBSCRIPTION_ID || "1",
    tokens: {
      USDT: "0x337610d27c682E347C9cD60BD4b3b107C9d34dDd",
      ETH:  "0x8BaBbB98678facC7342735486C851ABD7A0d17d6",
      BTCB: "0x6ce8dA28E2f864420840cF74474eFf5fD80E65B8",
    }
  },
  bsc: {
    vrfCoordinator: "0xc587d9053cd1118f25F645F9E08BB98088b8Ee72",
    keyHash: "0x114f3da0a805b6a67d6e9cd2ec746f7028f1b7376365af575cfea3550dd1aa04",
    subscriptionId: process.env.VRF_SUBSCRIPTION_ID || "1",
    tokens: {
      USDT: "0x55d398326f99059fF775485246999027B3197955",
      ETH:  "0x2170Ed0880ac9A755fd29B2688956BD959F933F8",
      BTCB: "0x7130d2A12B9BCbFAe4f2634d864A1Ee1Ce3Ead9c",
    }
  }
};

async function main() {
  const [deployer] = await ethers.getSigners();
  const network = hre.network.name;
  const cfg = CONFIG[network] || CONFIG.bscTestnet;

  console.log("Network:", network);
  console.log("Deployer:", deployer.address);
  console.log("Balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "BNB");

  const tokenAddresses = Object.values(cfg.tokens);

  const Casino = await ethers.getContractFactory("Casino");
  const casino = await Casino.deploy(
    cfg.vrfCoordinator,
    cfg.keyHash,
    cfg.subscriptionId,
    tokenAddresses
  );

  await casino.waitForDeployment();
  const address = await casino.getAddress();
  console.log("Casino deployed to:", address);

  // Save to frontend
  const outDir = path.join(__dirname, "../../frontend/src/contracts");
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  fs.writeFileSync(
    path.join(outDir, "addresses.json"),
    JSON.stringify({ casino: address, tokens: cfg.tokens, network }, null, 2)
  );

  const artifact = require("../artifacts/contracts/Casino.sol/Casino.json");
  fs.writeFileSync(
    path.join(outDir, "Casino.json"),
    JSON.stringify({ abi: artifact.abi }, null, 2)
  );

  console.log("Contract data saved to frontend/src/contracts/");
  console.log("\nNEXT STEPS:");
  console.log("1. Add Casino address as consumer in Chainlink VRF subscription");
  console.log("2. Fund the pool: casino.depositPool(tokenAddress, amount)");
}

main().catch((err) => { console.error(err); process.exit(1); });
