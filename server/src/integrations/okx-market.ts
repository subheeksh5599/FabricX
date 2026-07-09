const OKX_API_BASE = "https://www.okx.com";

export interface TokenInfo {
  symbol: string;
  name: string;
  price: string;
  change24h: string;
  volume24h: string;
  marketCap: string;
  chain: string;
}

export async function getTrendingTokens(limit: number = 10): Promise<TokenInfo[]> {
  const res = await fetch(`${OKX_API_BASE}/api/v5/market/tickers?instType=SPOT`);
  if (!res.ok) throw new Error(`OKX Market API error: ${res.status}`);

  const data = (await res.json()) as {
    data: Array<{
      instId: string;
      last: string;
      open24h: string;
      vol24h: string;
    }>;
  };

  return data.data.slice(0, limit).map((t) => ({
    symbol: t.instId.replace("-USDT", ""),
    name: t.instId.replace("-USDT", ""),
    price: t.last,
    change24h: (
      ((parseFloat(t.last) - parseFloat(t.open24h)) / parseFloat(t.open24h)) *
      100
    ).toFixed(2),
    volume24h: t.vol24h,
    marketCap: "N/A",
    chain: "X Layer",
  }));
}

export interface TokenPrice {
  symbol: string;
  price: string;
  change24h: string;
  high24h: string;
  low24h: string;
  volume24h: string;
}

export async function getTokenPrice(symbol: string): Promise<TokenPrice> {
  const res = await fetch(
    `${OKX_API_BASE}/api/v5/market/ticker?instId=${symbol.toUpperCase()}-USDT`
  );
  if (!res.ok) throw new Error(`OKX Market API error: ${res.status}`);

  const data = (await res.json()) as {
    data: Array<{
      instId: string;
      last: string;
      open24h: string;
      high24h: string;
      low24h: string;
      vol24h: string;
    }>;
  };

  const t = data.data[0];
  return {
    symbol: t.instId.replace("-USDT", ""),
    price: t.last,
    change24h: (
      ((parseFloat(t.last) - parseFloat(t.open24h)) / parseFloat(t.open24h)) *
      100
    ).toFixed(2),
    high24h: t.high24h,
    low24h: t.low24h,
    volume24h: t.vol24h,
  };
}
