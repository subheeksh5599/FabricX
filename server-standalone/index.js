const http = require("http");

const OKX_BASE = "https://www.okx.com";

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "*",
  };
}

async function handleTrending(req, res) {
  const url = new URL(req.url, "http://localhost");
  const limit = Math.min(Number(url.searchParams.get("limit")) || 10, 50);

  const response = await fetch(`${OKX_BASE}/api/v5/market/tickers?instType=SPOT`);
  const json = await response.json();

  const tokens = (json.data || []).slice(0, limit).map((t) => ({
    symbol: t.instId.replace("-USDT", ""),
    name: t.instId.replace("-USDT", ""),
    price: t.last,
    change24h: (
      ((parseFloat(t.last) - parseFloat(t.open24h)) /
        parseFloat(t.open24h)) *
      100
    ).toFixed(2),
    volume24h: t.vol24h,
    chain: "X Layer",
  }));

  const payload = {
    tokens,
    _x402: { amount: "1", currency: "USDT" },
  };

  res.writeHead(200, {
    "Content-Type": "application/json",
    "X-X402-Price": "1",
    "X-X402-Currency": "USDT",
    ...corsHeaders(),
  });
  res.end(JSON.stringify(payload));
}

const server = http.createServer(async (req, res) => {
  if (req.method === "OPTIONS") {
    res.writeHead(204, corsHeaders());
    return res.end();
  }

  if (req.url.startsWith("/api/trending")) {
    return handleTrending(req, res);
  }

  // Health check
  if (req.url === "/" || req.url === "/health") {
    res.writeHead(200, corsHeaders());
    return res.end(JSON.stringify({ status: "ok", name: "FabricX API" }));
  }

  res.writeHead(404);
  res.end("not found");
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`FabricX API running on port ${PORT}`);
});
