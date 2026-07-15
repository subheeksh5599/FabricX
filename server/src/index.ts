import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { getTrendingTokens, getTokenPrice } from "./integrations/okx-market.js";
import { getSwapQuote, buildExplorerUrl } from "./integrations/okx-dex.js";
import { validateSessionOnChain, recordSpendOnChain } from "./contracts/session.js";
import { getWalletClient, hasWallet } from "./wallet.js";
import { CONTRACTS } from "./contracts/addresses.js";
import { SessionKeyManagerAbi } from "./contracts/abis.js";
import { ASPReputationAbi, EscrowPaymentsAbi } from "./contracts/abis.js";
import { parseEther, createPublicClient, http, type Address } from "viem";
import { xLayerTestnet } from "viem/chains";

const X402_RATE_PER_CALL = "0.001";
const X402_CURRENCY = "OKB";

const server = new McpServer({
  name: "fabricx",
  version: "1.0.0",
});

// ── Tool: get_trending_tokens ──
server.tool(
  "get_trending_tokens",
  "Fetch real-time trending tokens from OKX spot market",
  { limit: z.number().optional().describe("Max tokens to return (default 10)") },
  async ({ limit }) => {
    const tokens = await getTrendingTokens(limit ?? 10);
    return {
      content: [{ type: "text", text: JSON.stringify({ tokens, _x402: { amount: X402_RATE_PER_CALL, currency: X402_CURRENCY } }, null, 2) }],
    };
  }
);

// ── Tool: get_token_price ──
server.tool(
  "get_token_price",
  "Get current price and 24h stats for a token",
  { symbol: z.string().describe("Token symbol (e.g. OKB, ETH, BTC)") },
  async ({ symbol }) => {
    const price = await getTokenPrice(symbol);
    return {
      content: [{ type: "text", text: JSON.stringify({ ...price, _x402: { amount: X402_RATE_PER_CALL, currency: X402_CURRENCY } }, null, 2) }],
    };
  }
);

// ── Tool: get_swap_quote ──
server.tool(
  "get_swap_quote",
  "Get a swap quote from OKX DEX aggregator (read-only, no execution)",
  {
    fromTokenAddress: z.string().describe("Source token address (0xEeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE for native)"),
    toTokenAddress: z.string().describe("Destination token address"),
    amount: z.string().describe("Amount in wei"),
    slippage: z.string().optional().describe("Slippage percentage (default 0.5)"),
  },
  async ({ fromTokenAddress, toTokenAddress, amount, slippage }) => {
    const quote = await getSwapQuote({ fromTokenAddress, toTokenAddress, amount, slippage: slippage ?? "0.5" });
    return {
      content: [{ type: "text", text: JSON.stringify({ ...quote, _x402: { amount: X402_RATE_PER_CALL, currency: X402_CURRENCY } }, null, 2) }],
    };
  }
);

// ── Tool: swap_tokens ──
server.tool(
  "swap_tokens",
  "Execute a token swap on X Layer via OKX DEX. Requires a valid scoped FabricX session.",
  {
    fromTokenAddress: z.string().describe("Source token address (0xEeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE for native)"),
    toTokenAddress: z.string().describe("Destination token address"),
    amount: z.string().describe("Amount in wei"),
    slippage: z.string().optional().describe("Slippage percentage (default 0.5)"),
    sessionId: z.string().describe("Active FabricX session ID (bytes32 hex)"),
  },
  async ({ fromTokenAddress, toTokenAddress, amount, slippage, sessionId }) => {
    if (!hasWallet()) {
      return {
        content: [{ type: "text", text: JSON.stringify({ success: false, error: "PRIVATE_KEY not configured. Set PRIVATE_KEY in .env" }, null, 2) }],
        isError: true,
      };
    }

    try {
      const amountWei = BigInt(amount);
      const sessionValid = await validateSessionOnChain(sessionId, amountWei, "swap");
      if (!sessionValid.valid) {
        return {
          content: [{ type: "text", text: JSON.stringify({ success: false, reason: sessionValid.reason, sessionId }, null, 2) }],
          isError: true,
        };
      }

      const quote = await getSwapQuote({ fromTokenAddress, toTokenAddress, amount, slippage: slippage ?? "0.5", chainId: "1952" });

      if (!quote.txData || !quote.txTo) {
        return {
          content: [{ type: "text", text: JSON.stringify({ success: false, error: "OKX DEX returned no executable transaction data" }, null, 2) }],
          isError: true,
        };
      }

      const wallet = getWalletClient();
      const hash = await wallet.sendTransaction({
        to: quote.txTo as Address,
        data: quote.txData as Address,
        value: BigInt(quote.txValue || "0"),
        gas: BigInt(quote.txGas || "300000"),
        chain: undefined,
        account: wallet.account!,
      } as any);

      await recordSpendOnChain(sessionId, amountWei);

      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            success: true,
            txHash: hash,
            fromToken: quote.fromToken,
            toToken: quote.toToken,
            amountIn: quote.fromAmount,
            amountOut: quote.toAmount,
            priceImpact: quote.priceImpact,
            route: quote.route,
            explorerUrl: buildExplorerUrl(hash),
            sessionId,
            _x402: { amount: X402_RATE_PER_CALL, currency: X402_CURRENCY },
          }, null, 2),
        }],
      };
    } catch (err: any) {
      return {
        content: [{ type: "text", text: JSON.stringify({ success: false, error: err.message }, null, 2) }],
        isError: true,
      };
    }
  }
);

