/**
 * Arc Agent — paid API server
 * x402 Gateway Nanopayments protect /agent/summarize.
 * All payments arrive as gasless USDC on Arc Testnet.
 */
import express from 'express';
import cors from 'cors';
import { createGatewayMiddleware } from '@circle-fin/x402-batching/server';

const app = express();
app.use(express.json());
app.use(cors());

const PORT = 3001;

// Seller receive address — set VITE_AGENT_WALLET in .env
const sellerAddress = process.env.VITE_AGENT_WALLET as `0x${string}`;
if (!sellerAddress) {
  console.warn('[server] VITE_AGENT_WALLET is not set — payment gate will use zero address');
}

// Create Gateway middleware (gasless USDC nanopayments via Circle Gateway)
const gateway = createGatewayMiddleware({
  sellerAddress: sellerAddress ?? '0x0000000000000000000000000000000000000000',
});

// ─── health ──────────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: Date.now() });
});

// ─── agent card (public) ────────────────────────────────────────────────────
app.get('/agent/card', (_req, res) => {
  res.json({
    type: 'https://eips.ethereum.org/EIPS/eip-8004#registration-v1',
    name: 'Arc Research Agent',
    description: 'Summarizes governance proposals and onchain data for a fee.',
    services: [
      {
        name: 'REST',
        endpoint: `${process.env.VITE_AGENT_BASE_URL ?? 'http://localhost:3001'}/agent/summarize`,
        version: '1.0.0',
      },
    ],
    x402Support: true,
    active: true,
    supportedTrust: ['reputation', 'crypto-economic'],
  });
});

// ─── paid endpoint ────────────────────────────────────────────────────────────
// $0.01 USDC per call, settled via Circle Gateway Nanopayments
app.post(
  '/agent/summarize',
  gateway.require('$0.01'),
  (req, res) => {
    const { topic } = req.body as { topic?: string };
    if (!topic) {
      res.status(400).json({ error: 'topic is required in request body' });
      return;
    }

    // Production: call an LLM here. For the demo we return structured placeholder data.
    res.json({
      topic,
      summary: `Onchain summary for "${topic}": governance activity is stable with 3 active proposals, quorum at 62 %, and total voting power up 8 % week-over-week.`,
      generatedAt: new Date().toISOString(),
      paidWith: 'USDC via Circle Gateway Nanopayments',
    });
  },
);

app.listen(PORT, () => {
  console.log(`[server] Arc Agent API listening on http://localhost:${PORT}`);
  console.log(`[server] Seller address: ${sellerAddress ?? '(not set)'}`);
});
