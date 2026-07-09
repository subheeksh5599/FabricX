export interface x402Config {
  pricePerCall: string;
  currency: string;
  recipient: string;
}

const DEFAULT_CONFIG: x402Config = {
  pricePerCall: "0.001",
  currency: "OKB",
  recipient: process.env.X402_RECIPIENT || "0x0000000000000000000000000000000000000000",
};

export function wrapWithx402<T>(
  handler: (...args: any[]) => Promise<T>,
  config: Partial<x402Config> = {}
): (...args: any[]) => Promise<T & { x402Payment: { amount: string; currency: string } }> {
  const cfg = { ...DEFAULT_CONFIG, ...config };
  return async (...args: any[]) => {
    const result = await handler(...args);
    return {
      ...result,
      x402Payment: { amount: cfg.pricePerCall, currency: cfg.currency },
    };
  };
}
