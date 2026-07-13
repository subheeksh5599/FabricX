function Footer() {
  return (
    <footer className="bg-[#1A1A1A] text-white/60 px-6 py-16">
      <div className="max-w-[88rem] mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">
          <div className="md:col-span-2">
            <h3 className="text-white text-xl font-medium mb-4">FabricX</h3>
            <p className="text-white/50 text-sm leading-relaxed max-w-sm">
              A permissioned execution layer for the OKX.AI agent economy.
              Scoped session keys, on-chain validation, x402 monetization.
              Built for the OKX.AI Genesis Hackathon.
            </p>
          </div>
          <div>
            <h4 className="text-white text-sm font-medium mb-3">Protocol</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="hover:text-white transition-colors">Docs</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Contracts</a></li>
              <li><a href="#" className="hover:text-white transition-colors">SDK</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Playground</a></li>
            </ul>
          </div>
          <div>
            <h4 className="text-white text-sm font-medium mb-3">Stack</h4>
            <ul className="space-y-2 text-sm">
              <li><span>X Layer (Chain 1952)</span></li>
              <li><span>ERC-4337 + MCP</span></li>
              <li><span>x402 Payments</span></li>
              <li><span>OKX DEX Aggregator</span></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <p className="text-white/40 text-sm">
            &copy; {new Date().getFullYear()} FabricX. Built for OKX.AI Genesis Hackathon.
          </p>
          <div className="flex items-center gap-6 text-sm">
            <a href="#" className="hover:text-white transition-colors">GitHub</a>
            <a href="#" className="hover:text-white transition-colors">X (Twitter)</a>
            <a href="#" className="hover:text-white transition-colors">Discord</a>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
