import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { getTrendingTokens, getTokenPrice } from "./integrations/okx-market.js";
import { getSwapQuote, buildExplorerUrl } from "./integrations/okx-dex.js";
import { validateSessionOnChain, recordSpendOnChain } from "./contracts/session.js";
import { getWalletClient, hasWallet } from "./wallet.js";
import { CONTRACTS } from "./contracts/addresses.js";
import { SessionKeyManagerAbi } from "./contracts/abis.js";
import { parseEther, type Address } from "viem";

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
