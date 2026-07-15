export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed. Use POST." });
  }

  try {
    const { aspAddress, score, comment } = req.body || {};
    if (!aspAddress || !score || !comment) {
      return res.status(400).json({ error: "Missing required fields: aspAddress, score, comment" });
    }
    if (score < 1 || score > 5) {
      return res.status(400).json({ error: "Score must be 1-5" });
    }

    res.setHeader("X-X402-Price", "1");
    res.setHeader("X-X402-Currency", "USDT");
    res.status(200).json({
      aspAddress,
      score,
      comment,
      status: "submitted",
      message: "Rating submitted to FabricX ASPReputation contract",
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
