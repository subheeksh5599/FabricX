import crypto from "crypto";

const OKX_BASE = "https://www.okx.com";
const API_KEY = process.env.OKX_API_KEY || "";
const SECRET_KEY = process.env.OKX_SECRET_KEY || "";
const PASSPHRASE = process.env.OKX_PASSPHRASE || "";

function sign(timestamp, method, path, body = "") {
  const message = timestamp + method + path + body;
  return crypto.createHmac("sha256", SECRET_KEY).update(message).digest("base64");
}

export default async function handler(req, res) {
  try {
    const { fromTokenAddress, toTokenAddress, amount, slippage = "0.5" } = req.query;
    if (!fromTokenAddress || !toTokenAddress || !amount) {
      return res.status(400).json({ error: "Missing required params: fromTokenAddress, toTokenAddress, amount" });
    }

    const path = `/api/v5/dex/aggregator/quote?chainId=1952&fromTokenAddress=${fromTokenAddress}&toTokenAddress=${toTokenAddress}&amount=${amount}&slippage=${slippage}`;
    const timestamp = new Date().toISOString();
    const signature = sign(timestamp, "GET", path);

    const response = await fetch(`${OKX_BASE}${path}`, {
      headers: {
        "OK-ACCESS-KEY": API_KEY,
        "OK-ACCESS-SIGN": signature,
        "OK-ACCESS-TIMESTAMP": timestamp,
        "OK-ACCESS-PASSPHRASE": PASSPHRASE,
      },
    });

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
      route: (q.routerList || []).map((r) => r.dexName),
      estimatedGas: q.estimatedGas || "0",
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
