export type RiskSeverity = 'low' | 'medium' | 'high' | 'critical';

export type AlertStatus = 'open' | 'under_review' | 'escalated' | 'dismissed' | 'resolved';

export interface Transaction {
  id: string;
  sender_account_id: string;
  receiver_account_id: string;
  amount: number;
  currency: string;
  timestamp: string;
  channel: 'wire' | 'ach' | 'crypto' | 'p2p' | 'card';
  location_country?: string;
  ip_address?: string;
  device_id?: string;
  risk_score?: number;
  risk_severity?: RiskSeverity;
  status?: 'cleared' | 'flagged' | 'blocked' | 'under_review';
  flagged_rule?: string;
}

export interface RiskFactor {
  name: string;
  weight: number;
  contribution: number;
  description: string;
}

export interface RiskAlert {
  id: string;
  transaction_id: string;
  account_id: string;
  severity: RiskSeverity;
  risk_score: number;
  status: AlertStatus;
  detection_rule: string;
  title: string;
  summary: string;
  created_at: string;
  factors: RiskFactor[];
}

export interface GraphNode {
  id: string;
  label: string;
  type: 'account' | 'external_entity' | 'flagged_mule';
  riskScore: number;
  balance?: number;
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  amount: number;
  timestamp: string;
  suspicious: boolean;
  hopIndex?: number;
}

export interface AccountNetworkData {
  account_id: string;
  nodes: GraphNode[];
  edges: GraphEdge[];
  max_hops: number;
  total_volume: number;
}

export interface InvestigationReviewSubmission {
  alert_id: string;
  decision: 'confirm_fraud' | 'false_positive' | 'needs_escalation';
  notes: string;
  investigator_id: string;
  tags: string[];
}

export interface BehavioralFingerprint {
  account_id: string;
  avg_daily_volume: number;
  typical_hours: string[];
  frequent_counterparties: string[];
  anomalies_detected: number;
  confidence_score: number;
}

export interface AccountProfile {
  id: string;
  account_holder: string;
  account_type: 'individual' | 'business' | 'fintech_custody' | 'mule_suspect';
  status: 'active' | 'suspended' | 'under_investigation' | 'closed';
  risk_tier: RiskSeverity;
  risk_score: number;
  balance: number;
  currency: string;
  created_at: string;
  kyc_status: 'verified' | 'pending' | 'flagged' | 'exempt';
  location: string;
  ip_reputation: 'clean' | 'datacenter_proxy' | 'tor_exit' | 'high_risk_asn';
  device_count: number;
  behavioral: BehavioralFingerprint;
  recent_transactions: Transaction[];
}

export interface InvestigationCase {
  id: string;
  case_title: string;
  target_account: string;
  opened_at: string;
  investigator: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'in_progress' | 'completed' | 'escalated';
  summary: string;
  verdict?: string;
  notes_history: Array<{
    author: string;
    timestamp: string;
    note: string;
    action: string;
  }>;
  evidence_items: Array<{
    id: string;
    type: 'velocity' | 'graph_loop' | 'ip_proxy' | 'device' | 'document';
    title: string;
    description: string;
    confidence: number;
  }>;
  related_alerts: string[];
}

