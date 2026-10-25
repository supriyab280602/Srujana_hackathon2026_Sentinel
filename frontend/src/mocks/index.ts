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

export const MOCK_TRANSACTIONS: import('../types').Transaction[] = [
  {
    id: 'TXN-99410',
    sender_account_id: 'ACC-7749',
    receiver_account_id: 'ACC-4410',
    amount: 125000,
    currency: 'USD',
    timestamp: '2026-10-24 14:10:02',
    channel: 'wire',
    location_country: 'US',
    ip_address: '194.26.29.11',
    risk_score: 94,
    risk_severity: 'critical',
    status: 'flagged',
    flagged_rule: 'CROSS_ACCOUNT_FANOUT_BURST'
  },
  {
    id: 'TXN-99388',
    sender_account_id: 'ACC-7749',
    receiver_account_id: 'ACC-5128',
    amount: 95000,
    currency: 'USD',
    timestamp: '2026-10-24 14:11:15',
    channel: 'wire',
    location_country: 'US',
    ip_address: '194.26.29.11',
    risk_score: 89,
    risk_severity: 'critical',
    status: 'flagged',
    flagged_rule: 'RAPID_DISBURSEMENT_BURST'
  },
  {
    id: 'TXN-99342',
    sender_account_id: 'ACC-4410',
    receiver_account_id: 'ACC-9901',
    amount: 124200,
    currency: 'USD',
    timestamp: '2026-10-24 14:12:40',
    channel: 'crypto',
    location_country: 'CY',
    ip_address: '89.208.29.4',
    risk_score: 91,
    risk_severity: 'critical',
    status: 'flagged',
    flagged_rule: 'OFFSHORE_MULE_EXIT'
  },
  {
    id: 'TXN-99301',
    sender_account_id: 'ACC-5128',
    receiver_account_id: 'ACC-9901',
    amount: 94100,
    currency: 'USD',
    timestamp: '2026-10-24 14:13:02',
    channel: 'crypto',
    location_country: 'CY',
    ip_address: '89.208.29.4',
    risk_score: 94,
    risk_severity: 'critical',
    status: 'flagged',
    flagged_rule: 'CONVERGENCE_SIPHON'
  },
  {
    id: 'TXN-99215',
    sender_account_id: 'ACC-3120',
    receiver_account_id: 'ACC-8812',
    amount: 48500,
    currency: 'USD',
    timestamp: '2026-10-24 11:14:22',
    channel: 'wire',
    location_country: 'GB',
    ip_address: '185.220.101.5',
    risk_score: 78,
    risk_severity: 'high',
    status: 'under_review',
    flagged_rule: 'CIRCULAR_ROUTING_SUSPECT'
  },
  {
    id: 'TXN-99120',
    sender_account_id: 'ACC-1082',
    receiver_account_id: 'ACC-7749',
    amount: 240000,
    currency: 'USD',
    timestamp: '2026-10-24 03:22:18',
    channel: 'wire',
    location_country: 'DE',
    ip_address: '45.154.255.8',
    risk_score: 58,
    risk_severity: 'medium',
    status: 'under_review',
    flagged_rule: 'OFF_HOURS_VOLUME_SPIKE'
  },
  {
    id: 'TXN-99044',
    sender_account_id: 'ACC-7749',
    receiver_account_id: 'ACC-1102',
    amount: 1500,
    currency: 'USD',
    timestamp: '2026-10-24 14:05:00',
    channel: 'ach',
    location_country: 'US',
    ip_address: '72.14.201.88',
    risk_score: 18,
    risk_severity: 'low',
    status: 'cleared',
    flagged_rule: 'NORMAL_ROUTINE'
  },
  {
    id: 'TXN-98912',
    sender_account_id: 'ACC-3120',
    receiver_account_id: 'LIQUIDITY-POOL-4',
    amount: 15200,
    currency: 'USD',
    timestamp: '2026-10-24 09:44:00',
    channel: 'card',
    location_country: 'US',
    ip_address: '66.249.66.1',
    risk_score: 22,
    risk_severity: 'low',
    status: 'cleared'
  }
];

