# FabricX

Permissioned on-chain execution layer for AI agents (OKX.AI Genesis Hackathon). See `README.md` for the full product overview, contract addresses, and MCP tool reference.

## Cursor Cloud specific instructions

The update script installs npm dependencies for the three JS packages (root frontend, `contracts/`, `server/`). Standard commands live in the `README.md` and the `scripts` blocks of each `package.json`; only non-obvious notes are captured here.

### Components and how to run them (dev)

- **Frontend (Vite + React)** — root package. `npm run dev` serves the marketing/playground site on `http://localhost:5173`. It is a static client app: it does NOT proxy or call the `/api/*` routes, so it renders fully without any backend, RPC, or credentials. `npm run lint` (oxlint) and `npm run build` also run with no external deps. Lint currently emits warnings (unused vars/expressions in `contracts/test/*`) but exits 0.
- **Smart contracts (`contracts/`, Hardhat)** — `npm run contracts:compile` downloads the Solidity 0.8.25 compiler on first run (needs network), then `npm run contracts:test` runs the suite fully in Hardhat's in-process network (34 passing). No RPC/private key needed for compile or test. The README mentions "13 tests" but the current suite has 34.
- **MCP server (`server/`)** — build first with `npm run server:build`, then `npm run server:start`. It communicates over **stdio (JSON-RPC), not an HTTP port**, so there is nothing to open in a browser; drive it by piping newline-delimited JSON-RPC to `node server/dist/index.js`. It degrades gracefully without credentials: with no `PRIVATE_KEY`, `create_session` returns a simulated session and read-only tools use public OKX endpoints; on-chain write tools (`swap_tokens`, `rate_asp`, escrow) require `PRIVATE_KEY` + reachable X Layer RPC.
- **Vercel API (`api/*.js`)** and **`server-standalone/`** — optional. Not served by `npm run dev`; run `api/` locally with `npx vercel dev` (Vercel CLI, not installed by default) or use the production deploy. `server-standalone` has no dependencies (`node server-standalone/index.js`). These are x402-payment-gated; add `?_x402_payment=1` to bypass for local testing.

### Environment / credentials

- Copy `.env.example` to `.env` for local config. Everything needed for frontend, lint, contract compile/test, and simulated MCP flows works with the placeholder `.env` (no real secrets). Real `PRIVATE_KEY` + OKX API keys are only needed for live on-chain swaps and DEX quotes. `DEEPSEEK_API_KEY` is listed in `.env.example` but is not referenced anywhere in code.
