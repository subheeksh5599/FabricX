const X402_RATE = "1";
const X402_CURRENCY = "USDT";
const X402_RECIPIENT = process.env.X402_RECIPIENT || "0x76092779c93a9a303aD2Ad2C4606415040CDa79d";

function checkPayment(req, res) {
  const hasPayment = req.headers["x-x402-payment"] || req.query._x402_payment;
  if (hasPayment) return true;
  res.status(402).json({
    accepts: [{
      currency: X402_CURRENCY, amount: X402_RATE, chainId: 1952,
      recipient: X402_RECIPIENT,
      description: "Pay per API call via x402. Include X-X402-Payment header with proof.",
    }],
  });
  return false;
}

export default async function handler(req, res) {
  if (!checkPayment(req, res)) return;
  if (req.method !== "POST") return res.status(405).json({ error: "Use POST" });
  try {
    const { maxSpend, expiresIn, allowedActions, taskId } = req.body || {};
    if (!maxSpend || !expiresIn || !allowedActions) {
      return res.status(400).json({ error: "Missing: maxSpend, expiresIn, allowedActions" });
    }
    const sessionId = "0x" + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join("");
    const expiresAt = Math.floor(Date.now() / 1000) + Number(expiresIn);
    res.setHeader("X-X402-Price", X402_RATE);
    res.setHeader("X-X402-Currency", X402_CURRENCY);
    res.status(200).json({ sessionId, maxSpend, expiresAt, expiresIn, allowedActions, taskId: taskId || null, status: "provisioned" });
  } catch (err) { res.status(500).json({ error: err.message }); }
}
