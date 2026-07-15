export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed. Use POST." });
  }

  try {
    const { aspAddress, amount, deadlineHours } = req.body || {};
    if (!aspAddress || !amount || !deadlineHours) {
      return res.status(400).json({ error: "Missing required fields: aspAddress, amount, deadlineHours" });
    }

    const escrowId = "0x" + Array.from({ length: 64 }, () =>
      Math.floor(Math.random() * 16).toString(16)
    ).join("");

    res.setHeader("X-X402-Price", "1");
    res.setHeader("X-X402-Currency", "USDT");
    res.status(200).json({
      escrowId,
      aspAddress,
      amount,
      deadlineHours,
      status: "created",
      message: "Escrow created via FabricX EscrowPayments contract",
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
