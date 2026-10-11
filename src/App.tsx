import { useState } from 'react';
import { ConnectKitButton } from 'connectkit';
import { useAccount } from 'wagmi';
import { Bot } from 'lucide-react';
import { AgentRegistration } from './components/AgentRegistration';
import { AgentDashboard } from './components/AgentDashboard';

export default function App() {
  const { address, isConnected } = useAccount();
  const [agentId, setAgentId] = useState<bigint | null>(null);
  const [registerTxHash, setRegisterTxHash] = useState<string | null>(null);

  const handleRegistered = (id: bigint, txHash: string) => {
    setAgentId(id);
    setRegisterTxHash(txHash);
  };

  return (
    <div className="min-h-dvh" style={{ background: 'var(--bg-gradient)' }}>
      {/* Nav */}
      <header className="sticky top-0 z-10 border-b border-[var(--border)] backdrop-blur-md bg-[var(--bg)]/70">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2.5">
            <div className="flex size-8 items-center justify-center rounded-lg bg-[var(--accent)]">
              <Bot size={16} className="text-white" />
            </div>
            <span className="display font-semibold text-[var(--ink)] tracking-tight">Arc Agent</span>
          </div>
          <ConnectKitButton />
        </div>
      </header>

      {/* Body */}
      <main className="mx-auto max-w-2xl px-4 py-8 space-y-6">
        {/* Hero */}
        <div className="space-y-1.5">
          <h1 className="display text-2xl font-semibold text-[var(--ink)] tracking-tight text-balance">
            Onchain Agent Identity
          </h1>
          <p className="text-sm text-[var(--muted)] text-pretty max-w-md">
            Register your agent with ERC-8004 on Arc Testnet and expose a paid API endpoint
            protected by x402 Gateway Nanopayments.
          </p>
        </div>

        {/* Standards chips */}
        <div className="flex flex-wrap gap-2">
          {['ERC-8004 Identity', 'ERC-8004 Reputation', 'x402 Payments', 'Arc Testnet', 'USDC Gas'].map((tag) => (
            <span
              key={tag}
              className="rounded-full border border-[var(--border)] bg-[var(--surface)] px-3 py-1 text-xs font-medium text-[var(--ink-2)]"
            >
              {tag}
            </span>
          ))}
        </div>

        {/* Main content */}
        {!isConnected ? (
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] backdrop-blur-sm p-10 text-center space-y-4">
            <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-[var(--surface-muted)]">
              <Bot size={28} className="text-[var(--accent)]" />
            </div>
            <div>
              <p className="font-semibold text-[var(--ink)]">Connect your wallet</p>
              <p className="mt-1 text-sm text-[var(--muted)]">
                Connect to Arc Testnet to register an agent identity.
              </p>
            </div>
            <div className="flex justify-center">
              <ConnectKitButton label="Connect Wallet" />
            </div>
          </div>
        ) : agentId !== null && registerTxHash !== null ? (
          <AgentDashboard
            agentId={agentId}
            registerTxHash={registerTxHash}
            ownerAddress={address!}
          />
        ) : (
          <AgentRegistration onRegistered={handleRegistered} />
        )}

        {/* Info footer */}
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 space-y-3">
          <h3 className="display text-sm font-semibold text-[var(--ink)]">How it works</h3>
          <ol className="space-y-2 text-sm text-[var(--muted)] list-none">
            {[
              ['Register', 'Your wallet signs a transaction to mint an ERC-8004 agent NFT on Arc Testnet. Gas is ~0.006 USDC.'],
              ['Identity', 'Your agent card is stored onchain as a URI and is discoverable by any buyer agent.'],
              ['Get paid', 'The backend API at /agent/summarize returns HTTP 402 to unpaid callers. Paying $0.01 USDC via Circle Gateway unlocks the response.'],
              ['Reputation', 'After each job, clients call giveFeedback on the ERC-8004 Reputation Registry to build your onchain score.'],
            ].map(([title, body], i) => (
              <li key={i} className="flex gap-3">
                <span className="mono shrink-0 text-[var(--accent)] font-semibold tabular-nums">{i + 1}.</span>
                <span><span className="font-medium text-[var(--ink-2)]">{title} — </span>{body}</span>
              </li>
            ))}
          </ol>
        </div>
      </main>
    </div>
  );
}
