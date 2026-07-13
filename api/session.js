export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed. Use POST." });
  }

  try {
    const { maxSpend, expiresIn, allowedActions, taskId } = req.body || {};

    if (!maxSpend || !expiresIn || !allowedActions) {
      return res.status(400).json({ error: "Missing required fields: maxSpend, expiresIn, allowedActions" });
    }

    const sessionId = `0x${Array.from({ length: 64 }, () =>
      Math.floor(Math.random() * 16).toString(16)
    ).join("")}`;

    const expiresAt = Math.floor(Date.now() / 1000) + Number(expiresIn);

    res.setHeader("X-X402-Price", "1");
    res.setHeader("X-X402-Currency", "USDT");
    res.status(200).json({
      sessionId,
      maxSpend,
      expiresAt,
      expiresIn,
      allowedActions,
      taskId: taskId || null,
      status: "provisioned",
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
