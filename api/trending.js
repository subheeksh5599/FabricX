const OKX_BASE = "https://www.okx.com";

// x402 payment gate — shared across all routes
const X402_RATE = "1";
const X402_CURRENCY = "USDT";
const X402_RECIPIENT = process.env.X402_RECIPIENT || "0x76092779c93a9a303aD2Ad2C4606415040CDa79d";

// Check for x402 payment proof. Returns true if paid, false if 402 required.
function checkPayment(req, res) {
  // Check for x402 payment header or query param
  const hasPayment = req.headers["x-x402-payment"] || req.query._x402_payment;
  if (hasPayment) return true;

  // No payment — return 402 with accepts array
  res.status(402).json({
    accepts: [
      {
        currency: X402_CURRENCY,
        amount: X402_RATE,
        chainId: 1952,
        recipient: X402_RECIPIENT,
        description: "Pay per API call via x402. Include X-X402-Payment header with proof.",
      },
    ],
  });
  return false;
}

export default async function handler(req, res) {
  if (!checkPayment(req, res)) return;

  try {
    const limit = Math.min(Number(req.query.limit) || 10, 50);
    const response = await fetch(`${OKX_BASE}/api/v5/market/tickers?instType=SPOT`);
    if (!response.ok) throw new Error(`OKX API error: ${response.status}`);
    const json = await response.json();

    const tokens = (json.data || []).slice(0, limit).map((t) => ({
      symbol: t.instId.replace("-USDT", ""),
      name: t.instId.replace("-USDT", ""),
      price: t.last,
      change24h: ((parseFloat(t.last) - parseFloat(t.open24h)) / parseFloat(t.open24h) * 100).toFixed(2),
      volume24h: t.vol24h,
      chain: "X Layer",
    }));

    res.setHeader("X-X402-Price", X402_RATE);
    res.setHeader("X-X402-Currency", X402_CURRENCY);
    res.setHeader("Content-Type", "application/json");
    res.status(200).json({ tokens });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
