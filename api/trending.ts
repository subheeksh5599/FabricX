

const OKX_BASE = "https://www.okx.com";

export default async function handler(req: any, res: any) {
  try {
    const limit = Math.min(Number(req.query.limit) || 10, 50);
    const response = await fetch(`${OKX_BASE}/api/v5/market/tickers?instType=SPOT`);
    if (!response.ok) throw new Error(`OKX API error: ${response.status}`);
    const json = await response.json();

    const tokens = (json.data || []).slice(0, limit).map((t: any) => ({
      symbol: t.instId.replace("-USDT", ""),
      name: t.instId.replace("-USDT", ""),
      price: t.last,
      change24h: ((parseFloat(t.last) - parseFloat(t.open24h)) / parseFloat(t.open24h) * 100).toFixed(2),
      volume24h: t.vol24h,
      chain: "X Layer",
    }));

    res.setHeader("X-X402-Price", "1");
    res.setHeader("X-X402-Currency", "USDT");
    res.status(200).json({ tokens });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}
