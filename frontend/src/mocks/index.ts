import { RiskAlert, AccountNetworkData, BehavioralFingerprint } from '../types';

export const MOCK_ALERTS: RiskAlert[] = [
  {
    id: 'ALT-8902',
    transaction_id: 'TXN-99410',
    account_id: 'ACC-7749',
    severity: 'critical',
    risk_score: 94,
    status: 'open',
    detection_rule: 'CROSS_ACCOUNT_FANOUT_BURST',
    title: 'Rapid High-Velocity Outflows to Unverified Accounts',
    summary: 'Account executed 8 consecutive wire transfers exceeding typical daily volume by 1,420% within 4 minutes.',
    created_at: new Date(Date.now() - 1000 * 60 * 18).toISOString(),
    factors: [
      { name: 'Velocity Delta', weight: 0.45, contribution: 42.3, description: '12 standard deviations above historical hourly norm' },
      { name: 'Geographic Mismatch', weight: 0.25, contribution: 23.5, description: 'IP originates from high-risk jurisdiction proxy' },
      { name: 'Multi-Hop Fanout', weight: 0.30, contribution: 28.2, description: 'Funds disbursed to newly registered mule accounts' }
    ]
  },
  {
    id: 'ALT-8899',
    transaction_id: 'TXN-99388',
    account_id: 'ACC-3120',
    severity: 'high',
    risk_score: 78,
    status: 'under_review',
    detection_rule: 'CIRCULAR_ROUTING_SUSPECT',
    title: 'Potential Layering Loop Detected',
    summary: 'Funds cycled through 3 intermediary accounts before returning to related entity wallet.',
    created_at: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    factors: [
      { name: 'Graph Cycle Ratio', weight: 0.50, contribution: 39.0, description: 'Closed loop transaction path detected in 2-hop radius' },
      { name: 'Rapid Turnover', weight: 0.30, contribution: 23.4, description: 'Holding period less than 45 seconds per hop' },
      { name: 'Amount Structuring', weight: 0.20, contribution: 15.6, description: 'Values split just beneath compliance thresholds' }
    ]
  },
  {
    id: 'ALT-8874',
    transaction_id: 'TXN-99120',
    account_id: 'ACC-1082',
    severity: 'medium',
    risk_score: 58,
    status: 'open',
    detection_rule: 'OFF_HOURS_VOLUME_SPIKE',
    title: 'Anomalous Nocturnal Transfer Spike',
    summary: 'Corporate account transferring large international wire at 03:22 AM local time.',
    created_at: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
    factors: [
      { name: 'Temporal Deviation', weight: 0.60, contribution: 34.8, description: 'Account has 0% history of transactions between 22:00-06:00' },
      { name: 'Device Unknown', weight: 0.40, contribution: 23.2, description: 'First login recorded from unrecognized browser fingerprint' }
    ]
  }
];

export const MOCK_NETWORK_DATA: AccountNetworkData = {
  account_id: 'ACC-7749',
  max_hops: 3,
  total_volume: 485000,
  nodes: [
    { id: 'ACC-7749', label: 'ACC-7749 (Target)', type: 'account', riskScore: 94, balance: 24500 },
    { id: 'ACC-4410', label: 'ACC-4410 (Intermediary)', type: 'flagged_mule', riskScore: 82, balance: 1200 },
    { id: 'ACC-5128', label: 'ACC-5128 (Intermediary)', type: 'flagged_mule', riskScore: 79, balance: 400 },
    { id: 'ACC-9901', label: 'ACC-9901 (Offshore Shell)', type: 'external_entity', riskScore: 88, balance: 98000 },
    { id: 'ACC-1102', label: 'ACC-1102 (Legitimate Vendor)', type: 'account', riskScore: 12, balance: 154000 }
  ],
  edges: [
    { id: 'e1', source: 'ACC-7749', target: 'ACC-4410', amount: 125000, timestamp: '14:10:02', suspicious: true, hopIndex: 1 },
    { id: 'e2', source: 'ACC-7749', target: 'ACC-5128', amount: 95000, timestamp: '14:11:15', suspicious: true, hopIndex: 1 },
    { id: 'e3', source: 'ACC-4410', target: 'ACC-9901', amount: 124200, timestamp: '14:12:40', suspicious: true, hopIndex: 2 },
    { id: 'e4', source: 'ACC-5128', target: 'ACC-9901', amount: 94100, timestamp: '14:13:02', suspicious: true, hopIndex: 2 },
    { id: 'e5', source: 'ACC-7749', target: 'ACC-1102', amount: 1500, timestamp: '14:05:00', suspicious: false, hopIndex: 1 }
  ]
};

export const MOCK_BEHAVIORAL_PROFILES: BehavioralFingerprint[] = [
  {
    account_id: 'ACC-7749',
    avg_daily_volume: 12500,
    typical_hours: ['09:00 - 17:00 UTC'],
    frequent_counterparties: ['ACC-1102', 'ACC-2099', 'PAYROLL-SYSTEM'],
    anomalies_detected: 9,
    confidence_score: 0.91
  },
  {
    account_id: 'ACC-3120',
    avg_daily_volume: 45000,
    typical_hours: ['08:00 - 20:00 UTC'],
    frequent_counterparties: ['ACC-8812', 'LIQUIDITY-POOL-4'],
    anomalies_detected: 4,
    confidence_score: 0.86
  }
];
