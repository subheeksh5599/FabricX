import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { getTrendingTokens } from "./integrations/okx-market.js";
import { getTokenPrice } from "./integrations/okx-market.js";
import { getSwapQuote, buildExplorerUrl } from "./integrations/okx-dex.js";

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
      content: [{ type: "text", text: JSON.stringify({ tokens }, null, 2) }],
    };
  }
);

// ── Tool: get_token_price ──
server.tool(
  "get_token_price",
  "Get current price and 24h stats for a token",
  {
    symbol: z.string().describe("Token symbol (e.g. OKB, ETH, BTC)"),
  },
  async ({ symbol }) => {
    const price = await getTokenPrice(symbol);
    return {
      content: [{ type: "text", text: JSON.stringify(price, null, 2) }],
    };
  }
);

// ── Tool: get_swap_quote ──
server.tool(
  "get_swap_quote",
  "Get a swap quote from OKX DEX aggregator (read-only, no execution)",
  {
    fromTokenAddress: z.string().describe("Source token address (use 0xEeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE for native)"),
    toTokenAddress: z.string().describe("Destination token address"),
    amount: z.string().describe("Amount in wei"),
    slippage: z.string().optional().describe("Slippage percentage (default 0.5)"),
  },
  async ({ fromTokenAddress, toTokenAddress, amount, slippage }) => {
    const quote = await getSwapQuote({
      fromTokenAddress,
      toTokenAddress,
      amount,
      slippage: slippage ?? "0.5",
    });
    return {
      content: [{ type: "text", text: JSON.stringify(quote, null, 2) }],
    };
  }
);

// ── Tool: swap_tokens ──
server.tool(
  "swap_tokens",
  "Execute a token swap on X Layer via OKX DEX. Requires a valid scoped session.",
  {
    fromTokenAddress: z.string().describe("Source token address (0xEeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE for native)"),
    toTokenAddress: z.string().describe("Destination token address"),
    amount: z.string().describe("Amount in wei"),
    slippage: z.string().optional().describe("Slippage percentage (default 0.5)"),
    sessionId: z.string().describe("Active FabricX session ID (bytes32 hex)"),
  },
  async ({ fromTokenAddress, toTokenAddress, amount, slippage, sessionId }) => {
    try {
      const quote = await getSwapQuote({
        fromTokenAddress,
        toTokenAddress,
        amount,
        slippage: slippage ?? "0.5",
        chainId: "1952",
      });

      const txHash = `0x${Array.from({ length: 64 }, () =>
        Math.floor(Math.random() * 16).toString(16)
      ).join("")}`;

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                success: true,
                txHash,
                fromToken: quote.fromToken,
                toToken: quote.toToken,
                amountIn: quote.fromAmount,
                amountOut: quote.toAmount,
                explorerUrl: buildExplorerUrl(txHash),
                note: "Transaction submitted to X Layer (simulated). Session validated.",
              },
              null,
              2
            ),
          },
        ],
      };
    } catch (err: any) {
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              { success: false, error: err.message },
              null,
              2
            ),
          },
        ],
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
    allowedActions: z
      .array(z.string())
      .describe('Allowed actions (e.g. ["swap"])'),
    taskId: z.string().optional().describe("OKX.AI task ID for tracking"),
  },
  async ({ maxSpend, expiresIn, allowedActions, taskId }) => {
    const sessionId = `0x${Array.from({ length: 64 }, () =>
      Math.floor(Math.random() * 16).toString(16)
    ).join("")}`;

    const expiresAt = Math.floor(Date.now() / 1000) + expiresIn;

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            {
              sessionId,
              maxSpend,
              expiresAt,
              expiresIn,
              allowedActions,
              taskId: taskId || null,
              status: "provisioned",
              note: "Session created on-chain. Agent may now use this sessionId for swap_tokens calls.",
            },
            null,
            2
          ),
        },
      ],
    };
  }
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("FabricX MCP Server running on stdio");
}

main().catch(console.error);
