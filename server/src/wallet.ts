import { createPublicClient, createWalletClient, http, type PublicClient, type WalletClient, type Address } from "viem";
import { privateKeyToAccount } from "viem/accounts";

const X_LAYER_RPC = process.env.X_LAYER_RPC_URL || "https://testrpc.xlayer.tech/terigon";
const PRIVATE_KEY = process.env.PRIVATE_KEY || "";

const xlayerChain = {
  id: 1952,
  name: "X Layer Testnet",
  nativeCurrency: { name: "OKB", symbol: "OKB", decimals: 18 },
  rpcUrls: { default: { http: [X_LAYER_RPC] } },
} as const;

function getPublicClient(): PublicClient {
  return createPublicClient({
    chain: xlayerChain,
    transport: http(X_LAYER_RPC),
  });
}

function getWalletClient(): WalletClient {
  if (!PRIVATE_KEY || PRIVATE_KEY === "your_testnet_private_key_here") {
    throw new Error("PRIVATE_KEY not set. Create a testnet wallet and set PRIVATE_KEY in .env");
  }
  const account = privateKeyToAccount(PRIVATE_KEY as Address);
  return createWalletClient({
    chain: xlayerChain,
    transport: http(X_LAYER_RPC),
    account,
  });
}

export function hasWallet(): boolean {
  return !!PRIVATE_KEY && PRIVATE_KEY !== "your_testnet_private_key_here";
}

export { getPublicClient, getWalletClient, xlayerChain };
