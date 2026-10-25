import {
  RiskAlert,
  AccountNetworkData,
  InvestigationReviewSubmission,
  Transaction,
  AccountProfile,
  InvestigationCase
} from '../types';
import {
  MOCK_ALERTS,
  MOCK_NETWORK_DATA,
  MOCK_BEHAVIORAL_PROFILES,
  MOCK_TRANSACTIONS,
  MOCK_ACCOUNTS,
  MOCK_INVESTIGATION_CASES
} from '../mocks';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';

export const apiService = {
  async getHealth(): Promise<{ status: string; service: string; timestamp: string }> {
    try {
      const res = await fetch(`${API_BASE}/health`);
      if (!res.ok) throw new Error('Health check failed');
      return await res.json();
    } catch {
      return { status: 'offline', service: 'sentinel-core', timestamp: new Date().toISOString() };
    }
  },

  async getAlerts(): Promise<RiskAlert[]> {
    try {
      const res = await fetch(`${API_BASE}/alerts`);
      if (!res.ok) throw new Error('Failed to fetch alerts from backend');
      return await res.json();
    } catch {
      return MOCK_ALERTS;
    }
  },

  async getAlertById(id: string): Promise<RiskAlert | undefined> {
    try {
      const res = await fetch(`${API_BASE}/alerts/${id}`);
      if (!res.ok) throw new Error('Alert not found');
      return await res.json();
    } catch {
      return MOCK_ALERTS.find(a => a.id === id);
    }
  },

  async getAccountNetwork(accountId: string): Promise<AccountNetworkData> {
    try {
      const res = await fetch(`${API_BASE}/accounts/${accountId}/network`);
      if (!res.ok) throw new Error('Failed to fetch network');
      return await res.json();
    } catch {
      return { ...MOCK_NETWORK_DATA, account_id: accountId };
    }
  },

  async getAccountProfile(accountId: string): Promise<AccountProfile | undefined> {
    try {
      const res = await fetch(`${API_BASE}/accounts/${accountId}`);
      if (!res.ok) throw new Error('Failed to fetch account profile');
      return await res.json();
    } catch {
      return MOCK_ACCOUNTS[accountId] || {
        id: accountId,
        account_holder: `Account Entity ${accountId}`,
        account_type: 'business',
        status: 'active',
        risk_tier: 'medium',
        risk_score: 52,
        balance: 65400,
        currency: 'USD',
        created_at: '2025-01-10',
        kyc_status: 'verified',
        location: 'New York, USA',
        ip_reputation: 'clean',
        device_count: 2,
        behavioral: {
          account_id: accountId,
          avg_daily_volume: 8500,
          typical_hours: ['09:00 - 18:00 UTC'],
          frequent_counterparties: ['ACC-1102'],
          anomalies_detected: 2,
          confidence_score: 0.88,
        },
        recent_transactions: MOCK_TRANSACTIONS.filter(
          t => t.sender_account_id === accountId || t.receiver_account_id === accountId
        )
      };
    }
  },

  async getTransactions(): Promise<Transaction[]> {
    try {
      const res = await fetch(`${API_BASE}/transactions`);
      if (!res.ok) throw new Error('Failed to fetch transactions');
      return await res.json();
    } catch {
      return MOCK_TRANSACTIONS;
    }
  },

  async getInvestigations(): Promise<InvestigationCase[]> {
    try {
      const res = await fetch(`${API_BASE}/investigations`);
      if (!res.ok) throw new Error('Failed to fetch investigations');
      return await res.json();
    } catch {
      return MOCK_INVESTIGATION_CASES;
    }
  },

  async getInvestigationById(id: string): Promise<InvestigationCase | undefined> {
    try {
      const res = await fetch(`${API_BASE}/investigations/${id}`);
      if (!res.ok) throw new Error('Investigation not found');
      return await res.json();
    } catch {
      return MOCK_INVESTIGATION_CASES.find(c => c.id === id);
    }
  },

  async submitInvestigationReview(id: string, review: InvestigationReviewSubmission) {
    try {
      const res = await fetch(`${API_BASE}/investigations/${id}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(review),
      });
      if (!res.ok) throw new Error('Review submission failed');
      return await res.json();
    } catch {
      return { status: 'recorded_locally', review_id: `REV-${Date.now()}`, ...review };
    }
  },

  async getBehavioralProfiles() {
    return MOCK_BEHAVIORAL_PROFILES;
  },

  async scoreTransaction(payload: any) {
    try {
      const res = await fetch(`${API_BASE}/transactions/score`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('Scoring failed');
      return await res.json();
    } catch {
      // Deterministic zero-lookahead score calculation fallback
      const amount = Number(payload.amount || 0);
      const isNight = payload.timestamp ? (new Date(payload.timestamp).getUTCHours() < 6) : false;
      let score = 25;
      const factors: any[] = [];

      if (amount > 100000) {
        score += 45;
        factors.push({ name: 'Velocity Outflow Surge', weight: 0.45, contribution: 45.0, description: 'Single transfer > $100k exceeds historical tier' });
      }
      if (isNight) {
        score += 24;
        factors.push({ name: 'Circadian Deviation', weight: 0.25, contribution: 24.0, description: 'Transacted in non-business nocturnal hours' });
      }
      return {
        transaction_id: payload.id || `TXN-${Date.now()}`,
        risk_score: Math.min(score, 99),
        severity: score > 80 ? 'critical' : score > 60 ? 'high' : score > 40 ? 'medium' : 'low',
        factors: factors.length ? factors : [{ name: 'Baseline Activity', weight: 0.1, contribution: 10, description: 'Within normal limits' }]
      };
    }
  }
};

