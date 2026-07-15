export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed. Use POST." });
  }

  try {
    const { fromTokenAddress, toTokenAddress, amount, fromChain, toChain, sessionId } = req.body || {};
    if (!fromTokenAddress || !toTokenAddress || !amount || !sessionId) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    res.setHeader("X-X402-Price", "5");
    res.setHeader("X-X402-Currency", "USDT");
    res.status(200).json({
      bridgeId: "0x" + Array.from({ length: 64 }, () =>
        Math.floor(Math.random() * 16).toString(16)
      ).join(""),
      fromChain: fromChain || "1952",
      toChain: toChain || "1",
      fromTokenAddress,
      toTokenAddress,
      amount,
      sessionId,
      status: "initiated",
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
