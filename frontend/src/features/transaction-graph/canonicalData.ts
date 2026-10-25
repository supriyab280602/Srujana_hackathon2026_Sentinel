import { GraphNode, GraphEdge } from '../../types';
import { ReplayEvent } from './types';
import { AccountNetworkData } from '../../types';

/**
 * CANONICAL SOURCE OF TRUTH: 8-Transaction Connected Demonstration Network
 *
 * Network Architecture:
 * - Origin / Source: Node 0 (ACC-7749)
 * - Intermediate Mule Ring:
 *     - Branch A: Node 1 (ACC-4410) -> Node 2 (ACC-5128), Node 4 (ACC-8812)
 *     - Branch B: Node 3 (ACC-3120) -> Node 6 (ACC-6204)
 * - Convergence & Exit:
 *     - Gateway: Node 5 (ACC-9901) receives funds from Node 2 and Node 4
 *     - Terminal Siphon: Node 5 (ACC-9901) -> Node 7 (ACC-9088 Shadow Shell)
 */

export interface CanonicalTransactionRecord {
  id: string;
  step: number;
  timestamp: string;
  sourceAccount: string;
  targetAccount: string;
  amount: number;
  currency: 'INR';
  channel: 'rtgs' | 'neft' | 'imps' | 'wire' | 'crypto' | 'swift';
  scoreAtEvent: number;
  flaggedHop: boolean;
  emergingPattern: string;
  hopIndex: number;
}

export const CANONICAL_TRANSACTIONS: CanonicalTransactionRecord[] = [
  {
    id: 'TXN-801',
    step: 1,
    timestamp: '14:02:10',
    sourceAccount: 'ACC-7749',
    targetAccount: 'ACC-4410',
    amount: 450000,
    currency: 'INR',
    channel: 'rtgs',
    scoreAtEvent: 45,
    flaggedHop: true,
    emergingPattern: 'Primary Structuring Disbursement (Branch A)',
    hopIndex: 1,
  },
  {
    id: 'TXN-802',
    step: 2,
    timestamp: '14:04:35',
    sourceAccount: 'ACC-7749',
    targetAccount: 'ACC-3120',
    amount: 380000,
    currency: 'INR',
    channel: 'neft',
    scoreAtEvent: 62,
    flaggedHop: true,
    emergingPattern: 'Secondary Parallel Disbursement (Branch B)',
    hopIndex: 1,
  },
  {
    id: 'TXN-803',
    step: 3,
    timestamp: '14:06:50',
    sourceAccount: 'ACC-4410',
    targetAccount: 'ACC-5128',
    amount: 225000,
    currency: 'INR',
    channel: 'imps',
    scoreAtEvent: 74,
    flaggedHop: true,
    emergingPattern: 'Downstream Mule Layering Split (Sub-Branch A1)',
    hopIndex: 2,
  },
  {
    id: 'TXN-804',
    step: 4,
    timestamp: '14:08:15',
    sourceAccount: 'ACC-4410',
    targetAccount: 'ACC-8812',
    amount: 220000,
    currency: 'INR',
    channel: 'imps',
    scoreAtEvent: 81,
    flaggedHop: true,
    emergingPattern: 'High-Velocity Fan-Out Fragmentation (Sub-Branch A2)',
    hopIndex: 2,
  },
  {
    id: 'TXN-805',
    step: 5,
    timestamp: '14:09:40',
    sourceAccount: 'ACC-3120',
    targetAccount: 'ACC-6204',
    amount: 375000,
    currency: 'INR',
    channel: 'wire',
    scoreAtEvent: 86,
    flaggedHop: true,
    emergingPattern: 'Branch B Direct Exit to Crypto Exchange',
    hopIndex: 2,
  },
  {
    id: 'TXN-806',
    step: 6,
    timestamp: '14:11:05',
    sourceAccount: 'ACC-5128',
    targetAccount: 'ACC-9901',
    amount: 222500,
    currency: 'INR',
    channel: 'crypto',
    scoreAtEvent: 91,
    flaggedHop: true,
    emergingPattern: 'Mule Convergence to Offshore Gateway (Path A1)',
    hopIndex: 3,
  },
  {
    id: 'TXN-807',
    step: 7,
    timestamp: '14:12:30',
    sourceAccount: 'ACC-8812',
    targetAccount: 'ACC-9901',
    amount: 218000,
    currency: 'INR',
    channel: 'crypto',
    scoreAtEvent: 95,
    flaggedHop: true,
    emergingPattern: 'Secondary Channel Reunion at Gateway (Path A2)',
    hopIndex: 3,
  },
  {
    id: 'TXN-808',
    step: 8,
    timestamp: '14:14:10',
    sourceAccount: 'ACC-9901',
    targetAccount: 'ACC-9088',
    amount: 438000,
    currency: 'INR',
    channel: 'swift',
    scoreAtEvent: 98,
    flaggedHop: true,
    emergingPattern: 'Final Layering Siphon to Offshore Shadow Shell',
    hopIndex: 4,
  },
];

