import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { apiService } from '../../services/api';
import { AccountProfile } from '../../types';
import { formatINR } from '../../utils/formatters';
import {
  ArrowLeft,
  Network,
  ShieldAlert,
  Activity,
  Fingerprint,
  Globe,
  Smartphone,
  ExternalLink,
  Clock,
  IndianRupee,
  ArrowLeftRight
} from 'lucide-react';

export const AccountProfilePage: React.FC = () => {
  const { accountId } = useParams<{ accountId: string }>();
  const [profile, setProfile] = useState<AccountProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const targetId = accountId || 'ACC-7749';

  useEffect(() => {
    setLoading(true);
    apiService.getAccountProfile(targetId).then((data) => {
      setProfile(data || null);
      setLoading(false);
    });
  }, [targetId]);

  if (loading) {
    return <div className="p-12 text-center text-xs text-ink-muted">Loading account intelligence...</div>;
  }

  if (!profile) {
    return (
      <div className="space-y-4 max-w-[1440px] mx-auto">
        <Link to="/dashboard" className="text-xs text-brand-600 flex items-center gap-1 font-semibold">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Dashboard
        </Link>
        <div className="bg-surface border border-surface-border rounded-xl p-6 shadow-xs">
          <h2 className="text-sm font-bold text-ink">Account Not Found</h2>
          <p className="text-xs text-ink-muted mt-1">The account profile for {targetId} could not be located in surveillance records.</p>
        </div>
      </div>
    );
  }

  const isCritical = profile.risk_score > 70;

  return (
    <div className="space-y-5 max-w-[1440px] mx-auto pb-10">
      {/* Top Breadcrumb & Action Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-1.5 mb-1.5 text-xs text-ink-muted">
            <Link to="/dashboard" className="hover:text-ink transition-colors">Dashboard</Link>
            <span>/</span>
            <Link to="/transactions" className="hover:text-ink transition-colors">Accounts</Link>
            <span>/</span>
            <span className="text-ink font-mono font-semibold">{profile.id}</span>
          </div>
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-xl font-bold tracking-tight text-ink">{profile.account_holder}</h1>
            <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-tight ${
              isCritical
                ? 'bg-red-50 text-red-700 border border-red-200'
                : 'bg-amber-50 text-amber-700 border border-amber-200'
            }`}>
              {profile.risk_tier} RISK ({profile.risk_score}/100)
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-surface-elevated text-ink-secondary border border-surface-border uppercase">
              {profile.status.replace('_', ' ')}
            </span>
          </div>
          <p className="text-xs text-ink-muted mt-1">
            Account ID: <span className="font-mono font-bold text-ink">{profile.id}</span> • Registered {profile.created_at} • {profile.location}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to={`/network?account=${profile.id}`}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-brand-950 hover:bg-slate-800 text-xs font-semibold text-white transition-colors shadow-xs"
          >
            <Network className="w-3.5 h-3.5 text-blue-400" />
            <span>Trace in Graph</span>
          </Link>
          <Link
            to={`/transactions?account=${profile.id}`}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-surface hover:bg-surface-elevated text-xs font-semibold text-ink-secondary border border-surface-border transition-colors shadow-xs"
          >
            <ArrowLeftRight className="w-3.5 h-3.5 text-ink-muted" />
            <span>Filter Transactions</span>
          </Link>
        </div>
      </div>

      {/* KPI Overview Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-surface border border-surface-border rounded-xl p-4 shadow-xs flex items-center gap-3.5">
          <div className="w-9 h-9 rounded-lg bg-red-50 border border-red-100 flex items-center justify-center text-risk-critical">
            <ShieldAlert className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[11px] text-ink-muted font-medium uppercase tracking-wider">Calculated Risk Index</div>
            <div className="text-lg font-bold text-risk-critical font-mono tabular-nums mt-0.5">{profile.risk_score} / 100</div>
          </div>
        </div>

        <div className="bg-surface border border-surface-border rounded-xl p-4 shadow-xs flex items-center gap-3.5">
          <div className="w-9 h-9 rounded-lg bg-surface-elevated border border-surface-border flex items-center justify-center text-brand-700">
            <IndianRupee className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[11px] text-ink-muted font-medium uppercase tracking-wider">Ledger Balance</div>
            <div className="text-lg font-bold text-ink font-mono tabular-nums mt-0.5">{formatINR(profile.balance)}</div>
          </div>
        </div>

        <div className="bg-surface border border-surface-border rounded-xl p-4 shadow-xs flex items-center gap-3.5">
          <div className="w-9 h-9 rounded-lg bg-surface-elevated border border-surface-border flex items-center justify-center text-ink-secondary">
            <Activity className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[11px] text-ink-muted font-medium uppercase tracking-wider">Avg Daily Volume</div>
            <div className="text-lg font-bold text-ink font-mono tabular-nums mt-0.5">{formatINR(profile.behavioral.avg_daily_volume)}</div>
          </div>
        </div>

        <div className="bg-surface border border-surface-border rounded-xl p-4 shadow-xs flex items-center gap-3.5">
          <div className="w-9 h-9 rounded-lg bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-700">
            <Fingerprint className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[11px] text-ink-muted font-medium uppercase tracking-wider">Behavioral Anomalies</div>
            <div className="text-lg font-bold text-amber-700 font-mono tabular-nums mt-0.5">{profile.behavioral.anomalies_detected} in 30d</div>
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left 8 cols: Behavioral Profile & Table */}
        <div className="lg:col-span-8 space-y-4">
          <div className="bg-surface border border-surface-border rounded-xl p-5 shadow-xs space-y-4">
            <div>
              <h2 className="text-sm font-bold text-ink">
                Behavioral Fingerprinting Telemetry
              </h2>
              <p className="text-[11px] text-ink-muted mt-0.5">Zero-lookahead baseline calculated strictly from historical activity prior to current events</p>
            </div>

            <div className="p-3.5 bg-surface-elevated rounded-lg border border-surface-border flex items-center justify-between">
              <div>
                <span className="font-semibold text-ink block text-xs">Baseline Model Confidence</span>
                <p className="text-[11px] text-ink-muted mt-0.5">Derived from account seasoning age and historical sample density</p>
              </div>
              <span className="text-xs font-mono font-bold text-brand-700 bg-brand-50 px-2.5 py-1 rounded border border-brand-200">
                {(profile.behavioral.confidence_score * 100).toFixed(0)}% Certainty
              </span>
            </div>

            <div>
              <label className="text-xs font-semibold text-ink-secondary block mb-1.5">Typical Circadian Transacting Windows</label>
              <div className="flex flex-wrap gap-2">
                {profile.behavioral.typical_hours.map((h, i) => (
                  <span key={i} className="px-2.5 py-1 rounded-md bg-surface-elevated border border-surface-border text-ink text-xs font-medium flex items-center gap-1.5 font-mono">
                    <Clock className="w-3 h-3 text-ink-muted" /> {h}
                  </span>
                ))}
                <span className="px-2.5 py-1 rounded-md bg-red-50 border border-red-200 text-red-700 text-xs font-medium flex items-center gap-1.5 font-mono">
                  <Clock className="w-3 h-3 text-red-500" /> Nocturnal (02:00-05:00): Anomalous
                </span>
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-ink-secondary block mb-1.5">Whitelisted Baseline Counterparties</label>
              <div className="flex flex-wrap gap-2">
                {profile.behavioral.frequent_counterparties.map((cp, i) => (
                  <Link
                    key={i}
                    to={`/accounts/${cp}`}
                    className="px-2.5 py-1 rounded-md bg-surface-elevated hover:bg-surface text-ink-secondary border border-surface-border text-xs font-mono font-medium flex items-center gap-1.5 transition-colors"
                  >
                    {cp} <ExternalLink className="w-3 h-3 text-ink-muted" />
                  </Link>
                ))}
              </div>
            </div>
          </div>

          {/* Recent Activity Table */}
          <div className="bg-surface border border-surface-border rounded-xl p-5 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-bold text-ink">
                Recent Ledger Events for {profile.id}
              </h2>
              <Link to={`/transactions?account=${profile.id}`} className="text-xs font-semibold text-brand-600 hover:text-brand-700">
                All Transactions →
              </Link>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-surface-border text-ink-muted font-semibold text-[11px] uppercase tracking-wider">
                    <th className="pb-2.5 font-medium">Txn ID</th>
                    <th className="pb-2.5 font-medium">Counterparty</th>
                    <th className="pb-2.5 font-medium text-right">Amount (INR)</th>
                    <th className="pb-2.5 font-medium text-center">Rail</th>
                    <th className="pb-2.5 font-medium text-right">Risk Score</th>
                    <th className="pb-2.5 font-medium text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-border">
                  {profile.recent_transactions.map((txn) => {
                    const isSender = txn.sender_account_id === profile.id;
                    const counterparty = isSender ? txn.receiver_account_id : txn.sender_account_id;
                    const isHighRisk = (txn.risk_score || 0) >= 80;
                    return (
                      <tr key={txn.id} className="hover:bg-surface-elevated/70 transition-colors group">
                        <td className="py-2.5 font-mono text-ink-secondary text-[11px] font-semibold">{txn.id}</td>
                        <td className="py-2.5 font-mono text-[11px]">
                          <Link to={`/accounts/${counterparty}`} className="font-semibold text-brand-700 hover:text-brand-900">
                            {counterparty}
                          </Link>
                        </td>
                        <td className={`py-2.5 text-right font-mono text-xs font-bold tabular-nums whitespace-nowrap ${isSender ? 'text-red-700' : 'text-emerald-700'}`}>
                          {isSender ? '-' : '+'}{formatINR(txn.amount)}
                        </td>
                        <td className="py-2.5 text-center uppercase text-[9px] font-mono text-ink-secondary">{txn.channel}</td>
                        <td className="py-2.5 text-right font-mono text-xs font-semibold tabular-nums">
                          <span className={isHighRisk ? 'text-risk-critical' : 'text-risk-medium'}>
                            {txn.risk_score}/100
                          </span>
                        </td>
                        <td className="py-2.5 text-right whitespace-nowrap">
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-surface-elevated text-ink-secondary border border-surface-border uppercase">
                            {(txn.status || 'cleared').toUpperCase()}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right 4 cols: Entity Identity & Signals */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-surface border border-surface-border rounded-xl p-4 shadow-xs space-y-3">
            <h2 className="text-xs font-bold text-ink uppercase tracking-wider">Entity &amp; Identity Signals</h2>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between items-center py-1 border-b border-surface-border">
                <span className="text-ink-secondary font-medium">KYC Tier</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 uppercase">
                  {profile.kyc_status}
                </span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-surface-border">
                <span className="text-ink-secondary font-medium">Entity Type</span>
                <span className="font-semibold text-ink uppercase">{profile.account_type}</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-surface-border">
                <span className="text-ink-secondary font-medium">Jurisdiction</span>
                <span className="text-ink font-semibold flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-ink-muted" /> {profile.location}
                </span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-surface-border">
                <span className="text-ink-secondary font-medium">IP Reputation</span>
                <span className="font-mono font-bold text-risk-critical">{profile.ip_reputation}</span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-ink-secondary font-medium">Registered Devices</span>
                <span className="text-ink font-semibold flex items-center gap-1.5">
                  <Smartphone className="w-3.5 h-3.5 text-ink-muted" /> {profile.device_count} Unique Fingerprints
                </span>
              </div>
            </div>
          </div>

          <div className="bg-surface border border-surface-border rounded-xl p-4 shadow-xs space-y-2.5">
            <h2 className="text-xs font-bold text-ink uppercase tracking-wider">Investigator Actions</h2>
            <div className="space-y-2 pt-1">
              <button
                className="w-full py-2 px-3.5 rounded-lg bg-brand-950 hover:bg-slate-800 text-white text-xs font-semibold shadow-xs transition-colors"
                onClick={() => alert(`Flagged account ${profile.id} for enhanced due diligence surveillance.`)}
              >
                Flag for Enhanced Monitoring
              </button>
              <button
                className="w-full py-2 px-3.5 rounded-lg bg-surface hover:bg-surface-elevated text-ink border border-surface-border text-xs font-semibold transition-colors"
                onClick={() => alert(`Generated SAR compliance evidence package for ${profile.id}.`)}
              >
                Export SAR Audit Dossier
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