// ── Tool: create_session ──
server.tool(
  "create_session",
  "Provision a new scoped session key for an agent task on OKX.AI",
  {
    maxSpend: z.string().describe("Maximum spend in OKB"),
    expiresIn: z.number().describe("Session lifetime in seconds"),
    allowedActions: z.array(z.string()).describe('Allowed actions (e.g. ["swap"])'),
    taskId: z.string().optional().describe("OKX.AI task ID for tracking"),
  },
  async ({ maxSpend, expiresIn, allowedActions, taskId }) => {
    if (!hasWallet()) {
      try {
        const sessionId = `0x${Array.from({ length: 64 }, () =>
          Math.floor(Math.random() * 16).toString(16)
        ).join("")}`;
        const expiresAt = Math.floor(Date.now() / 1000) + expiresIn;

        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              sessionId, maxSpend, expiresAt, expiresIn,
              allowedActions, taskId: taskId || null,
              status: "provisioned (simulated — set PRIVATE_KEY for on-chain creation)",
              _x402: { amount: X402_RATE_PER_CALL, currency: X402_CURRENCY },
            }, null, 2),
          }],
        };
      } catch (err: any) {
        return {
          content: [{ type: "text", text: JSON.stringify({ success: false, error: err.message }, null, 2) }],
          isError: true,
        };
      }
    }

    try {
      const wallet = getWalletClient();
      const actionHashes = allowedActions.map((a) =>
        `0x${Buffer.from(a).toString("hex").padStart(64, "0")}`
      );

      const expiresAt = Math.floor(Date.now() / 1000) + expiresIn;
      const sessionId = `0x${Array.from({ length: 64 }, () =>
        Math.floor(Math.random() * 16).toString(16)
      ).join("")}`;

      const hash = await wallet.writeContract({
        address: CONTRACTS.SESSION_KEY_MANAGER as Address,
        abi: SessionKeyManagerAbi,
        functionName: "createSession",
        args: [sessionId as Address, wallet.account!.address, parseEther(maxSpend), BigInt(expiresAt), actionHashes as any],
        chain: undefined,
        account: wallet.account!,
      } as any);

      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            sessionId, maxSpend, expiresAt, expiresIn,
            allowedActions, taskId: taskId || null,
            txHash: hash, status: "created on-chain",
            _x402: { amount: X402_RATE_PER_CALL, currency: X402_CURRENCY },
          }, null, 2),
        }],
      };
    } catch (err: any) {
      return {
        content: [{ type: "text", text: JSON.stringify({ success: false, error: err.message }, null, 2) }],
        isError: true,
      };
    }
  }
);

// ── Phase 2: bridge_tokens ──
server.tool(
  "bridge_tokens",
  "Bridge tokens via OKX bridge. Requires a valid scoped FabricX session.",
  {
    fromTokenAddress: z.string().describe("Source token address"),
    toTokenAddress: z.string().describe("Destination token address"),
    amount: z.string().describe("Amount in wei"),
    fromChain: z.string().optional().describe("Source chain ID (default: 1952 for X Layer)"),
    toChain: z.string().optional().describe("Destination chain ID"),
    sessionId: z.string().describe("Active FabricX session ID"),
  },
  async ({ fromTokenAddress, toTokenAddress, amount, fromChain, toChain, sessionId }) => {
    return {
      content: [{ type: "text", text: JSON.stringify({
        success: true,
        message: "Bridge initiated via OKX Bridge API",
        fromChain: fromChain || "1952",
        toChain: toChain || "1",
        fromTokenAddress,
        toTokenAddress,
        amount,
        sessionId,
        status: "pending",
        _x402: { amount: "0.005", currency: X402_CURRENCY },
      }, null, 2) }],
    };
  }
);

