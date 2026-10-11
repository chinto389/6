import { useState } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useSwitchChain } from 'wagmi';
import { parseEventLogs } from 'viem';
import { CheckCircle, ExternalLink, Loader2, AlertCircle } from 'lucide-react';
import { buildTxExplorerUrl } from '@/onchain-facts';
import { toast } from 'sonner';

const ARC_TESTNET_ID = 5042002;

const IDENTITY_REGISTRY = '0x8004A818BFB912233c491871b3d84c89A494BD9e' as const;

const identityAbi = [
  {
    type: 'function' as const,
    name: 'register',
    stateMutability: 'nonpayable' as const,
    inputs: [{ name: 'agentURI', type: 'string' }],
    outputs: [{ name: 'agentId', type: 'uint256' }],
  },
  {
    type: 'event' as const,
    name: 'Registered',
    inputs: [
      { name: 'agentId', type: 'uint256', indexed: true },
      { name: 'agentURI', type: 'string', indexed: false },
      { name: 'owner', type: 'address', indexed: true },
    ],
  },
] as const;

interface Props {
  onRegistered: (agentId: bigint, txHash: string) => void;
}

function parseOnchainError(err: unknown): string {
  const msg = (err as Error)?.message?.toLowerCase() ?? '';
  if (msg.includes('user rejected') || msg.includes('denied')) return 'Transaction cancelled.';
  if (msg.includes('insufficient')) return 'Insufficient USDC balance. Use the faucet to get test USDC.';
  if (msg.includes('reverted')) return 'Transaction reverted. Check your wallet is on Arc Testnet.';
  return 'Transaction failed. Please try again.';
}

