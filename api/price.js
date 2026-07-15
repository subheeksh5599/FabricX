const OKX_BASE = "https://www.okx.com";
const X402_RATE = "1";
const X402_CURRENCY = "USDT";
const X402_RECIPIENT = process.env.X402_RECIPIENT || "0x76092779c93a9a303aD2Ad2C4606415040CDa79d";

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
    const symbol = String(req.query.symbol || "OKB").toUpperCase();
    const response = await fetch(`${OKX_BASE}/api/v5/market/ticker?instId=${symbol}-USDT`);
    if (!response.ok) throw new Error(`OKX API error: ${response.status}`);
    const json = await response.json();
    const t = json.data?.[0];
    if (!t) throw new Error(`No data for ${symbol}`);
    res.setHeader("X-X402-Price", X402_RATE);
    res.setHeader("X-X402-Currency", X402_CURRENCY);
    res.status(200).json({
      symbol: t.instId.replace("-USDT", ""), price: t.last,
      change24h: ((parseFloat(t.last) - parseFloat(t.open24h)) / parseFloat(t.open24h) * 100).toFixed(2),
      high24h: t.high24h, low24h: t.low24h, volume24h: t.vol24h,
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
}
