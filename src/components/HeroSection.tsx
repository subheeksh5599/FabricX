import { ArrowRight } from "lucide-react";

const brands = [
  {
    name: "Stripe",
    style: {
      fontFamily: "Georgia, serif",
      fontWeight: 700,
      letterSpacing: "-0.02em",
      fontSize: "15px",
    },
  },
  {
    name: "Coinbase",
    style: {
      fontFamily: "Arial, sans-serif",
      fontWeight: 900,
      letterSpacing: "0.08em",
      fontSize: "13px",
      textTransform: "uppercase" as const,
    },
  },
  {
    name: "Uniswap",
    style: {
      fontFamily: "'Trebuchet MS', sans-serif",
      fontWeight: 600,
      letterSpacing: "0.01em",
      fontSize: "15px",
      fontStyle: "italic",
    },
  },
  {
    name: "Aave",
    style: {
      fontFamily: "'Courier New', monospace",
      fontWeight: 700,
      letterSpacing: "0.12em",
      fontSize: "13px",
      textTransform: "uppercase" as const,
    },
  },
  {
    name: "Compound",
    style: {
      fontFamily: "Palatino, 'Book Antiqua', serif",
      fontWeight: 400,
      letterSpacing: "-0.01em",
      fontSize: "16px",
    },
  },
  {
    name: "MakerDAO",
    style: {
      fontFamily: "Impact, 'Arial Narrow', sans-serif",
      fontWeight: 400,
      letterSpacing: "0.04em",
      fontSize: "14px",
    },
  },
  {
    name: "Chainlink",
    style: {
      fontFamily: "Verdana, sans-serif",
      fontWeight: 700,
      letterSpacing: "-0.03em",
      fontSize: "13px",
    },
  },
];

function HeroSection() {
  return (
    <div className="absolute inset-0">
      <video
        autoPlay
        muted
        loop
        playsInline
        className="object-cover absolute inset-0 w-full h-full"
        src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260423_161253_c72b1869-400f-45ed-ac0c-52f68c2ed5bd.mp4"
      />

      <div className="relative z-10 flex flex-col items-start justify-end h-full p-12 pb-12">
        <h1
          className="text-black text-5xl md:text-6xl font-medium leading-tight max-w-xl mb-4"
          style={{ letterSpacing: "-0.04em" }}
        >
          Agents That
          <br />
          Move Money
        </h1>
        <p
          className="text-black/70 text-base md:text-lg max-w-md mb-8 leading-relaxed"
          style={{ fontFamily: "'Inter', ui-sans-serif, system-ui, sans-serif" }}
        >
            The connective tissue of the on-chain economy. Autonomous agents
            that move capital with zero friction using scoped, programmable
            permissions.
        </p>

        <button
          type="button"
          className="inline-flex items-center gap-3 bg-black text-white text-base md:text-lg font-medium pl-8 pr-2 py-2 rounded-full hover:bg-gray-800 transition-colors duration-200"
        >
          Launch Agent
          <span className="bg-white rounded-full p-2">
            <ArrowRight className="w-5 h-5 text-black" />
          </span>
        </button>

        <div className="mt-16 w-full max-w-md overflow-hidden">
          <style>{`
            .marquee-track {
              display: flex;
              width: max-content;
              animation: marquee 22s linear infinite;
            }
          `}</style>
          <div className="marquee-track">
            {[...brands, ...brands].map((brand, i) => (
              <span
                key={i}
                className="mx-7 shrink-0 text-black/60 whitespace-nowrap"
                style={brand.style}
              >
                {brand.name}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default HeroSection;