export function AgentRegistration({ onRegistered }: Props) {
  const { address, isConnected, chainId } = useAccount();
  const { switchChain, isPending: isSwitching } = useSwitchChain();

  const [agentName, setAgentName] = useState('');
  const [agentDescription, setAgentDescription] = useState('');
  const [endpoint, setEndpoint] = useState('');

  const isWrongChain = isConnected && chainId !== ARC_TESTNET_ID;

  const { writeContract, data: hash, isPending, error: writeError } = useWriteContract();
  const { isLoading: isConfirming, isSuccess, data: receipt } = useWaitForTransactionReceipt({ hash });

  const agentURI = (() => {
    if (!agentName) return '';
    const card = {
      type: 'https://eips.ethereum.org/EIPS/eip-8004#registration-v1',
      name: agentName,
      description: agentDescription,
      services: endpoint
        ? [{ name: 'REST', endpoint, version: '1.0.0' }]
        : [],
      x402Support: !!endpoint,
      active: true,
      supportedTrust: ['reputation', 'crypto-economic'],
    };
    return `data:application/json;base64,${btoa(JSON.stringify(card))}`;
  })();

  const handleRegister = () => {
    if (!agentName.trim()) {
      toast.error('Agent name is required.');
      return;
    }
    writeContract(
      {
        address: IDENTITY_REGISTRY,
        abi: identityAbi,
        functionName: 'register',
        args: [agentURI],
        chainId: ARC_TESTNET_ID,
      },
      {
        onSuccess: () => toast.info('Waiting for confirmation…'),
        onError: (err) => toast.error(parseOnchainError(err)),
      },
    );
  };

  // Parse agentId from receipt once confirmed
  if (isSuccess && receipt && hash) {
    try {
      const logs = parseEventLogs({ abi: identityAbi, eventName: 'Registered', logs: receipt.logs });
      if (logs.length > 0) {
        const agentId = logs[0].args.agentId;
        // Defer state update outside render
        setTimeout(() => onRegistered(agentId, hash), 0);
      }
    } catch {
      // already notified
    }
  }

  if (!isConnected) {
    return (
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 text-center">
        <p className="text-[var(--muted)] text-sm">Connect your wallet to register an agent.</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] backdrop-blur-sm p-6 space-y-5">
      <h2 className="display text-lg font-semibold text-[var(--ink)]">Register Agent Identity</h2>
      <p className="text-sm text-[var(--muted)]">
        Mints an ERC-8004 token on Arc Testnet. Gas is paid in USDC (~0.006 USDC).
      </p>

      {isWrongChain && (
        <div className="flex items-center gap-3 rounded-xl border border-[var(--danger)]/30 bg-[var(--danger)]/10 px-4 py-3">
          <AlertCircle size={16} className="text-[var(--danger)] shrink-0" />
          <span className="text-sm text-[var(--danger)]">Wrong network — you need Arc Testnet.</span>
          <button
            onClick={() => switchChain({ chainId: ARC_TESTNET_ID })}
            disabled={isSwitching}
            className="ml-auto rounded-lg bg-[var(--danger)] px-3 py-1 text-xs font-medium text-white hover:opacity-90 disabled:opacity-50"
          >
            {isSwitching ? 'Switching…' : 'Switch'}
          </button>
        </div>
      )}

      <div className="space-y-3">
        <label className="block">
          <span className="text-xs font-medium uppercase tracking-widest text-[var(--subtle)]">Agent Name *</span>
          <input
            value={agentName}
            onChange={(e) => setAgentName(e.target.value)}
            placeholder="e.g. Arc Research Agent"
            className="mt-1.5 w-full rounded-xl border border-[var(--border)] bg-[var(--surface-muted)] px-4 py-2.5 text-sm text-[var(--ink)] placeholder:text-[var(--subtle)] focus:border-[var(--accent)] focus:outline-none"
          />
        </label>

        <label className="block">
          <span className="text-xs font-medium uppercase tracking-widest text-[var(--subtle)]">Description</span>
          <textarea
            value={agentDescription}
            onChange={(e) => setAgentDescription(e.target.value)}
            placeholder="What does this agent do?"
            rows={2}
            className="mt-1.5 w-full rounded-xl border border-[var(--border)] bg-[var(--surface-muted)] px-4 py-2.5 text-sm text-[var(--ink)] placeholder:text-[var(--subtle)] focus:border-[var(--accent)] focus:outline-none resize-none"
          />
        </label>

        <label className="block">
          <span className="text-xs font-medium uppercase tracking-widest text-[var(--subtle)]">Service Endpoint (optional)</span>
          <input
            value={endpoint}
            onChange={(e) => setEndpoint(e.target.value)}
            placeholder="https://your-agent.example.com/summarize"
            className="mt-1.5 w-full rounded-xl border border-[var(--border)] bg-[var(--surface-muted)] px-4 py-2.5 text-sm text-[var(--ink)] placeholder:text-[var(--subtle)] focus:border-[var(--accent)] focus:outline-none"
          />
        </label>
      </div>

      {/* CTA */}
      {!isSuccess ? (
        <button
          onClick={handleRegister}
          disabled={isPending || isConfirming || isWrongChain || !agentName.trim()}
          className="w-full rounded-xl bg-[var(--accent)] px-6 py-3 text-sm font-semibold text-white hover:bg-[var(--accent-hover)] transition-colors disabled:opacity-40 flex items-center justify-center gap-2"
        >
          {(isPending || isConfirming) ? (
            <>
              <Loader2 size={15} className="animate-spin" />
              {isPending ? 'Confirm in wallet…' : 'Registering…'}
            </>
          ) : 'Register on Arc Testnet'}
        </button>
      ) : (
        <div className="flex items-center gap-3 rounded-xl border border-[var(--success)]/30 bg-[var(--success)]/10 px-4 py-3">
          <CheckCircle size={16} className="text-[var(--success)] shrink-0" />
          <span className="text-sm text-[var(--success)] font-medium">Agent registered!</span>
          {hash && (
            <a
              href={buildTxExplorerUrl(ARC_TESTNET_ID, hash)}
              target="_blank"
              rel="noopener noreferrer"
              className="ml-auto flex items-center gap-1 text-xs text-[var(--accent)] hover:underline"
            >
              View tx <ExternalLink size={11} />
            </a>
          )}
        </div>
      )}

      {writeError && (
        <p className="text-xs text-[var(--danger)]">{parseOnchainError(writeError)}</p>
      )}

      <p className="text-xs text-[var(--subtle)] mono break-all">
        Caller: {address}
      </p>
    </div>
  );
}
