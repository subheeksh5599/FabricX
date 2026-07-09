import { getPublicClient, getWalletClient } from "../wallet.js";
import { CONTRACTS } from "../contracts/addresses.js";
import { SessionKeyManagerAbi } from "../contracts/abis.js";
import type { Address } from "viem";
import { keccak256, toHex } from "viem";

export interface SessionInfo {
  owner: string;
  maxSpend: bigint;
  spendSoFar: bigint;
  expiresAt: bigint;
  allowedActions: string[];
  isActive: boolean;
}

export async function validateSessionOnChain(
  sessionId: string,
  amount: bigint,
  action: string
): Promise<{ valid: boolean; reason?: string }> {
  const client = getPublicClient();

  try {
    const session = await client.readContract({
      address: CONTRACTS.SESSION_KEY_MANAGER as Address,
      abi: SessionKeyManagerAbi,
      functionName: "getSession",
      args: [sessionId as Address],
    });

    const s = session as any;
    if (!s.isActive) return { valid: false, reason: "Session is not active" };
    if (BigInt(Math.floor(Date.now() / 1000)) > BigInt(s.expiresAt)) {
      return { valid: false, reason: "Session has expired" };
    }
    if (BigInt(s.spendSoFar) + amount > BigInt(s.maxSpend)) {
      return { valid: false, reason: "Spend would exceed maxSpend" };
    }

    const actionHash = keccak256(toHex(action));
    const allowed = (s.allowedActions as string[]).some(
      (a) => a.toLowerCase() === actionHash.toLowerCase()
    );
    if (!allowed) return { valid: false, reason: `Action "${action}" not in allowlist` };

    return { valid: true };
  } catch (err: any) {
    return { valid: false, reason: `Contract read error: ${err.message}` };
  }
}

export async function recordSpendOnChain(
  sessionId: string,
  amount: bigint
): Promise<string> {
  const wallet = getWalletClient();
  const hash = await wallet.writeContract({
    address: CONTRACTS.SESSION_KEY_MANAGER as Address,
    abi: SessionKeyManagerAbi,
    functionName: "recordSpend",
    args: [sessionId as Address, amount],
    chain: undefined,
    account: wallet.account!,
  } as any);
  return hash;
}
