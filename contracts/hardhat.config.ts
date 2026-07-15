import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox-viem";

const PRIVATE_KEY = process.env.PRIVATE_KEY || "0x0000000000000000000000000000000000000000000000000000000000000000";

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.25",
    settings: {
      optimizer: { enabled: true, runs: 200 },
      evmVersion: "cancun",
      viaIR: true,
    },
  },
  networks: {
    xlayer: {
      url: process.env.X_LAYER_RPC_URL || "https://testrpc.xlayer.tech/terigon",
      chainId: 1952,
      accounts: [PRIVATE_KEY],
    },
    // Phase 3: Multi-chain deployments
    sepolia: {
      url: process.env.SEPOLIA_RPC || "https://ethereum-sepolia.publicnode.com",
      chainId: 11155111,
      accounts: [PRIVATE_KEY],
    },
    arbitrum_sepolia: {
      url: process.env.ARBITRUM_SEPOLIA_RPC || "https://sepolia-rollup.arbitrum.io/rpc",
      chainId: 421614,
      accounts: [PRIVATE_KEY],
    },
    base_sepolia: {
      url: process.env.BASE_SEPOLIA_RPC || "https://sepolia.base.org",
      chainId: 84532,
      accounts: [PRIVATE_KEY],
    },
    op_sepolia: {
      url: process.env.OP_SEPOLIA_RPC || "https://sepolia.optimism.io",
      chainId: 11155420,
      accounts: [PRIVATE_KEY],
    },
  },
  paths: {
    sources: "./src",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts",
  },
};

export default config;