/**
 * Account registry for entities participating in the 8-transaction network.
 */
export const CANONICAL_ACCOUNTS: Record<
  string,
  {
    label: string;
    type: GraphNode['type'];
    riskScore: number;
    balance: number;
    role: 'source' | 'intermediate' | 'destination';
  }
> = {
  'ACC-7749': {
    label: 'Node 0: ACC-7749 (Source Account)',
    type: 'account',
    riskScore: 94,
    balance: 2450000,
    role: 'source',
  },
  'ACC-4410': {
    label: 'Node 1: ACC-4410 (Mule Layer 1)',
    type: 'flagged_mule',
    riskScore: 82,
    balance: 45000,
    role: 'intermediate',
  },
  'ACC-5128': {
    label: 'Node 2: ACC-5128 (Mule Branch A)',
    type: 'flagged_mule',
    riskScore: 79,
    balance: 32000,
    role: 'intermediate',
  },
  'ACC-3120': {
    label: 'Node 3: ACC-3120 (Mule Branch B)',
    type: 'flagged_mule',
    riskScore: 74,
    balance: 18500,
    role: 'intermediate',
  },
  'ACC-8812': {
    label: 'Node 4: ACC-8812 (Rapid Transit)',
    type: 'flagged_mule',
    riskScore: 85,
    balance: 12400,
    role: 'intermediate',
  },
  'ACC-9901': {
    label: 'Node 5: ACC-9901 (Offshore Gateway)',
    type: 'external_entity',
    riskScore: 92,
    balance: 890000,
    role: 'destination',
  },
  'ACC-6204': {
    label: 'Node 6: ACC-6204 (Crypto Exchange)',
    type: 'external_entity',
    riskScore: 89,
    balance: 1450000,
    role: 'destination',
  },
  'ACC-9088': {
    label: 'Node 7: ACC-9088 (Shadow Shell Co)',
    type: 'external_entity',
    riskScore: 98,
    balance: 3120000,
    role: 'destination',
  },
};

/**
 * Derived Replay Events: guaranteed chronological ordering from step 1 (Node 0).
 */
export const CANONICAL_REPLAY_EVENTS: ReplayEvent[] = [...CANONICAL_TRANSACTIONS]
  .sort((a, b) => a.step - b.step || a.timestamp.localeCompare(b.timestamp))
  .map((t) => ({
    step: t.step,
    timestamp: t.timestamp,
    sourceAccount: t.sourceAccount,
    targetAccount: t.targetAccount,
    amount: t.amount,
    currency: t.currency,
    scoreAtEvent: t.scoreAtEvent,
    channel: t.channel,
    flaggedHop: t.flaggedHop,
    emergingPattern: t.emergingPattern,
  }));

/**
 * Derived Graph Nodes: all 8 connected accounts with role-based labels and metadata.
 */
export const CANONICAL_GRAPH_NODES: GraphNode[] = Object.entries(CANONICAL_ACCOUNTS).map(
  ([id, meta]) => ({
    id,
    label: meta.label,
    type: meta.type,
    riskScore: meta.riskScore,
    balance: meta.balance,
  })
);

/**
 * Derived Graph Edges: all 8 directed transactions with amounts and timestamps.
 */
export const CANONICAL_GRAPH_EDGES: GraphEdge[] = CANONICAL_TRANSACTIONS.map((t) => ({
  id: `e${t.step}`,
  source: t.sourceAccount,
  target: t.targetAccount,
  amount: t.amount,
  timestamp: t.timestamp,
  suspicious: t.flaggedHop,
  hopIndex: t.hopIndex,
}));

/**
 * Derived AccountNetworkData: canonical network representation for ACC-7749 scenario.
 */
export const CANONICAL_NETWORK_DATA: AccountNetworkData = {
  account_id: 'ACC-7749',
  max_hops: 4,
  total_volume: CANONICAL_TRANSACTIONS.reduce((sum, t) => sum + t.amount, 0),
  nodes: CANONICAL_GRAPH_NODES,
  edges: CANONICAL_GRAPH_EDGES,
};
