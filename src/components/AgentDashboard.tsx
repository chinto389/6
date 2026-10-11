import { useReadContract } from 'wagmi';
import { erc20Abi } from 'viem';
import { ExternalLink, BadgeCheck, Fingerprint, Zap, Copy } from 'lucide-react';
import { buildTxExplorerUrl } from '@/onchain-facts';
import { toast } from 'sonner';

const ARC_TESTNET_ID = 5042002;
const IDENTITY_REGISTRY = '0x8004A818BFB912233c491871b3d84c89A494BD9e' as const;
const REPUTATION_REGISTRY = '0x8004B663056A597Dffe9eCcC1965A193B7388713' as const;
const USDC_ADDRESS = '0x3600000000000000000000000000000000000000' as const;


const reputationAbi = [
  {
    type: 'function' as const,
    name: 'getClients',
    stateMutability: 'view' as const,
    inputs: [{ name: 'agentId', type: 'uint256' }],
    outputs: [{ name: '', type: 'address[]' }],
  },
  {
    type: 'function' as const,
    name: 'getSummary',
    stateMutability: 'view' as const,
    inputs: [
      { name: 'agentId', type: 'uint256' },
      { name: 'clientAddresses', type: 'address[]' },
      { name: 'tag1', type: 'string' },
      { name: 'tag2', type: 'string' },
    ],
    outputs: [
      { name: 'count', type: 'uint64' },
      { name: 'summaryValue', type: 'int128' },
      { name: 'summaryValueDecimals', type: 'uint8' },
    ],
  },
] as const;

interface Props {
  agentId: bigint;
  registerTxHash: string;
  ownerAddress: `0x${string}`;
}

function shortAddr(addr: string) {
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

function copyToClipboard(value: string, label: string) {
  void navigator.clipboard.writeText(value).then(() => toast.success(`${label} copied`));
}

export function AgentDashboard({ agentId, registerTxHash, ownerAddress }: Props) {
  const { data: clients } = useReadContract({
    address: REPUTATION_REGISTRY,
    abi: reputationAbi,
    functionName: 'getClients',
    args: [agentId],
    chainId: ARC_TESTNET_ID,
  });

  const { data: summary } = useReadContract({
    address: REPUTATION_REGISTRY,
    abi: reputationAbi,
    functionName: 'getSummary',
    args: [agentId, clients && clients.length > 0 ? (clients as `0x${string}`[]) : [ownerAddress], '', ''],
    chainId: ARC_TESTNET_ID,
    query: { enabled: true },
  });

  const { data: ownerBalance } = useReadContract({
    address: USDC_ADDRESS,
    abi: erc20Abi,
    functionName: 'balanceOf',
    args: [ownerAddress],
    chainId: ARC_TESTNET_ID,
  });

  const usdcBalance = ownerBalance !== undefined
    ? (Number(ownerBalance) / 1e6).toFixed(4)
    : '—';

  const reputationScore = summary && (clients?.length ?? 0) > 0
    ? Number(summary[1]) / Math.pow(10, Number(summary[2]))
    : null;

  const agentIdStr = agentId.toString();
  const registryRef = `eip155:${ARC_TESTNET_ID}:${IDENTITY_REGISTRY}`;

  return (
    <div className="space-y-4">
      {/* Identity card */}
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] backdrop-blur-sm p-6 space-y-4">
        <div className="flex items-center gap-2">
          <BadgeCheck size={18} className="text-[var(--accent)]" />
          <h2 className="display text-lg font-semibold text-[var(--ink)]">Agent Identity</h2>
          <span className="ml-auto rounded-full bg-[var(--success)]/15 px-2.5 py-0.5 text-xs font-medium text-[var(--success)]">
            Registered
          </span>
        </div>

        <div className="grid gap-3">
          <Row
            icon={<Fingerprint size={14} />}
            label="Agent ID"
            value={agentIdStr}
            onCopy={() => copyToClipboard(agentIdStr, 'Agent ID')}
          />
          <Row
            icon={<Fingerprint size={14} />}
            label="Registry"
            value={shortAddr(IDENTITY_REGISTRY)}
            onCopy={() => copyToClipboard(IDENTITY_REGISTRY, 'Registry address')}
          />
          <Row
            icon={<Fingerprint size={14} />}
            label="ERC-8004 Ref"
            value={`${registryRef.slice(0, 28)}…`}
            onCopy={() => copyToClipboard(registryRef, 'Registry reference')}
          />
          <Row
            icon={<Fingerprint size={14} />}
            label="Owner"
            value={shortAddr(ownerAddress)}
            onCopy={() => copyToClipboard(ownerAddress, 'Owner address')}
          />
        </div>

        <a
          href={buildTxExplorerUrl(ARC_TESTNET_ID, registerTxHash)}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-xs text-[var(--accent)] hover:underline"
        >
          View registration tx <ExternalLink size={11} />
        </a>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3">
        <StatCard
          label="USDC Balance"
          value={`$${usdcBalance}`}
          sub="Arc Testnet"
        />
        <StatCard
          label="Reputation"
          value={reputationScore !== null ? reputationScore.toFixed(1) : '—'}
          sub={`${clients?.length ?? 0} reviews`}
        />
        <StatCard
          label="x402 Price"
          value="$0.01"
          sub="per call"
        />
      </div>

      {/* x402 endpoint card */}
      <X402Card />
    </div>
  );
}

