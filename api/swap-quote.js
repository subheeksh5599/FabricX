import crypto from "crypto";

const OKX_BASE = "https://www.okx.com";
const API_KEY = process.env.OKX_API_KEY || "";
const SECRET_KEY = process.env.OKX_SECRET_KEY || "";
const PASSPHRASE = process.env.OKX_PASSPHRASE || "";
const X402_RATE = "1";
const X402_CURRENCY = "USDT";
const X402_RECIPIENT = process.env.X402_RECIPIENT || "0x76092779c93a9a303aD2Ad2C4606415040CDa79d";

function sign(timestamp, method, path, body = "") {
  return crypto.createHmac("sha256", SECRET_KEY).update(timestamp + method + path + body).digest("base64");
}

function checkPayment(req, res) {
  const hasPayment = req.headers["x-x402-payment"] || req.query._x402_payment;
  if (hasPayment) return true;
  res.status(402).json({
    accepts: [{
      currency: X402_CURRENCY, amount: X402_RATE, chainId: 1952,
      recipient: X402_RECIPIENT,
      description: "Pay per API call via x402. Include X-X402-Payment header with proof.",
    }],
  });
  return false;
}

export default async function handler(req, res) {
  if (!checkPayment(req, res)) return;
  try {
    const { fromTokenAddress, toTokenAddress, amount, slippage = "0.5" } = req.query;
    if (!fromTokenAddress || !toTokenAddress || !amount) {
      return res.status(400).json({ error: "Missing: fromTokenAddress, toTokenAddress, amount" });
    }
    const path = `/api/v5/dex/aggregator/quote?chainId=1952&fromTokenAddress=${fromTokenAddress}&toTokenAddress=${toTokenAddress}&amount=${amount}&slippage=${slippage}`;
    const timestamp = new Date().toISOString();
    const response = await fetch(`${OKX_BASE}${path}`, {
      headers: { "OK-ACCESS-KEY": API_KEY, "OK-ACCESS-SIGN": sign(timestamp, "GET", path), "OK-ACCESS-TIMESTAMP": timestamp, "OK-ACCESS-PASSPHRASE": PASSPHRASE },
    });
    if (!response.ok) throw new Error(`OKX DEX error: ${response.status}`);
    const json = await response.json();
    const q = json.data?.[0];
    if (!q) throw new Error("No route found");
    res.setHeader("X-X402-Price", X402_RATE);
    res.setHeader("X-X402-Currency", X402_CURRENCY);
    res.status(200).json({
      fromToken: q.fromToken?.tokenSymbol || "N/A", toToken: q.toToken?.tokenSymbol || "N/A",
      fromAmount: q.fromTokenAmount, toAmount: q.toTokenAmount,
      priceImpact: q.priceImpactPercentage || "0",
      route: (q.routerList || []).map((r) => r.dexName), estimatedGas: q.estimatedGas || "0",
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
}
