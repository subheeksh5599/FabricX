const OKX_BASE = "https://www.okx.com";
const X402_RATE = "1";
const X402_CURRENCY = "USDT";

export default async function handler(req, res) {
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

    const payload = {
      tokens,
      _x402: { amount: X402_RATE, currency: X402_CURRENCY },
    };

    res.setHeader("X-X402-Price", X402_RATE);
    res.setHeader("X-X402-Currency", X402_CURRENCY);
    res.setHeader("Content-Type", "application/json");
    res.status(200).json(payload);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