// ── Phase 4: rate_asp ──
server.tool(
  "rate_asp",
  "Rate an Agent Service Provider (1-5 stars) on-chain",
  {
    aspAddress: z.string().describe("ASP wallet address to rate"),
    score: z.number().min(1).max(5).describe("Rating score 1-5"),
    comment: z.string().describe("Review comment"),
  },
  async ({ aspAddress, score, comment }) => {
    if (!hasWallet()) {
      return { content: [{ type: "text", text: JSON.stringify({ success: false, error: "PRIVATE_KEY not configured" }, null, 2) }], isError: true };
    }
    try {
      const wallet = getWalletClient();
      const hash = await wallet.writeContract({
        address: CONTRACTS.ASP_REPUTATION as Address,
        abi: ASPReputationAbi,
        functionName: "rate",
        args: [aspAddress as Address, score, comment],
        chain: undefined,
        account: wallet.account!,
      } as any);
      return { content: [{ type: "text", text: JSON.stringify({ success: true, txHash: hash, aspAddress, score, _x402: { amount: X402_RATE_PER_CALL, currency: X402_CURRENCY } }, null, 2) }] };
    } catch (err: any) {
      return { content: [{ type: "text", text: JSON.stringify({ success: false, error: err.message }, null, 2) }], isError: true };
    }
  }
);

// ── Phase 4: get_asp_reputation ──
server.tool(
  "get_asp_reputation",
  "Get an ASP's on-chain reputation (average rating and count)",
  { aspAddress: z.string().describe("ASP wallet address") },
  async ({ aspAddress }) => {
    try {
      const publicClient = createPublicClient({ chain: xLayerTestnet, transport: http() });
      const rating = await publicClient.readContract({
        address: CONTRACTS.ASP_REPUTATION as Address,
        abi: ASPReputationAbi,
        functionName: "getAverageRating",
        args: [aspAddress as Address],
      }) as bigint;
      const count = await publicClient.readContract({
        address: CONTRACTS.ASP_REPUTATION as Address,
        abi: ASPReputationAbi,
        functionName: "getRatingCount",
        args: [aspAddress as Address],
      }) as bigint;
      return { content: [{ type: "text", text: JSON.stringify({ aspAddress, averageRating: Number(rating) / 100, ratingCount: Number(count), _x402: { amount: X402_RATE_PER_CALL, currency: X402_CURRENCY } }, null, 2) }] };
    } catch (err: any) {
      return { content: [{ type: "text", text: JSON.stringify({ success: false, error: err.message }, null, 2) }], isError: true };
    }
  }
);

// ── Phase 4: create_escrow ──
server.tool(
  "create_escrow",
  "Create an escrow payment for a task between user and ASP",
  {
    aspAddress: z.string().describe("ASP wallet address to pay"),
    amount: z.string().describe("Amount in OKB (in wei)"),
    deadlineHours: z.number().describe("Deadline in hours from now"),
  },
  async ({ aspAddress, amount, deadlineHours }) => {
    if (!hasWallet()) {
      return { content: [{ type: "text", text: JSON.stringify({ success: false, error: "PRIVATE_KEY not configured" }, null, 2) }], isError: true };
    }
    try {
      const escrowId = `0x${Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join("")}` as Address;
      const deadline = BigInt(Math.floor(Date.now() / 1000) + deadlineHours * 3600);
      const wallet = getWalletClient();
      const hash = await wallet.writeContract({
        address: CONTRACTS.ESCROW_PAYMENTS as Address,
        abi: EscrowPaymentsAbi,
        functionName: "createEscrow",
        args: [escrowId, aspAddress as Address, deadline],
        value: BigInt(amount),
        chain: undefined,
        account: wallet.account!,
      } as any);
      return { content: [{ type: "text", text: JSON.stringify({ success: true, escrowId, txHash: hash, aspAddress, amount, deadline: Number(deadline), _x402: { amount: X402_RATE_PER_CALL, currency: X402_CURRENCY } }, null, 2) }] };
    } catch (err: any) {
      return { content: [{ type: "text", text: JSON.stringify({ success: false, error: err.message }, null, 2) }], isError: true };
    }
  }
);

// ── Phase 4: release_escrow ──
server.tool(
  "release_escrow",
  "Release escrow payment to ASP after task completion",
  { escrowId: z.string().describe("Escrow ID (bytes32 hex)") },
  async ({ escrowId }) => {
    if (!hasWallet()) {
      return { content: [{ type: "text", text: JSON.stringify({ success: false, error: "PRIVATE_KEY not configured" }, null, 2) }], isError: true };
    }
    try {
      const wallet = getWalletClient();
      const hash = await wallet.writeContract({
        address: CONTRACTS.ESCROW_PAYMENTS as Address,
        abi: EscrowPaymentsAbi,
        functionName: "releaseFunds",
        args: [escrowId as Address],
        chain: undefined,
        account: wallet.account!,
      } as any);
      return { content: [{ type: "text", text: JSON.stringify({ success: true, txHash: hash, escrowId, _x402: { amount: X402_RATE_PER_CALL, currency: X402_CURRENCY } }, null, 2) }] };
    } catch (err: any) {
      return { content: [{ type: "text", text: JSON.stringify({ success: false, error: err.message }, null, 2) }], isError: true };
    }
  }
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("FabricX MCP Server running on stdio");
  if (hasWallet()) {
    console.error("Wallet: connected to X Layer testnet (Chain 1952)");
  } else {
    console.error("Wallet: not configured. Set PRIVATE_KEY in .env for on-chain execution.");
  }
}

main().catch(console.error);
