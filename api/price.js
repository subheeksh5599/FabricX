const OKX_BASE = "https://www.okx.com";

export default async function handler(req, res) {
  try {
    const symbol = String(req.query.symbol || "OKB").toUpperCase();
    const response = await fetch(`${OKX_BASE}/api/v5/market/ticker?instId=${symbol}-USDT`);
    if (!response.ok) throw new Error(`OKX API error: ${response.status}`);
    const json = await response.json();
    const t = json.data?.[0];
    if (!t) throw new Error(`No data for ${symbol}`);

    res.setHeader("X-X402-Price", "1");
    res.setHeader("X-X402-Currency", "USDT");
    res.status(200).json({
      symbol: t.instId.replace("-USDT", ""),
      price: t.last,
      change24h: ((parseFloat(t.last) - parseFloat(t.open24h)) / parseFloat(t.open24h) * 100).toFixed(2),
      high24h: t.high24h,
      low24h: t.low24h,
      volume24h: t.vol24h,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
