import { createHmac } from "node:crypto";

const OKX_API_BASE = "https://www.okx.com";

const OKX_API_KEY = process.env.OKX_API_KEY || "";
const OKX_SECRET_KEY = process.env.OKX_SECRET_KEY || "";
const OKX_PASSPHRASE = process.env.OKX_PASSPHRASE || "";

function signOkxRequest(method: string, path: string, body: string = ""): Headers {
  if (!OKX_API_KEY || !OKX_SECRET_KEY) {
    throw new Error("OKX API credentials not set. Add OKX_API_KEY, OKX_SECRET_KEY, OKX_PASSPHRASE to .env");
  }

  const timestamp = new Date().toISOString().replace(/\.\d+Z$/, "Z");
  const signStr = `${timestamp}${method.toUpperCase()}${path}${body}`;
  const signature = createHmac("sha256", OKX_SECRET_KEY)
    .update(signStr)
    .digest("base64");

  return new Headers({
    "OK-ACCESS-KEY": OKX_API_KEY,
    "OK-ACCESS-SIGN": signature,
    "OK-ACCESS-TIMESTAMP": timestamp,
    "OK-ACCESS-PASSPHRASE": OKX_PASSPHRASE,
    "Content-Type": "application/json",
  });
}

export interface SwapTxData {
  fromToken: string;
  toToken: string;
  fromAmount: string;
  toAmount: string;
  priceImpact: string;
  route: string[];
  estimatedGas: string;
  txData: string;
  txTo: string;
  txValue: string;
  txGas: string;
}

export async function getSwapQuote(params: {
  fromTokenAddress: string;
  toTokenAddress: string;
  amount: string;
  slippage: string;
  chainId?: string;
}): Promise<SwapTxData> {
  const chainId = params.chainId || "1952";
  const path = `/api/v5/dex/aggregator/quote?chainId=${chainId}&fromTokenAddress=${params.fromTokenAddress}&toTokenAddress=${params.toTokenAddress}&amount=${params.amount}&slippage=${params.slippage}`;
  const url = `${OKX_API_BASE}${path}`;

  const res = await fetch(url, {
    headers: signOkxRequest("GET", path),
  });
  if (!res.ok) throw new Error(`OKX DEX quote error: ${res.status} ${await res.text()}`);

  const json = (await res.json()) as any;
  const q = json.data?.[0];
  if (!q) throw new Error("OKX DEX returned no routes");

  return {
    fromToken: q.fromToken?.tokenSymbol || "N/A",
    toToken: q.toToken?.tokenSymbol || "N/A",
    fromAmount: q.fromTokenAmount,
    toAmount: q.toTokenAmount,
    priceImpact: q.priceImpactPercentage || "0",
    route: (q.routerList || []).map((r: any) => r.dexName),
    estimatedGas: q.estimatedGas || "0",
    txData: q.tx?.data || "",
    txTo: q.tx?.to || "",
    txValue: q.tx?.value || "0",
    txGas: q.tx?.gas || "0",
  };
}

export function buildExplorerUrl(txHash: string): string {
  return `https://www.okx.com/web3/explorer/xlayer-test/tx/${txHash}`;
}
