import { RiskAlert, AccountNetworkData, InvestigationReviewSubmission } from '../types';
import { MOCK_ALERTS, MOCK_NETWORK_DATA, MOCK_BEHAVIORAL_PROFILES } from '../mocks';

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
      // Fallback to local mock data during initial scaffold/offline
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
  }
};
