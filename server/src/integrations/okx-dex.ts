const OKX_DEX_BASE = "https://www.okx.com";

export interface SwapQuote {
  fromToken: string;
  toToken: string;
  fromAmount: string;
  toAmount: string;
  priceImpact: string;
  route: string[];
  estimatedGas: string;
  txData: string;
}

export async function getSwapQuote(params: {
  fromTokenAddress: string;
  toTokenAddress: string;
  amount: string;
  slippage: string;
  chainId?: string;
}): Promise<SwapQuote> {
  const chainId = params.chainId || "1952";
  const url = new URL(`${OKX_DEX_BASE}/api/v5/dex/aggregator/quote`);
  url.searchParams.set("chainId", chainId);
  url.searchParams.set("fromTokenAddress", params.fromTokenAddress);
  url.searchParams.set("toTokenAddress", params.toTokenAddress);
  url.searchParams.set("amount", params.amount);
  url.searchParams.set("slippage", params.slippage);

  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`OKX DEX API error: ${res.status}`);

  const data = (await res.json()) as {
    data: Array<{
      fromToken: { tokenSymbol: string };
      toToken: { tokenSymbol: string };
      fromTokenAmount: string;
      toTokenAmount: string;
      priceImpactPercentage: string;
      routerList: Array<{ dexName: string }>;
      estimatedGas: string;
      tx: { data: string };
    }>;
  };

  const q = data.data[0];
  return {
    fromToken: q.fromToken.tokenSymbol,
    toToken: q.toToken.tokenSymbol,
    fromAmount: q.fromTokenAmount,
    toAmount: q.toTokenAmount,
    priceImpact: q.priceImpactPercentage || "0",
    route: q.routerList.map((r) => r.dexName),
    estimatedGas: q.estimatedGas || "0",
    txData: q.tx.data,
  };
}

export interface SwapResult {
  success: boolean;
  txHash: string;
  fromToken: string;
  toToken: string;
  amountIn: string;
  amountOut: string;
  explorerUrl: string;
}

export function buildExplorerUrl(txHash: string): string {
  return `https://www.okx.com/web3/explorer/xlayer-test/tx/${txHash}`;
}
