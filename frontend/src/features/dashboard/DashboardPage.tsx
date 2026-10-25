import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { RiskTrendChart } from '../../components/charts/RiskTrendChart';
import { apiService } from '../../services/api';
import { RiskAlert } from '../../types';
import { formatINR } from '../../utils/formatters';
import {
  TrendingUp,
  Wallet,
  Calendar,
  Lock,
  Network,
  Sliders,
  AlertTriangle,
  ArrowRight,
  Clock
} from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [alerts, setAlerts] = useState<RiskAlert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiService.getAlerts().then((data) => {
      setAlerts(data);
      setLoading(false);
    });
  }, []);

  return (
    <div className="space-y-5 max-w-[1440px] mx-auto pb-10">
      {/* ── Top Header Row with System Telemetry Banner ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-ink">
            Financial Risk Surveillance
          </h1>
          <p className="text-xs text-ink-secondary mt-0.5">
            Real-time fraud signal detection, syndicate topology monitoring, and investigation triage
          </p>
        </div>

        {/* Operational Telemetry Banner */}
        <div className="bg-surface border border-surface-border rounded-lg px-3.5 py-1.5 flex items-center gap-4 text-xs shadow-xs self-start md:self-auto">
          <div className="flex items-center gap-2 border-r border-surface-border pr-3">
            <span className="w-2 h-2 rounded-full bg-brand-600 animate-pulse" />
            <span className="text-[11px] text-ink-secondary">Engine:</span>
            <span className="font-semibold text-ink text-[11px]">Zero-Lookahead</span>
          </div>
          <div className="border-r border-surface-border pr-3">
            <span className="text-[11px] text-ink-secondary">p99 Latency:</span>
            <span className="font-semibold text-ink font-mono text-[11px] ml-1">18 ms</span>
          </div>
          <div>
            <span className="text-[11px] text-ink-secondary">Precision:</span>
            <span className="font-semibold text-emerald-700 font-mono text-[11px] ml-1">98.4%</span>
          </div>
        </div>
      </div>

      {/* ── Main Two-Column Layout (Left Column 5 cols / Right Column 7 cols) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* ── LEFT COLUMN: Metrics & Key Target Investigation (~40% = 5 cols) ── */}
        <div className="lg:col-span-5 space-y-4">
          {/* Card 1: Suspicious Exposure & Mules KPI */}
          <div className="bg-surface border border-surface-border rounded-xl p-5 shadow-xs">
            {/* Top Metric */}
            <div className="flex items-start justify-between">
              <div>
                <div className="text-[11px] font-semibold text-ink-muted uppercase tracking-wider">
                  Suspicious Transaction Volume (24h)
                </div>
                <div className="text-2xl font-bold text-ink tracking-tight tabular-nums mt-1">
                  {formatINR(485200)}
                </div>
                <div className="flex items-center gap-1.5 text-[11px] text-risk-critical font-medium mt-1">
                  <TrendingUp className="w-3.5 h-3.5" />
                  <span>+1,420% above 30-day baseline</span>
                </div>
              </div>
              <div className="w-9 h-9 rounded-lg bg-red-50 border border-red-100 flex items-center justify-center text-risk-critical">
                <Wallet className="w-4 h-4" />
              </div>
            </div>

            {/* Divider */}
            <div className="border-t border-surface-border my-4" />

            {/* Bottom Metric */}
            <div className="flex items-start justify-between">
              <div>
                <div className="text-[11px] font-semibold text-ink-muted uppercase tracking-wider">
                  Identified Syndicate Mule Nodes
                </div>
                <div className="text-2xl font-bold text-ink tracking-tight tabular-nums mt-1">
                  18 Accounts
                </div>
                <div className="flex items-center gap-1.5 text-[11px] text-ink-secondary mt-1">
                  <span>Across 3 hops · Rapid disbursement structuring</span>
                </div>
              </div>
              <div className="w-9 h-9 rounded-lg bg-amber-50 border border-amber-100 flex items-center justify-center text-risk-medium">
                <AlertTriangle className="w-4 h-4" />
              </div>
            </div>
          </div>

          {/* Card 2: High-Priority Syndicate Target Surveillance Card */}
          <div className="bg-surface border border-surface-border rounded-xl shadow-xs overflow-hidden">
            {/* Target Header */}
            <div className="bg-slate-900 text-white p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                  <span className="text-[10px] font-semibold tracking-wider uppercase text-slate-300">
                    Primary Target Account
                  </span>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-amber-300 border border-slate-700">
                  Risk Index: 94/100
                </span>
              </div>

              <div className="mt-3 flex items-baseline justify-between">
                <div>
                  <div className="font-mono text-xl font-bold tracking-wider">
                    ACC-7749
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    Entity: SwiftPay Direct Corp • Delaware, USA
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] text-slate-400">Current Ledger</div>
                  <div className="font-mono text-sm font-semibold tabular-nums text-emerald-400">
                    {formatINR(24500)}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 mt-4 pt-3 border-t border-slate-800">
                <button
                  onClick={() => alert('Account ACC-7749 has been frozen for compliance review.')}
                  className="flex-1 bg-slate-800 hover:bg-slate-700 text-white py-1.5 px-3 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition-colors border border-slate-700"
                >
                  <Lock className="w-3.5 h-3.5 text-rose-400" />
                  <span>Freeze Account</span>
                </button>
                <button
                  onClick={() => navigate('/network?account=ACC-7749')}
                  className="flex-1 bg-brand-600 hover:bg-brand-500 text-white py-1.5 px-3 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Network className="w-3.5 h-3.5" />
                  <span>Trace in Graph</span>
                </button>
              </div>
            </div>

            {/* Attached Compliance Status Strip */}
            <div className="bg-amber-50/70 border-t border-amber-200/60 p-3.5 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <Sliders className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                <div>
                  <div className="text-[11px] font-semibold text-amber-900">
                    Triage Alert Rule: CROSS_ACCOUNT_FANOUT_BURST
                  </div>
                  <div className="text-[10px] text-amber-800">
                    8 rapid wire transfers to unverified mule entities
                  </div>
                </div>
              </div>
              <Link
                to="/alerts/ALT-8902"
                className="text-xs font-semibold text-amber-900 hover:text-amber-950 flex items-center gap-1 shrink-0"
              >
                <span>View Alert</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </div>

          {/* Card 3: Investigation Desk SLAs */}
          <div className="bg-surface border border-surface-border rounded-xl p-4 shadow-xs flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center text-brand-600">
                <Clock className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-semibold text-ink">Investigation Turnaround Time</div>
                <div className="text-[11px] text-ink-muted">Average time to SAR filing or clearing</div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm font-bold text-ink font-mono tabular-nums">2.8 min</div>
              <div className="text-[10px] text-emerald-700 font-medium">Target &lt; 5 min</div>
            </div>
          </div>
        </div>

        {/* ── RIGHT COLUMN: Risk Trend Chart & Live Surveillance Table (~60% = 7 cols) ── */}
        <div className="lg:col-span-7 space-y-4">
          {/* Chart Container */}
          <div className="bg-surface border border-surface-border rounded-xl p-5 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
              <div>
                <h2 className="text-sm font-bold text-ink">
                  Aggregate Network Risk & Volume Exposure
                </h2>
                <p className="text-[11px] text-ink-muted">
                  Hourly composite threat score vs historical threshold
                </p>
              </div>
              <div className="flex items-center gap-2">
                <div className="bg-surface-elevated border border-surface-border rounded-lg px-2.5 py-1 text-[11px] font-medium text-ink-secondary flex items-center gap-1.5">
                  <Calendar className="w-3 h-3 text-ink-muted" />
                  <span>October 2026</span>
                </div>
                <span className="text-[11px] text-ink-muted font-medium bg-surface-elevated border border-surface-border px-2 py-1 rounded-lg">
                  Hourly
                </span>
              </div>
            </div>

            {/* Chart Component */}
            <RiskTrendChart />
          </div>

          {/* Surveillance Activity Table */}
          <div className="bg-surface border border-surface-border rounded-xl p-5 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-sm font-bold text-ink">
                  Recent High-Risk Surveillance Dockets
                </h2>
                <p className="text-[11px] text-ink-muted">
                  Latest alerts flagged by machine learning models and graph cycle detection
                </p>
              </div>
              <Link
                to="/alerts"
                className="text-xs font-semibold text-brand-600 hover:text-brand-700 flex items-center gap-1"
              >
                <span>View All Alerts</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {loading ? (
              <div className="p-8 text-center text-xs text-ink-muted">Loading surveillance feed…</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-surface-border text-ink-muted font-semibold text-[11px] uppercase tracking-wider">
                      <th className="pb-2.5 font-medium">Alert ID</th>
                      <th className="pb-2.5 font-medium">Trigger Rule & Summary</th>
                      <th className="pb-2.5 font-medium">Severity</th>
                      <th className="pb-2.5 font-medium text-right">Risk Score</th>
                      <th className="pb-2.5 font-medium text-right">Exposure Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-border">
                    {alerts.slice(0, 5).map((alert, idx) => {
                      const isCritical = alert.severity === 'critical';
                      const isHigh = alert.severity === 'high';
                      const exposureAmount = (alert.risk_score || 75) * 1250;

                      return (
                        <tr key={alert.id || idx} className="hover:bg-surface-elevated/70 transition-colors group">
                          <td className="py-2.5 font-mono text-ink-secondary text-[11px] font-semibold whitespace-nowrap">
                            <Link to={`/alerts/${alert.id}`} className="hover:text-brand-600">
                              {alert.id}
                            </Link>
                          </td>
                          <td className="py-2.5 pr-4 max-w-[260px]">
                            <Link
                              to={`/alerts/${alert.id}`}
                              className="font-medium text-ink hover:text-brand-600 transition-colors line-clamp-1 text-xs"
                            >
                              {alert.detection_rule || 'CROSS_ACCOUNT_FANOUT_BURST'}
                            </Link>
                            <span className="text-[10px] text-ink-muted block line-clamp-1">
                              {alert.summary || 'High velocity layering burst observed'}
                            </span>
                          </td>
                          <td className="py-2.5 whitespace-nowrap">
                            <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-semibold tracking-tight ${
                              isCritical
                                ? 'bg-red-50 text-red-700 border border-red-200'
                                : isHigh
                                ? 'bg-orange-50 text-orange-700 border border-orange-200'
                                : 'bg-amber-50 text-amber-700 border border-amber-200'
                            }`}>
                              <span className={`w-1 h-1 rounded-full ${isCritical ? 'bg-red-600' : isHigh ? 'bg-orange-600' : 'bg-amber-600'}`} />
                              {alert.severity.toUpperCase()}
                            </span>
                          </td>
                          <td className="py-2.5 text-right font-mono text-xs font-semibold tabular-nums text-ink whitespace-nowrap">
                            <span className={alert.risk_score > 80 ? 'text-risk-critical' : 'text-risk-medium'}>
                              {alert.risk_score}/100
                            </span>
                          </td>
                          <td className="py-2.5 text-right font-mono text-xs font-bold tabular-nums text-ink whitespace-nowrap">
                            {formatINR(exposureAmount)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