export const MOCK_ACCOUNTS: Record<string, import('../types').AccountProfile> = {
  'ACC-7749': {
    id: 'ACC-7749',
    account_holder: 'Apex Meridian Ventures LLC',
    account_type: 'business',
    status: 'under_investigation',
    risk_tier: 'critical',
    risk_score: 94,
    balance: 24500,
    currency: 'USD',
    created_at: '2025-08-14',
    kyc_status: 'verified',
    location: 'Wilmington, Delaware, USA',
    ip_reputation: 'datacenter_proxy',
    device_count: 4,
    behavioral: {
      account_id: 'ACC-7749',
      avg_daily_volume: 12500,
      typical_hours: ['09:00 - 17:00 UTC'],
      frequent_counterparties: ['ACC-1102', 'ACC-2099', 'PAYROLL-SYSTEM'],
      anomalies_detected: 9,
      confidence_score: 0.91
    },
    recent_transactions: [
      {
        id: 'TXN-99410',
        sender_account_id: 'ACC-7749',
        receiver_account_id: 'ACC-4410',
        amount: 125000,
        currency: 'USD',
        timestamp: '2026-10-24 14:10:02',
        channel: 'wire',
        risk_score: 94,
        risk_severity: 'critical',
        status: 'flagged'
      },
      {
        id: 'TXN-99388',
        sender_account_id: 'ACC-7749',
        receiver_account_id: 'ACC-5128',
        amount: 95000,
        currency: 'USD',
        timestamp: '2026-10-24 14:11:15',
        channel: 'wire',
        risk_score: 89,
        risk_severity: 'critical',
        status: 'flagged'
      },
      {
        id: 'TXN-99044',
        sender_account_id: 'ACC-7749',
        receiver_account_id: 'ACC-1102',
        amount: 1500,
        currency: 'USD',
        timestamp: '2026-10-24 14:05:00',
        channel: 'ach',
        risk_score: 18,
        risk_severity: 'low',
        status: 'cleared'
      }
    ]
  },
  'ACC-3120': {
    id: 'ACC-3120',
    account_holder: 'Helios Global Logistics Ltd',
    account_type: 'business',
    status: 'under_investigation',
    risk_tier: 'high',
    risk_score: 78,
    balance: 142000,
    currency: 'USD',
    created_at: '2024-11-03',
    kyc_status: 'verified',
    location: 'London, United Kingdom',
    ip_reputation: 'tor_exit',
    device_count: 2,
    behavioral: {
      account_id: 'ACC-3120',
      avg_daily_volume: 45000,
      typical_hours: ['08:00 - 20:00 UTC'],
      frequent_counterparties: ['ACC-8812', 'LIQUIDITY-POOL-4'],
      anomalies_detected: 4,
      confidence_score: 0.86
    },
    recent_transactions: [
      {
        id: 'TXN-99215',
        sender_account_id: 'ACC-3120',
        receiver_account_id: 'ACC-8812',
        amount: 48500,
        currency: 'USD',
        timestamp: '2026-10-24 11:14:22',
        channel: 'wire',
        risk_score: 78,
        risk_severity: 'high',
        status: 'under_review'
      }
    ]
  },
  'ACC-4410': {
    id: 'ACC-4410',
    account_holder: 'Rapid Nexus Clearing Co',
    account_type: 'mule_suspect',
    status: 'suspended',
    risk_tier: 'critical',
    risk_score: 82,
    balance: 1200,
    currency: 'USD',
    created_at: '2026-09-20',
    kyc_status: 'flagged',
    location: 'Nicosia, Cyprus',
    ip_reputation: 'datacenter_proxy',
    device_count: 1,
    behavioral: {
      account_id: 'ACC-4410',
      avg_daily_volume: 800,
      typical_hours: ['14:00 - 15:00 UTC'],
      frequent_counterparties: ['ACC-7749', 'ACC-9901'],
      anomalies_detected: 7,
      confidence_score: 0.75
    },
    recent_transactions: [
      {
        id: 'TXN-99342',
        sender_account_id: 'ACC-4410',
        receiver_account_id: 'ACC-9901',
        amount: 124200,
        currency: 'USD',
        timestamp: '2026-10-24 14:12:40',
        channel: 'crypto',
        risk_score: 91,
        risk_severity: 'critical',
        status: 'flagged'
      }
    ]
  }
};

export const MOCK_INVESTIGATION_CASES: import('../types').InvestigationCase[] = [
  {
    id: 'CASE-2026-081',
    case_title: 'Structured Fanout via Rapid ACH and Crypto Gateway',
    target_account: 'ACC-7749',
    opened_at: '2026-10-24 14:15 UTC',
    investigator: 'AJ / Tier-2 AML Desk',
    priority: 'critical',
    status: 'in_progress',
    summary: 'Corroborating high velocity layering burst across newly activated mule accounts with immediate exit to offshore crypto destination.',
    notes_history: [
      {
        author: 'System Sentinel Watchdog',
        timestamp: '2026-10-24 14:10:05',
        note: 'Triggered rule CROSS_ACCOUNT_FANOUT_BURST. Risk score elevated to 94.',
        action: 'AUTO_ALERT_FILED'
      },
      {
        author: 'Investigator AJ',
        timestamp: '2026-10-24 14:18:22',
        note: 'Initiated Graph Replay. Observed 8 rapid disbursements structured beneath $10k SAR threshold, converged to ACC-9901.',
        action: 'IN_TRIAGE'
      }
    ],
    evidence_items: [
      {
        id: 'EV-1',
        type: 'velocity',
        title: '1,420% Hourly Volume Surge',
        description: 'Account moved $220k in 4 minutes vs 30-day baseline average of $12.5k daily.',
        confidence: 0.98
      },
      {
        id: 'EV-2',
        type: 'graph_loop',
        title: 'Multi-Hop Convergence Topology',
        description: 'Funds dispatched to ACC-4410 and ACC-5128 simultaneously, reuniting at ACC-9901 within 180 seconds.',
        confidence: 0.94
      },
      {
        id: 'EV-3',
        type: 'ip_proxy',
        title: 'High-Risk Datacenter Proxy IP',
        description: 'Originating IP 194.26.29.11 belongs to known commercial anonymizer VPN pool.',
        confidence: 0.91
      }
    ],
    related_alerts: ['ALT-8902']
  },
  {
    id: 'CASE-2026-079',
    case_title: 'Layering Loop Multi-Hop Verification',
    target_account: 'ACC-3120',
    opened_at: '2026-10-24 11:30 UTC',
    investigator: 'Investigator Unit',
    priority: 'high',
    status: 'completed',
    summary: 'Confirmed legitimate inter-subsidiary liquidity sweep after corporate treasury compliance document validation.',
    verdict: 'FALSE_POSITIVE_RESOLVED',
    notes_history: [
      {
        author: 'Investigator Elena',
        timestamp: '2026-10-24 12:05:00',
        note: 'Verified company treasury memorandum and signed board resolution for liquidity sweep. Marked as False Positive.',
        action: 'VERDICT_RESOLVED'
      }
    ],
    evidence_items: [
      {
        id: 'EV-4',
        type: 'document',
        title: 'Corporate Treasury Resolution',
        description: 'Authorized overnight sweep between UK and German trading subsidiaries.',
        confidence: 0.99
      }
    ],
    related_alerts: ['ALT-8899']
  }
];

