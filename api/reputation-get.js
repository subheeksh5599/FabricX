export default async function handler(req, res) {
  try {
    const { aspAddress } = req.query;
    if (!aspAddress) {
      return res.status(400).json({ error: "Missing required param: aspAddress" });
    }

    res.setHeader("X-X402-Price", "1");
    res.setHeader("X-X402-Currency", "USDT");
    res.status(200).json({
      aspAddress,
      averageRating: 0,
      ratingCount: 0,
      message: "Query the ASPReputation contract on X Layer testnet for live data",
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
