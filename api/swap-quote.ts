

const OKX_BASE = "https://www.okx.com";

export default async function handler(req: any, res: any) {
  try {
    const { fromTokenAddress, toTokenAddress, amount, slippage = "0.5" } = req.query;
    if (!fromTokenAddress || !toTokenAddress || !amount) {
      return res.status(400).json({ error: "Missing required params: fromTokenAddress, toTokenAddress, amount" });
    }

    const url = `${OKX_BASE}/api/v5/dex/aggregator/quote?chainId=1952&fromTokenAddress=${fromTokenAddress}&toTokenAddress=${toTokenAddress}&amount=${amount}&slippage=${slippage}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error(`OKX DEX error: ${response.status}`);
    const json = await response.json();
    const q = json.data?.[0];
    if (!q) throw new Error("No route found");

    res.setHeader("X-X402-Price", "1");
    res.setHeader("X-X402-Currency", "USDT");
    res.status(200).json({
      fromToken: q.fromToken?.tokenSymbol || "N/A",
      toToken: q.toToken?.tokenSymbol || "N/A",
      fromAmount: q.fromTokenAmount,
      toAmount: q.toTokenAmount,
      priceImpact: q.priceImpactPercentage || "0",
      route: (q.routerList || []).map((r: any) => r.dexName),
      estimatedGas: q.estimatedGas || "0",
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}
