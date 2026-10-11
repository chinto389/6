# Arc Agent — ERC-8004 Identity + x402 Payments

> Built with Arc Studio - money-powered apps in minutes

This is the **project memory** - what Arc Studio remembers about building this app. It helps future agents (or humans) understand and extend the project.

---

## What This App Does

An onchain agent identity and monetization app. Users connect a wallet on Arc Testnet, register an ERC-8004 agent NFT (costs ~0.006 USDC in gas), and immediately have a payable API endpoint protected by Circle Gateway x402 Nanopayments ($0.01 USDC per call). The agent dashboard shows the onchain agent ID, registry reference, USDC balance, reputation score (once feedback is given), and x402 endpoint details.

## ERC-8004 Registries (Arc Testnet)

- IdentityRegistry: `0x8004A818BFB912233c491871b3d84c89A494BD9e`
- ReputationRegistry: `0x8004B663056A597Dffe9eCcC1965A193B7388713`
- ValidationRegistry: `0x8004Cb1BF31DAf7788923b405b754f57acEB4272`

## x402 Paid Endpoint

- POST `/agent/summarize` — $0.01 USDC via Circle Gateway Nanopayments
- Server: `server/index.ts` (Express on port 3001)
- Frontend proxied via Vite: `/agent/*` → `http://localhost:3001`
- Seller address: set `VITE_AGENT_WALLET` in `.env`

## Tech Stack

- Frontend: React 18, Vite, TypeScript, Tailwind CSS
- Web3: wagmi v2, viem v2, ConnectKit
- Contracts: Solidity 0.8.28 + Foundry. Sources in `contracts/`, unit tests in `contracts/test/*.t.sol`. Build with `bun run contracts:build` (`forge build`), test with `bun run contracts:test` (`forge test`).
- Wallet: injected (MetaMask, etc.)
- Chain: Arc Testnet (Chain ID: 5042002, imported from `viem/chains`)
- Token: USDC (6 decimals) (Address: 0x3600000000000000000000000000000000000000, Chain: Arc Testnet)
- Toasts: Sonner

## Key Files

- `src/App.tsx` - Main application logic
- `src/components/` - UI components
- `src/config.ts` - wagmi config (chains, connectors, transports)

## To Run

```bash
bun install
bun run dev
```
