import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { RiskTrendChart } from '../../components/charts/RiskTrendChart';
import { apiService } from '../../services/api';
import { RiskAlert } from '../../types';
import {
  Shield,
  TrendingUp,
  Wallet,
  Calendar,
  ChevronDown,
  Lock,
  Network,
  FileText,
  Sliders,
  MoreHorizontal
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
    <div className="space-y-8 max-w-[1400px] mx-auto pb-12">
      {/* ── Page Title Row with Benchmark Style Pill Banner (Matches Reference) ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-neutral-900">
            Risk Surveillance
          </h1>
          <p className="text-xs text-neutral-500 mt-1">
            Dashboard overview of real-time fraud signals and network triage
          </p>
        </div>

        {/* Benchmark / Engine Pill Banner (Matches Reference: Benchmark style Ambitious | 25% | 75%) */}
        <div className="bg-[#f0f5ff] border border-blue-100 rounded-2xl px-4 py-2.5 flex items-center gap-4 text-xs shadow-xs self-start md:self-auto">
          <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white shrink-0">
            <Shield className="w-4 h-4" />
          </div>
          <div className="border-r border-blue-200/80 pr-4">
            <div className="text-[10px] text-neutral-400 font-medium">Scoring Engine</div>
            <div className="font-bold text-neutral-900">Zero-Lookahead</div>
          </div>
          <div className="border-r border-blue-200/80 pr-4">
            <div className="text-[10px] text-neutral-400 font-medium">Inference Latency</div>
            <div className="font-bold text-neutral-900">18 ms (p99)</div>
          </div>
          <div>
            <div className="text-[10px] text-neutral-400 font-medium">ML Precision</div>
            <div className="font-bold text-emerald-600">98.4%</div>
          </div>
        </div>
      </div>

      {/* ── Main Two-Column Layout (Matches Reference: 38% Left / 62% Right) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* ── LEFT COLUMN: Metrics & Contrast Cards (~38% = 5 cols) ── */}
        <div className="lg:col-span-5 space-y-6">
          {/* Card 1: Dual Metric Card (Matches Reference: £58 356 Portfolio Value / £5 326 Growth) */}
          <div className="bg-[#f7f8fa] border border-neutral-100 rounded-3xl p-6">
            {/* Top Metric */}
            <div>
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-full bg-white shadow-xs border border-neutral-200/60 flex items-center justify-center text-neutral-700">
                  <Wallet className="w-4 h-4" />
                </div>
                <button className="bg-white border border-neutral-200/80 rounded-full px-3 py-1 text-xs font-medium text-neutral-700 shadow-xs flex items-center gap-1.5 hover:bg-neutral-50 transition-colors">
                  <span>Current</span>
                  <ChevronDown className="w-3 h-3 text-neutral-400" />
                </button>
              </div>

              <div className="mt-4">
                <div className="text-3xl font-bold text-neutral-900 tracking-tight">
                  $485,200
                </div>
                <div className="text-xs text-neutral-400 font-medium mt-1">
                  Suspicious transaction volume
                </div>
              </div>
            </div>

            {/* Divider */}
            <div className="border-t border-neutral-200/60 my-6" />

            {/* Bottom Metric */}
            <div>
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-full bg-white shadow-xs border border-neutral-200/60 flex items-center justify-center text-neutral-700">
                  <TrendingUp className="w-4 h-4" />
                </div>
                <button className="bg-white border border-neutral-200/80 rounded-full px-3 py-1 text-xs font-medium text-neutral-700 shadow-xs flex items-center gap-1.5 hover:bg-neutral-50 transition-colors">
                  <span>All time</span>
                  <ChevronDown className="w-3 h-3 text-neutral-400" />
                </button>
              </div>

              <div className="mt-4">
                <div className="text-3xl font-bold text-neutral-900 tracking-tight">
                  18 Flagged Mules
                </div>
                <div className="text-xs text-neutral-400 font-medium mt-1">
                  Active syndicate laundering nodes
                </div>
              </div>
            </div>
          </div>

          {/* Card 2: Signature Contrast Card (Matches Reference Black Debit Card + Cream Attached Tab) */}
          <div className="relative">
            {/* Dark Top Section */}
            <div className="bg-[#151619] rounded-3xl p-6 text-white relative z-10 shadow-md">
              <div className="flex items-center justify-between">
                {/* Mastercard-style dual ring emblem */}
                <div className="flex items-center -space-x-2">
                  <div className="w-6 h-6 rounded-full bg-rose-500/80" />
                  <div className="w-6 h-6 rounded-full bg-amber-400/80" />
                </div>
                <button className="text-neutral-400 hover:text-white p-1 transition-colors">
                  <MoreHorizontal className="w-4 h-4" />
                </button>
              </div>

              <div className="mt-6">
                <div className="font-mono text-2xl font-bold tracking-widest text-white">
                  *7749
                </div>
                <div className="text-xs text-neutral-400 mt-1">
                  Primary syndicate target account
                </div>
              </div>

              {/* Action Buttons (Matches Reference 'Top up' & 'Withdraw' pills) */}
              <div className="flex items-center gap-3 mt-6">
                <button
                  onClick={() => alert('Account ACC-7749 temporarily frozen for compliance review.')}
                  className="bg-[#27282d] hover:bg-[#323339] text-white px-4 py-2 rounded-full text-xs font-medium flex items-center gap-1.5 transition-colors"
                >
                  <Lock className="w-3.5 h-3.5 text-neutral-300" />
                  <span>Freeze account</span>
                </button>
                <button
                  onClick={() => navigate('/network?account=ACC-7749')}
                  className="bg-[#27282d] hover:bg-[#323339] text-white px-4 py-2 rounded-full text-xs font-medium flex items-center gap-1.5 transition-colors"
                >
                  <Network className="w-3.5 h-3.5 text-neutral-300" />
                  <span>Trace graph</span>
                </button>
              </div>
            </div>

            {/* Attached Warm-Cream Tab (Matches Reference 'Monthly regular contribution' tab) */}
            <div className="bg-[#fdedd8] rounded-b-3xl -mt-4 pt-7 pb-4 px-6 text-[#784516] flex items-center justify-between">
              <div>
                <div className="text-[11px] font-medium text-[#9a6438]">
                  Automated triage sensitivity
                </div>
                <div className="font-bold text-sm text-[#5c300b] mt-0.5">
                  Threshold: 80 / 100 Index
                </div>
              </div>
              <button
                onClick={() => navigate('/settings')}
                className="p-1 text-[#9a6438] hover:text-[#5c300b] transition-colors"
                title="Configure thresholds"
              >
                <Sliders className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Card 3: Bottom Stat Card (Matches Reference 'All time fees' £80 card) */}
          <div className="bg-[#edf3fc] border border-blue-50 rounded-2xl p-5 flex items-center justify-between">
            <div className="flex items-center gap-3.5">
              <div className="w-9 h-9 rounded-full bg-white shadow-xs flex items-center justify-center text-blue-600">
                <FileText className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-neutral-900">Investigation Turnaround</div>
                <div className="text-[11px] text-neutral-400">Target &lt; 5m triage velocity</div>
              </div>
            </div>
            <div className="font-bold text-lg text-neutral-900">
              2.8 min
            </div>
          </div>
        </div>

        {/* ── RIGHT COLUMN: Chart & Activity Table (~62% = 7 cols) ── */}
        <div className="lg:col-span-7 space-y-8">
          {/* Chart Card (Matches Reference 'Portfolio value' with Month & Date pills) */}
          <div className="bg-white border border-neutral-100 rounded-3xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-neutral-900">
                Network Risk Trend
              </h2>
              <div className="flex items-center gap-2">
                <button className="bg-neutral-50 border border-neutral-200/80 rounded-full px-3 py-1 text-xs font-medium text-neutral-700 shadow-xs flex items-center gap-1.5 hover:bg-neutral-100 transition-colors">
                  <span>Monthly</span>
                  <ChevronDown className="w-3 h-3 text-neutral-400" />
                </button>
                <button className="bg-neutral-50 border border-neutral-200/80 rounded-full px-3 py-1 text-xs font-medium text-neutral-700 shadow-xs flex items-center gap-1.5 hover:bg-neutral-100 transition-colors">
                  <Calendar className="w-3 h-3 text-neutral-400" />
                  <span>Jan 2026 - Oct 2026</span>
                  <ChevronDown className="w-3 h-3 text-neutral-400" />
                </button>
              </div>
            </div>

            {/* Natural Line/Area Chart */}
            <RiskTrendChart />
          </div>

          {/* Activity Table Card (Matches Reference 'Portfolio activity' table) */}
          <div className="bg-white border border-neutral-100 rounded-3xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-base font-bold text-neutral-900">
                Surveillance Activity
              </h2>
              <button className="bg-neutral-50 border border-neutral-200/80 rounded-full px-3 py-1 text-xs font-medium text-neutral-700 shadow-xs flex items-center gap-1.5 hover:bg-neutral-100 transition-colors">
                <span>October 2026</span>
                <ChevronDown className="w-3 h-3 text-neutral-400" />
              </button>
            </div>

            {loading ? (
              <div className="p-8 text-center text-xs text-neutral-400">Loading surveillance feed...</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-neutral-100 text-neutral-400 font-medium">
                      <th className="pb-3 font-medium">Date</th>
                      <th className="pb-3 font-medium">Description</th>
                      <th className="pb-3 font-medium">Category</th>
                      <th className="pb-3 font-medium text-right">Risk Score / Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-50">
                    {alerts.slice(0, 5).map((alert, idx) => {
                      const isHigh = alert.severity === 'critical' || alert.severity === 'high';
                      return (
                        <tr key={alert.id || idx} className="hover:bg-neutral-50/60 transition-colors group">
                          <td className="py-3.5 text-neutral-500 font-medium whitespace-nowrap">
                            10/{24 - idx}/2026
                          </td>
                          <td className="py-3.5 pr-4">
                            <Link
                              to={`/alerts/${alert.id}`}
                              className="font-medium text-neutral-800 hover:text-blue-600 transition-colors line-clamp-1"
                            >
                              {alert.detection_rule || 'Unusual High Velocity Transaction Burst'}
                            </Link>
                          </td>
                          <td className="py-3.5 whitespace-nowrap">
                            <span className="inline-flex items-center gap-1.5 text-xs font-medium">
                              <span className={`w-1.5 h-1.5 rounded-full ${isHigh ? 'bg-rose-500' : 'bg-amber-400'}`} />
                              <span className={isHigh ? 'text-rose-700' : 'text-amber-700'}>
                                {alert.severity.toUpperCase()}
                              </span>
                            </span>
                          </td>
                          <td className="py-3.5 text-right font-bold text-neutral-900 whitespace-nowrap">
                            ${(alert.risk_score * 1250).toLocaleString()}
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
