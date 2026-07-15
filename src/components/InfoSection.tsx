import { ArrowRight } from "lucide-react";

function InfoSection() {
  return (
    <section id="features" className="bg-[#F5F5F5] px-6 py-24">
      <div className="max-w-[88rem] mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-16 items-start">
          <div>
            <h2
              className="text-black text-4xl md:text-5xl font-medium leading-tight mb-8"
              style={{ letterSpacing: "-0.03em" }}
            >
              Meet FabricX.
            </h2>
            <button
              type="button"
              className="inline-flex items-center gap-3 bg-black text-white text-base font-medium pl-8 pr-2 py-2 rounded-full hover:bg-gray-800 transition-colors duration-200"
            >
              Discover it
              <span className="bg-white rounded-full p-2">
                <ArrowRight className="w-5 h-5 text-black" />
              </span>
            </button>
          </div>
          <p className="text-black/70 text-2xl md:text-3xl leading-relaxed">
            FabricX provisions scoped session keys that let AI agents execute
            token swaps, query markets, and settle on X Layer — all without
            ever exposing the user's private key.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div
            className="rounded-2xl p-7 min-h-80 flex flex-col justify-between lg:col-span-2"
            style={{
              backgroundImage:
                "url(https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20260423_164207_f243351d-ed59-48ec-83a0-a5e996bdbe3c.png&w=1280&q=85)",
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          >
            <h3
              className="text-black text-2xl font-medium leading-snug"
              style={{ letterSpacing: "-0.02em" }}
            >
              Scoped Session Keys
            </h3>
            <p className="text-black/70 text-base max-w-xs mt-4">
              Every agent gets a cryptographically bounded key: max spend,
              expiry, and whitelisted actions enforced by the X Layer EVM.
            </p>
          </div>

          <div className="bg-[#2B2644] rounded-2xl p-7 min-h-80 flex flex-col justify-between">
            <h3 className="text-white text-2xl font-medium leading-snug">
              MCP Server,
              <br />
              native tools.
            </h3>
            <p className="text-white/60 text-base mt-4">
              Plug into any MCP-compatible agent. Trending tokens, swap quotes,
              on-chain execution — all through typed tool contracts.
            </p>
          </div>

          <div className="bg-[#2B2644] rounded-2xl p-7 min-h-80 flex flex-col justify-between">
            <h3 className="text-white text-2xl font-medium leading-snug">
              x402-powered
              <br />
              monetization
            </h3>
            <p className="text-white/60 text-base mt-4">
              Wrap any API call with usage-based settlement. Agents pay per
              call. ASPs earn per task. Revenue built in from day zero.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

export default InfoSection;
