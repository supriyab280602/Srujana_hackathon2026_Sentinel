import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { apiService } from '../../services/api';
import { AccountProfile } from '../../types';
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
  DollarSign
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
    return <div className="p-12 text-center text-xs text-neutral-400">Loading account intelligence...</div>;
  }

  if (!profile) {
    return (
      <div className="space-y-4 max-w-[1400px] mx-auto">
        <Link to="/dashboard" className="text-xs text-blue-600 flex items-center gap-1 font-semibold">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Dashboard
        </Link>
        <div className="bg-white border border-neutral-100 rounded-3xl p-8 shadow-sm">
          <h2 className="text-base font-bold text-neutral-900">Account Not Found</h2>
          <p className="text-xs text-neutral-500 mt-1">The account profile for {targetId} could not be located.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-[1400px] mx-auto pb-12">
      {/* Top Breadcrumb & Action Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2 text-xs font-medium text-neutral-400">
            <Link to="/dashboard" className="hover:text-neutral-900 transition-colors">Dashboard</Link>
            <span>/</span>
            <span>Accounts</span>
            <span>/</span>
            <span className="text-neutral-900 font-bold">{profile.id}</span>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight text-neutral-900">{profile.account_holder}</h1>
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-neutral-100 text-neutral-800 uppercase">
              {profile.risk_tier} RISK
            </span>
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-neutral-100 text-neutral-700 uppercase">
              {profile.status.replace('_', ' ')}
            </span>
          </div>
          <p className="text-xs text-neutral-500 mt-1">
            ID: <span className="font-bold text-neutral-900">{profile.id}</span> • Registered {profile.created_at} • {profile.location}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to={`/network?account=${profile.id}`}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-neutral-900 hover:bg-neutral-800 text-xs font-semibold text-white transition-colors shadow-xs"
          >
            <Network className="w-4 h-4" />
            <span>Trace in Graph</span>
          </Link>
          <Link
            to={`/transactions?account=${profile.id}`}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white hover:bg-neutral-50 text-xs font-semibold text-neutral-700 border border-neutral-200/80 transition-colors shadow-xs"
          >
            <DollarSign className="w-4 h-4 text-neutral-400" />
            <span>Transactions</span>
          </Link>
        </div>
      </div>

      {/* KPI Overview Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#f7f8fa] border border-neutral-100 rounded-3xl p-5 flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-white shadow-xs border border-neutral-200/60 flex items-center justify-center text-rose-600">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-neutral-400 font-medium">Calculated Risk Index</div>
            <div className="text-xl font-bold text-rose-600 mt-0.5">{profile.risk_score} / 100</div>
          </div>
        </div>

        <div className="bg-[#f7f8fa] border border-neutral-100 rounded-3xl p-5 flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-white shadow-xs border border-neutral-200/60 flex items-center justify-center text-blue-600">
            <DollarSign className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-neutral-400 font-medium">Ledger Balance</div>
            <div className="text-xl font-bold text-neutral-900 mt-0.5">${profile.balance.toLocaleString()} {profile.currency}</div>
          </div>
        </div>

        <div className="bg-[#f7f8fa] border border-neutral-100 rounded-3xl p-5 flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-white shadow-xs border border-neutral-200/60 flex items-center justify-center text-neutral-700">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-neutral-400 font-medium">Avg Daily Volume</div>
            <div className="text-xl font-bold text-neutral-900 mt-0.5">${profile.behavioral.avg_daily_volume.toLocaleString()}</div>
          </div>
        </div>

        <div className="bg-[#f7f8fa] border border-neutral-100 rounded-3xl p-5 flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-white shadow-xs border border-neutral-200/60 flex items-center justify-center text-amber-600">
            <Fingerprint className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-neutral-400 font-medium">Anomalous Deviations</div>
            <div className="text-xl font-bold text-amber-600 mt-0.5">{profile.behavioral.anomalies_detected} in 30d</div>
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left 8 cols: Behavioral Profile & Table */}
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-white border border-neutral-100 rounded-3xl p-6 shadow-sm space-y-5">
            <div>
              <h2 className="text-base font-bold text-neutral-900">
                Behavioral Fingerprinting Baseline
              </h2>
              <p className="text-xs text-neutral-400 mt-0.5">Zero-lookahead baseline calculated strictly from historical activity prior to current events</p>
            </div>

            <div className="p-4 bg-[#f7f8fa] rounded-2xl border border-neutral-100 flex items-center justify-between">
              <div>
                <span className="font-bold text-neutral-900 block text-xs">Baseline Model Confidence</span>
                <p className="text-[11px] text-neutral-500 mt-0.5">Derived from account seasoning age and historical sample density</p>
              </div>
              <span className="text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-full border border-blue-100">
                {(profile.behavioral.confidence_score * 100).toFixed(0)}% Reliable
              </span>
            </div>

            <div>
              <label className="text-xs font-semibold text-neutral-700 block mb-2">Typical Circadian Transacting Windows</label>
              <div className="flex flex-wrap gap-2">
                {profile.behavioral.typical_hours.map((h, i) => (
                  <span key={i} className="px-3.5 py-1.5 rounded-full bg-[#f7f8fa] border border-neutral-200/60 text-neutral-700 text-xs font-medium flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-neutral-400" /> {h}
                  </span>
                ))}
                <span className="px-3.5 py-1.5 rounded-full bg-rose-50 border border-rose-100 text-rose-700 text-xs font-medium flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-rose-500" /> Nocturnal: 0% Expected
                </span>
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-neutral-700 block mb-2">Whitelisted Baseline Counterparties</label>
              <div className="flex flex-wrap gap-2">
                {profile.behavioral.frequent_counterparties.map((cp, i) => (
                  <Link
                    key={i}
                    to={`/accounts/${cp}`}
                    className="px-3.5 py-1.5 rounded-full bg-[#f7f8fa] hover:bg-neutral-100 text-neutral-700 border border-neutral-200/60 text-xs font-medium flex items-center gap-1.5 transition-colors"
                  >
                    {cp} <ExternalLink className="w-3 h-3 text-neutral-400" />
                  </Link>
                ))}
              </div>
            </div>
          </div>

          {/* Recent Activity Table */}
          <div className="bg-white border border-neutral-100 rounded-3xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-neutral-900">
                Recent Account Ledger Events
              </h2>
              <Link to={`/transactions?account=${profile.id}`} className="text-xs font-semibold text-blue-600 hover:underline">
                All Transactions →
              </Link>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-neutral-100 text-neutral-400 font-medium">
                    <th className="pb-3 font-medium">Txn ID</th>
                    <th className="pb-3 font-medium">Counterparty</th>
                    <th className="pb-3 font-medium">Amount</th>
                    <th className="pb-3 font-medium">Channel</th>
                    <th className="pb-3 font-medium">Risk Score</th>
                    <th className="pb-3 font-medium text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-50">
                  {profile.recent_transactions.map((txn) => {
                    const isSender = txn.sender_account_id === profile.id;
                    const counterparty = isSender ? txn.receiver_account_id : txn.sender_account_id;
                    const isHighRisk = (txn.risk_score || 0) >= 80;
                    return (
                      <tr key={txn.id} className="hover:bg-neutral-50/60 transition-colors group">
                        <td className="py-3.5 font-semibold text-neutral-900">{txn.id}</td>
                        <td className="py-3.5">
                          <Link to={`/accounts/${counterparty}`} className="font-medium text-neutral-700 hover:text-blue-600">
                            {counterparty}
                          </Link>
                        </td>
                        <td className="py-3.5 font-bold text-neutral-900">
                          {isSender ? '-' : '+'}${txn.amount.toLocaleString()} <span className="text-neutral-400 text-[10px] font-normal">{txn.currency}</span>
                        </td>
                        <td className="py-3.5 uppercase text-[10px] text-neutral-500 font-medium">{txn.channel}</td>
                        <td className="py-3.5">
                          {txn.risk_score ? (
                            <span className={`inline-flex items-center gap-1.5 text-xs font-semibold ${
                              isHighRisk ? 'text-rose-600' : 'text-amber-600'
                            }`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${isHighRisk ? 'bg-rose-500' : 'bg-amber-400'}`} />
                              {txn.risk_score}/100
                            </span>
                          ) : (
                            <span className="text-neutral-400">—</span>
                          )}
                        </td>
                        <td className="py-3.5 text-right">
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-neutral-100 text-neutral-700 uppercase">
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
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white border border-neutral-100 rounded-3xl p-6 shadow-sm space-y-4">
            <h2 className="text-base font-bold text-neutral-900">Entity &amp; Identity Signals</h2>
            <div className="space-y-3 text-xs">
              <div className="flex justify-between items-center pb-2.5 border-b border-neutral-50">
                <span className="text-neutral-500 font-medium">KYC Verification</span>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 uppercase">
                  {profile.kyc_status}
                </span>
              </div>
              <div className="flex justify-between items-center pb-2.5 border-b border-neutral-50">
                <span className="text-neutral-500 font-medium">Classification</span>
                <span className="font-bold text-neutral-900 uppercase">{profile.account_type}</span>
              </div>
              <div className="flex justify-between items-center pb-2.5 border-b border-neutral-50">
                <span className="text-neutral-500 font-medium">Jurisdiction</span>
                <span className="text-neutral-900 font-semibold flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-neutral-400" /> {profile.location}
                </span>
              </div>
              <div className="flex justify-between items-center pb-2.5 border-b border-neutral-50">
                <span className="text-neutral-500 font-medium">IP Risk Score</span>
                <span className="font-bold text-rose-600">{profile.ip_reputation}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-neutral-500 font-medium">Device Footprint</span>
                <span className="text-neutral-900 font-semibold flex items-center gap-1.5">
                  <Smartphone className="w-3.5 h-3.5 text-neutral-400" /> {profile.device_count} Fingerprints
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white border border-neutral-100 rounded-3xl p-6 shadow-sm space-y-3">
            <h2 className="text-base font-bold text-neutral-900">Investigator Actions</h2>
            <div className="space-y-2.5 pt-1">
              <button
                className="w-full py-3 px-4 rounded-full bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-semibold shadow-xs transition-colors"
                onClick={() => alert(`Flagged account ${profile.id} for enhanced due diligence surveillance.`)}
              >
                Flag for Enhanced Monitoring
              </button>
              <button
                className="w-full py-3 px-4 rounded-full bg-neutral-50 hover:bg-neutral-100 text-neutral-800 border border-neutral-200/80 text-xs font-semibold transition-colors"
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
