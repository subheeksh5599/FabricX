<p align="center">
  <img src="public/favicon.svg" alt="FabricX" width="80">
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Network-X_Layer_Testnet-0C0C0D?style=for-the-badge&logo=ethereum">
  <img src="https://img.shields.io/badge/Protocol-ERC--4337-2B2644?style=for-the-badge">
  <img src="https://img.shields.io/badge/Monetization-x402-1A1A1A?style=for-the-badge">
  <img src="https://img.shields.io/badge/MCP-Server-2B2644?style=for-the-badge">
</p>

<p align="center">
  <img src="https://img.shields.io/badge/build-passing-brightgreen?style=flat-square">
  <img src="https://img.shields.io/badge/tests-13%2F13-brightgreen?style=flat-square">
  <img src="https://img.shields.io/badge/contracts-Solidity%200.8.25-blue?style=flat-square">
  <img src="https://img.shields.io/badge/license-MIT-yellow?style=flat-square">
</p>

<h1 align="center">FabricX</h1>
<h3 align="center"><em>The Secure Execution Fabric.<br>Scoped session keys for AI agents.</em></h3>

<p align="center">
  <strong>A permissioned execution layer that provisions scoped session keys to AI agents — cryptographically bounded by max spend, time limit, and allowed actions. Never trusted. Always bounded. Built for the OKX.AI Genesis Hackathon.</strong>
</p>

<p align="center">
  <a href="https://fabricx-ten.vercel.app"><strong>🔗 Live Demo</strong></a> &bull;
  <a href="https://github.com/subheeksh5599/FabricX"><strong>📦 GitHub</strong></a> &bull;
  <a href="#the-problem">Problem</a> &bull;
  <a href="#the-solution">Solution</a> &bull;
  <a href="#architecture">Architecture</a> &bull;
  <a href="#quick-start">Quick Start</a> &bull;
  <a href="#contracts">Contracts</a> &bull;
  <a href="#mcp-tools">MCP Tools</a> &bull;
  <a href="#roadmap">Roadmap</a> &bull;
  <a href="#faq">FAQ</a>
</p>

---

## The Problem

AI agents are about to manage billions in on-chain value. But today, every agent that executes a trade holds your private key — or nothing at all. There is no middle ground.

| Problem | Impact |
|---------|--------|
| **All-or-nothing access** | Agents either get your full private key (catastrophic if compromised) or can't transact at all |
| **No spend boundaries** | An agent with a key can drain your entire wallet — there's no per-task budget enforcement |
| **No time-bound access** | Once you give an agent a key, it has permanent access until you manually revoke |
| **No action whitelisting** | An agent authorized to swap tokens can also bridge, stake, or transfer — unlimited blast radius |
| **No monetization layer** | ASPs (Agent Service Providers) have no built-in way to charge for API calls — they build custom billing from scratch |
| **Fragmented tooling** | Every agent framework has its own auth model — no standard for "scoped on-chain execution" |

---

## The Solution

FabricX introduces **scoped session keys** — cryptographically bounded credentials that let AI agents execute on X Layer without ever exposing the user's private key. Each session key is an on-chain struct with hard limits enforced by the EVM itself.

```
User posts task ──> ASP agent bids & wins ──> FabricX provisions session key
       │                    │                           │
       │              maxSpend: 5 OKB            expiresAt: +1 hour
       │                                         actions: ["swap"]
       │                                                    │
       └──── Payment settles on X Layer ◄── Agent executes autonomously
```

### What you get

- **Scoped session keys** — Every agent gets a cryptographically bounded key: max spend, expiry, and whitelisted actions encoded on-chain
- **On-chain validation** — The X Layer EVM enforces limits. No server-side trust required. The contract says no → the transaction reverts
- **MCP-native** — Five typed tools (`get_trending_tokens`, `get_token_price`, `get_swap_quote`, `swap_tokens`, `create_session`) that plug into any MCP-compatible agent
- **x402 monetization** — Every API call carries an `X-X402-Price` header. ASPs earn per call. Revenue is built into the protocol, not bolted on
- **X Layer (Chain 1952)** — Deployed on X Layer testnet with OKX DEX aggregator integration for best-route swap execution
- **Smart account compatible** — FabricXAccount is an ERC-4337 smart account that delegates execution through the SessionKeyManager

