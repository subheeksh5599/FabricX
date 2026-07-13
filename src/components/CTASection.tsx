import { ArrowRight, Copy, Check } from "lucide-react";
import { useState } from "react";

const mcpConfig = `{
  "mcpServers": {
    "fabricx": {
      "command": "node",
      "args": ["server/dist/index.js"],
      "cwd": "/path/to/FabricX"
    }
  }
}`;

function CTASection() {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(mcpConfig);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section id="playground" className="bg-[#F5F5F5] px-6 py-24">
      <div className="max-w-[88rem] mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
          <div>
            <p className="text-black/60 text-sm mb-2">Get Started</p>
            <h2
              className="text-5xl md:text-6xl font-medium leading-none mb-6"
              style={{ letterSpacing: "-0.04em" }}
            >
              Launch Your Agent
            </h2>
            <p className="text-black/60 text-base leading-relaxed max-w-md mb-8">
              Add FabricX as an MCP server in your agent's configuration.
              Your agent gets access to trending tokens, swap quotes, and
              on-chain execution — all scoped by cryptographically bounded
              session keys.
            </p>

            <div className="flex flex-wrap gap-4">
              <a
                href="#"
                className="inline-flex items-center gap-3 bg-black text-white text-base font-medium pl-8 pr-2 py-2 rounded-full hover:bg-gray-800 transition-colors duration-200"
              >
                Read the Docs
                <span className="bg-white rounded-full p-2">
                  <ArrowRight className="w-5 h-5 text-black" />
                </span>
              </a>
              <button
                type="button"
                onClick={handleCopy}
                className="inline-flex items-center gap-2 border border-black/20 text-black text-base font-medium px-6 py-2.5 rounded-full hover:bg-black/5 transition-colors duration-200"
              >
                {copied ? (
                  <Check className="w-4 h-4 text-green-600" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
                {copied ? "Copied!" : "Copy MCP Config"}
              </button>
            </div>
          </div>

          <div className="bg-[#1A1A1A] rounded-2xl p-8 overflow-x-auto">
            <p className="text-white/50 text-xs mb-3 font-mono">
              ~/.cursor/mcp.json or ~/.codex/config.json
            </p>
            <pre className="text-white/80 text-sm font-mono leading-relaxed whitespace-pre">
              {mcpConfig}
            </pre>
          </div>
        </div>

        <div className="mt-20 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white rounded-2xl p-7">
            <div className="w-10 h-10 rounded-full bg-black/5 flex items-center justify-center mb-4">
              <span className="text-black font-bold text-lg">1</span>
            </div>
            <h3 className="text-black text-lg font-medium mb-2">Install</h3>
            <p className="text-black/60 text-sm leading-relaxed">
              Clone the repo, install dependencies, and configure your
              environment variables for X Layer testnet.
            </p>
          </div>
          <div className="bg-white rounded-2xl p-7">
            <div className="w-10 h-10 rounded-full bg-black/5 flex items-center justify-center mb-4">
              <span className="text-black font-bold text-lg">2</span>
            </div>
            <h3 className="text-black text-lg font-medium mb-2">Configure</h3>
            <p className="text-black/60 text-sm leading-relaxed">
              Add the FabricX MCP server to your agent's config. Five tools
              available immediately — trending, price, swap quotes, execution, sessions.
            </p>
          </div>
          <div className="bg-white rounded-2xl p-7">
            <div className="w-10 h-10 rounded-full bg-black/5 flex items-center justify-center mb-4">
              <span className="text-black font-bold text-lg">3</span>
            </div>
            <h3 className="text-black text-lg font-medium mb-2">Execute</h3>
            <p className="text-black/60 text-sm leading-relaxed">
              Your agent provisions a session key, queries markets, and
              executes swaps — all validated on-chain. Pay per call via x402.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

export default CTASection;