function Row({
  icon,
  label,
  value,
  onCopy,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  onCopy?: () => void;
}) {
  return (
    <div className="flex items-center justify-between rounded-xl bg-[var(--surface-muted)] px-4 py-2.5">
      <div className="flex items-center gap-2 text-[var(--muted)]">
        {icon}
        <span className="text-xs uppercase tracking-widest font-medium">{label}</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="mono text-sm text-[var(--ink)]">{value}</span>
        {onCopy && (
          <button onClick={onCopy} className="text-[var(--subtle)] hover:text-[var(--ink)] transition-colors">
            <Copy size={12} />
          </button>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 text-center">
      <p className="text-xs uppercase tracking-widest text-[var(--subtle)]">{label}</p>
      <p className="display mt-1 text-xl font-semibold text-[var(--ink)] tabular-nums">{value}</p>
      <p className="text-xs text-[var(--muted)] mt-0.5">{sub}</p>
    </div>
  );
}

function X402Card() {
  const endpoint = '/agent/summarize';
  const curlExample = `curl -X POST http://localhost:3001${endpoint} \\
  -H 'Content-Type: application/json' \\
  -d '{"topic":"governance proposals"}'`;

  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] backdrop-blur-sm p-6 space-y-4">
      <div className="flex items-center gap-2">
        <Zap size={18} className="text-[var(--accent)]" />
        <h2 className="display text-lg font-semibold text-[var(--ink)]">x402 Paid Endpoint</h2>
      </div>

      <div className="space-y-2">
        <p className="text-sm text-[var(--muted)]">
          POST <span className="mono text-[var(--ink)]">/agent/summarize</span> returns HTTP 402 until
          the caller pays <span className="font-semibold">$0.01 USDC</span> via Circle Gateway Nanopayments.
        </p>

        <div className="rounded-xl bg-[var(--surface-muted)] p-4">
          <p className="text-xs uppercase tracking-widest text-[var(--subtle)] mb-2">Try it</p>
          <pre className="mono text-xs text-[var(--ink-2)] whitespace-pre-wrap break-all leading-relaxed">
            {curlExample}
          </pre>
          <button
            onClick={() => copyToClipboard(curlExample, 'curl command')}
            className="mt-2 flex items-center gap-1.5 text-xs text-[var(--accent)] hover:underline"
          >
            <Copy size={11} /> Copy curl
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3 pt-1">
          <InfoPill label="Protocol" value="x402 / EIP-3009" />
          <InfoPill label="Facilitator" value="Circle Gateway" />
          <InfoPill label="Chain" value="Arc Testnet" />
          <InfoPill label="Settlement" value="Batched USDC" />
        </div>
      </div>
    </div>
  );
}

function InfoPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-[var(--surface-muted)] px-3 py-2">
      <p className="text-xs uppercase tracking-widest text-[var(--subtle)]">{label}</p>
      <p className="text-sm font-medium text-[var(--ink)] mt-0.5">{value}</p>
    </div>
  );
}