---

## Live Demo

**Production URL:** [https://fabricx-ten.vercel.app](https://fabricx-ten.vercel.app)

### Try the API

```bash
# Get trending tokens
curl -s https://fabricx-ten.vercel.app/api/trending?limit=5 | jq

# Get OKB price
curl -s https://fabricx-ten.vercel.app/api/price?symbol=OKB | jq

# Get a swap quote (OKB → USDT)
curl -s "https://fabricx-ten.vercel.app/api/swap-quote?fromTokenAddress=0xEeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE&toTokenAddress=0x...&amount=1000000000000000000" | jq

# Provision a session key
curl -s -X POST https://fabricx-ten.vercel.app/api/session \
  -H "Content-Type: application/json" \
  -d '{"maxSpend":"5","expiresIn":3600,"allowedActions":["swap"]}' | jq
```

All responses include `X-X402-Price: 1` and `X-X402-Currency: USDT` headers for automatic payment settlement.

---

## Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                        OKX.AI Platform                            │
│  ┌──────────┐    ┌──────────────┐    ┌─────────────────────────┐ │
│  │   User   │───>│  ASP Agent   │───>│    FabricX MCP Server   │ │
│  │  posts   │    │  bids & wins │    │  ┌───────────────────┐  │ │
│  │  task    │    │              │    │  │ get_trending      │  │ │
│  └──────────┘    └──────┬───────┘    │  │ get_token_price   │  │ │
│                         │            │  │ get_swap_quote    │  │ │
│                         │            │  │ swap_tokens       │  │ │
│                         │            │  │ create_session    │  │ │
│                         │            │  └───────────────────┘  │ │
│                         │            └───────────┬─────────────┘ │
└─────────────────────────┼────────────────────────┼───────────────┘
                          │                        │
              ┌───────────▼──────────┐  ┌──────────▼───────────┐
              │   X Layer Testnet    │  │    OKX DEX Aggregator │
              │   (Chain ID 1952)    │  │    + OKX Market API   │
              │                      │  │                       │
              │  ┌────────────────┐  │  │  • Swap quotes        │
              │  │ SessionKey     │  │  │  • Best route         │
              │  │ Manager        │  │  │  • Price feeds        │
              │  │                │  │  │  • Trending tokens    │
              │  │ createSession  │  │  │                       │
              │  │ validateSession│  │  └───────────────────────┘
              │  │ recordSpend    │  │
              │  │ revokeSession  │  │
              │  └────────────────┘  │
              │                      │
              │  ┌────────────────┐  │
              │  │ FabricXAccount │  │
              │  │ (ERC-4337)     │  │
              │  │                │  │
              │  │ executeFrom    │  │
              │  │ Session        │  │
              │  └────────────────┘  │
              └──────────────────────┘
```

### Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, TypeScript 6, Vite 8, Tailwind CSS 4, Lucide Icons |
| Smart Contracts | Solidity 0.8.25, Hardhat, OpenZeppelin (ECDSA) |
| MCP Server | `@modelcontextprotocol/sdk`, Zod, Viem v2.55 |
| Chain | X Layer Testnet (Chain ID 1952), OKB native currency |
| DEX Integration | OKX DEX Aggregator API v5 |
| Market Data | OKX Market API v5 |
| Monetization | x402 protocol (payment headers on every response) |
| Deployment | Vercel (frontend + API routes), Hardhat (contracts) |

---

## Quick Start

### Prerequisites

- Node.js 18+
- npm

### 1. Clone and install

```bash
git clone https://github.com/subheeksh5599/FabricX.git
cd FabricX

# Frontend
npm install

# Smart contracts
cd contracts && npm install && cd ..

# MCP server
cd server && npm install && cd ..
```

### 2. Configure environment

```bash
cp .env.example .env
# Edit .env with your X Layer testnet RPC, private key, OKX API credentials
```

### 3. Build & test

```bash
# Build frontend
npm run build

# Compile & test contracts (13 tests, all passing)
npm run contracts:compile
npm run contracts:test

# Build MCP server
npm run server:build
```

### 4. Deploy contracts (optional)

```bash
npm run contracts:deploy
# Copies deployed addresses → update SESSION_KEY_MANAGER_ADDRESS in .env
```

### 5. Run dev server

```bash
npm run dev          # → http://localhost:5173
```

### 6. Run MCP server

```bash
npm run server:start  # Starts on stdio (MCP transport)
```

---

## Contracts

### Deployed Addresses (X Layer Testnet)

| Phase | Contract | Address |
|-------|----------|---------|
| 1 | SessionKeyManager | `0xb9d40b7d02c8855d7d1638991fa3af151d16f6a8` |
| 1 | FabricXAccount | `0xec852c51da5acaad40cd29fe29ba687190d8d9e1` |
| 2 | SessionKeyManagerV2 | `0xf167652096d8972170a6fee5ed31bd6bf19afcfd` |
| 4 | ASPReputation | `0x69b4d283af09d9d80aec92cb0782c4f020bb3b54` |
| 4 | SLAEnforcement | `0x79e040142312cea58da5f930818cc33eb25f9ad8` |
| 4 | EscrowPayments | `0xdd907baff577fbb8033a7fa51e15aea7db4ee5eb` |

All deployed from `0x7609...a79d` — [view all on X Layer Explorer](https://www.okx.com/web3/explorer/xlayer-testnet/address/0x76092779c93a9a303aD2Ad2C4606415040CDa79d)

### Phase 3 — Multi-Chain (Deployed)

Same deterministic addresses across all chains from deployer `0x7609...a79d` nonce 0:

| Chain | Chain ID | SessionKeyManager | FabricXAccount |
|-------|----------|-------------------|----------------|
| X Layer Testnet | 1952 | `0xf1b32d46...` | `0x61314ce9...` |
| Ethereum Sepolia | 11155111 | `0xdaaa7d3a...` | `0x119dbff5...` |
| OP Sepolia | 11155420 | `0xdaaa7d3a...` | `0x119dbff5...` |
| Base Sepolia | 84532 | `0xdaaa7d3a...` | `0x119dbff5...` |

Deploy to any EVM chain with one command:
```bash
npm run contracts:deploy:arbitrum  # Arbitrum Sepolia (needs faucet)
npm run contracts:deploy:base       # Base Sepolia ✅ deployed
npm run contracts:deploy:op         # OP Sepolia ✅ deployed

### SessionKeyManager

On-chain registry for scoped session keys. Deployed on X Layer testnet.

```
struct Session {
    address owner;          // FabricXAccount that owns this session
    uint256 maxSpend;       // Maximum OKB the agent can spend
    uint256 spendSoFar;     // Cumulative spend tracked on-chain
    uint256 expiresAt;      // Unix timestamp after which session is invalid
    bytes32[] allowedActions; // Whitelisted action hashes (keccak256("swap"), etc.)
    bool isActive;          // Can be revoked by owner
}
```

| Function | Access | Description |
|----------|--------|-------------|
| `createSession(sessionId, account, maxSpend, expiresAt, allowedActions)` | Public | Provision a new scoped session |
| `validateSession(sessionId, amount, action)` | View | Check if session is active, not expired, within spend limit, and action is allowed |
| `recordSpend(sessionId, amount)` | Public | Record cumulative spend against a session |
| `revokeSession(sessionId)` | Owner-only | Deactivate a session immediately |
| `getSession(sessionId)` | View | Return full session struct |
| `isActive(sessionId)` | View | Check active + not expired |

### FabricXAccount

ERC-4337-compatible smart account. Delegates execution through the SessionKeyManager.

| Function | Description |
|----------|-------------|
| `executeFromSession(sessionId, to, value, data, action)` | Execute an arbitrary call from an active session with action validation |
| `addSessionKey(sessionId, maxSpend, expiresAt, allowedActions)` | Owner adds a new session key |
| `revokeSessionKey(sessionId)` | Owner revokes a session key |
| `isSessionActive(sessionId)` | Check if a session is active |

### Test Coverage

```
13 passing (3s)

FabricXAccount
  ✔ sets the correct owner and session manager
  ✔ allows owner to add a session key
  ✔ allows owner to revoke a session key
  ✔ rejects non-owner adding a session key
  ✔ accepts ETH via receive
  ✔ isSessionActive returns true for active session

SessionKeyManager
  ✔ creates a session with correct parameters
  ✔ validates an allowed action
  ✔ rejects an action not in the allowlist
  ✔ rejects spend exceeding maxSpend
  ✔ records spend incrementally
  ✔ revokes a session
  ✔ isActive returns true for active session and false for revoked
```

---

## MCP Tools

Add FabricX to your agent's MCP config:

```json
{
  "mcpServers": {
    "fabricx": {
      "command": "node",
      "args": ["server/dist/index.js"],
      "cwd": "/path/to/FabricX"
    }
  }
}
```

| Tool | Description | Phase | x402 Price |
|------|-------------|-------|------------|
| `get_trending_tokens` | Fetch real-time trending tokens from OKX spot market | 1 | 0.001 OKB |
| `get_token_price` | Get current price and 24h stats for a token | 1 | 0.001 OKB |
| `get_swap_quote` | Get a swap quote from OKX DEX aggregator (read-only) | 1 | 0.001 OKB |
| `swap_tokens` | Execute a token swap on X Layer via OKX DEX (requires scoped session) | 1 | 0.001 OKB |
| `create_session` | Provision a new scoped session key for an agent task | 1 | 0.001 OKB |
| `bridge_tokens` | Bridge tokens cross-chain via OKX Bridge (requires scoped session) | 2 | 0.005 OKB |
| `rate_asp` | Rate an Agent Service Provider on-chain (1-5 stars) | 4 | 0.001 OKB |
| `get_asp_reputation` | Get an ASP's on-chain reputation score | 4 | 0.001 OKB |
| `create_escrow` | Create an escrow payment for a task | 4 | 0.001 OKB |
| `release_escrow` | Release escrow payment to ASP after completion | 4 | 0.001 OKB |

All tools return `_x402` metadata in the response with `amount` and `currency` fields.

---

## API Routes (Vercel Serverless)

| Route | Method | Phase | Description |
|-------|--------|-------|-------------|
| `/api/trending?limit=10` | GET | 1 | Trending tokens from OKX |
| `/api/price?symbol=OKB` | GET | 1 | Token price and 24h stats |
| `/api/swap-quote?fromTokenAddress=...&toTokenAddress=...&amount=...` | GET | 1 | DEX swap quote |
| `/api/session` | POST | 1 | Provision a session key |
| `/api/bridge` | POST | 2 | Initiate cross-chain bridge |
| `/api/reputation` | POST | 4 | Submit ASP rating |
| `/api/reputation-get?aspAddress=...` | GET | 4 | Get ASP reputation |
| `/api/escrow` | POST | 4 | Create escrow payment |

All routes include `X-X402-Price` and `X-X402-Currency` response headers.

---

## Project Structure

```
FabricX/
├── src/                     # React frontend
│   ├── components/          # Navbar, Hero, Info, BackedBy, UseCases, CTA, Footer
│   └── index.css            # Tailwind + TT Norms Pro
├── contracts/               # Solidity (Hardhat)
│   ├── src/                 # SessionKeyManager.sol, FabricXAccount.sol
│   ├── test/                # 13 tests (all passing)
│   └── script/deploy.ts     # X Layer testnet deploy
├── server/                  # MCP server
│   └── src/                 # index.ts, integrations/, contracts/, wallet.ts
├── api/                     # Vercel serverless functions
│   ├── session.js
│   ├── swap-quote.js
│   ├── price.js
│   └── trending.js
├── public/                  # Static assets (favicon, fonts)
└── dist/                    # Production build
```

---

## Security

- **On-chain enforcement** — Spend limits, expiry, and action whitelists are enforced by the EVM, not by a trusted server
- **No private key exposure** — Agents never see the user's private key; they operate within scoped sessions only
- **Deterministic session IDs** — `bytes32` session IDs prevent collision or replay
- **Revocable** — Sessions can be revoked instantly by the owner via `revokeSession`
- **No upgradeability** — Contracts are non-upgradeable (no proxy pattern) to eliminate admin key risk
- **Simulation-safe** — When `PRIVATE_KEY` is not set, the MCP server returns simulated sessions (development mode)

---

## Roadmap

| Phase | What | Status |
|-------|------|--------|
| **Phase 1** — Hackathon MVP | Scoped session keys, MCP server, OKX DEX integration, x402 monetization | ✅ Done |
| **Phase 2** — Expanded Actions | Multi-token spend tracking, gas abstraction, bridge tool, SessionKeyManagerV2 | ✅ Done |
| **Phase 3** — Multi-chain | Deployed to Sepolia, OP Sepolia, Base Sepolia; deterministic addresses | ✅ Done |
| **Phase 4** — Agent Marketplace | On-chain ASP reputation, SLA enforcement, escrow-based task payments | ✅ Done |

---

## Team

| Name | Role | Links |
|------|------|-------|
| **Subheeksh** | Solo Developer — Smart Contracts, MCP Server, Frontend, Architecture | [GitHub](https://github.com/subheeksh5599) · [X](https://x.com/KomariS18774) |

Built solo for the **OKX.AI Genesis Hackathon** — Track: AI Agent Infrastructure.

---

## FAQ

<details>
<summary><strong>Why session keys instead of just giving agents API keys?</strong></summary>

API keys are bearer tokens — anyone with the key can call the API. Session keys are on-chain structs with hard EVM-enforced limits on max spend, expiry time, and allowed actions. If an agent goes rogue, the contract itself blocks the transaction. No server-side trust required.
</details>

<details>
<summary><strong>What happens when a session expires?</strong></summary>

The `validateSession` function checks `block.timestamp > expiresAt`. Any transaction attempted after expiry reverts at the contract level. The user can also revoke a session early via `revokeSession`.
</details>

<details>
<summary><strong>How does x402 monetization work?</strong></summary>

Every MCP tool response and API route includes `X-X402-Price` and `X-X402-Currency` headers. An x402-compatible client (or payment gateway) reads these headers and settles payment automatically. ASPs earn per API call without building custom billing.
</details>

<details>
<summary><strong>Is this mainnet-ready?</strong></summary>

Currently deployed on X Layer testnet (Chain ID 1952). Contracts are covered by 13 passing tests but not externally audited. Do not use with real funds.
</details>

<details>
<summary><strong>Can I add custom actions beyond "swap"?</strong></summary>

Yes. The `allowedActions` array in `createSession` accepts any `bytes32[]`. Common actions: `keccak256("swap")`, `keccak256("bridge")`, `keccak256("stake")`. The validateSession function checks the action hash against the allowlist.
</details>

<details>
<summary><strong>What chains are supported?</strong></summary>

Currently X Layer testnet (1952). The contracts are EVM-compatible (Solidity 0.8.25, Cancun EVM) and can be deployed to any EVM chain. The OKX DEX integration is X Layer-specific but can be swapped for any DEX aggregator.
</details>

<details>
<summary><strong>How does the MCP server handle missing credentials?</strong></summary>

Gracefully. If `PRIVATE_KEY` is not set, `create_session` returns a simulated session (useful for development). If OKX API credentials are missing, read-only tools still work (public market endpoints). Swap execution requires full credentials.
</details>

---

## Powered by

<p align="center">
  <strong><a href="https://www.okx.com/web3">OKX Web3</a></strong> — X Layer, DEX Aggregator, and Market API<br>
  <strong><a href="https://www.okx.com/ai">OKX.AI</a></strong> — Agent platform for the on-chain economy<br>
  <em>Built for the OKX.AI Genesis Hackathon — AI Agent Infrastructure Track</em>
</p>

---

## License

MIT. Build whatever you want with it.
