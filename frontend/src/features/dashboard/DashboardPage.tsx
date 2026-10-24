import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { RiskTrendChart } from '../../components/charts/RiskTrendChart';
import { apiService } from '../../services/api';
import { RiskAlert } from '../../types';
import {
  ShieldAlert,
  ArrowUpRight,
  TrendingUp,
  AlertTriangle,
  Users,
  Clock,
  Network,
} from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const [alerts, setAlerts] = useState<RiskAlert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiService.getAlerts().then((data) => {
      setAlerts(data);
      setLoading(false);
    });
  }, []);

  return (
    <div className="space-y-6">
      {/* Top Banner / Heading */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Investigator Command Center</h2>
          <p className="text-xs text-slate-400 mt-1">Real-time surveillance overview, suspicious flow bursts, and triage queue</p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            to="/app/network"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-surface-elevated hover:bg-slate-700 text-xs font-medium text-slate-200 border border-surface-border transition-colors"
          >
            <Network className="w-4 h-4 text-brand-400" />
            <span>Open Graph Explorer</span>
          </Link>
          <Link
            to="/app/alerts"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-brand-600 hover:bg-brand-500 text-xs font-medium text-white transition-colors"
          >
            <ShieldAlert className="w-4 h-4" />
            <span>Triage Alerts ({alerts.length})</span>
          </Link>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-400">Critical / High Alerts</p>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-2xl font-bold text-white">
                {alerts.filter(a => a.severity === 'critical' || a.severity === 'high').length}
              </span>
              <span className="text-xs text-rose-400 flex items-center font-medium">
                <TrendingUp className="w-3 h-3 mr-0.5" /> +14%
              </span>
            </div>
          </div>
        </Card>

        <Card className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-400">Suspicious Flow Volume</p>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-2xl font-bold text-white">$485,200</span>
              <span className="text-xs text-slate-400 font-mono">USD</span>
            </div>
          </div>
        </Card>

        <Card className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-400">Flagged Mule Nodes</p>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-2xl font-bold text-white">18</span>
              <span className="text-xs text-purple-400 font-medium">In 3 clusters</span>
            </div>
          </div>
        </Card>

        <Card className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-400">Avg Triage Speed</p>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-2xl font-bold text-white">2.8 min</span>
              <span className="text-xs text-emerald-400 font-medium">Target &lt; 5m</span>
            </div>
          </div>
        </Card>
      </div>

      {/* Main Charts & Activity Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Trend Area Chart */}
        <Card
          className="lg:col-span-2"
          title="Aggregated Network Risk Index"
          subtitle="Real-time scored risk spikes vs. expected historical behavioral baseline"
        >
          <RiskTrendChart />
        </Card>

        {/* Rapid Status summary */}
        <Card title="Surveillance Core Status" subtitle="Active subsystem health &amp; scoring pipelines">
          <div className="space-y-4 pt-2">
            <div className="flex items-center justify-between text-xs pb-3 border-b border-surface-border/50">
              <span className="text-slate-300">Behavioral Engine</span>
              <span className="text-emerald-400 font-medium flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> Active (0.91 conf)
              </span>
            </div>
            <div className="flex items-center justify-between text-xs pb-3 border-b border-surface-border/50">
              <span className="text-slate-300">Graph Multi-Hop Tracer</span>
              <span className="text-emerald-400 font-medium flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> Max 3 Hops
              </span>
            </div>
            <div className="flex items-center justify-between text-xs pb-3 border-b border-surface-border/50">
              <span className="text-slate-300">Replay Chronology Buffer</span>
              <span className="text-blue-400 font-medium flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400" /> Ready
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-300">Human-in-the-Loop Feedback</span>
              <span className="text-amber-400 font-medium flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400" /> 3 Reviews Pending
              </span>
            </div>
          </div>
        </Card>
      </div>

      {/* Recent Alerts Table */}
      <Card
        title="High-Priority Risk Alerts"
        subtitle="Recent suspicious signals awaiting investigator adjudication"
        action={
          <Link to="/app/alerts" className="text-xs text-brand-400 hover:text-brand-300 font-medium flex items-center gap-1">
            View All Alerts <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        }
      >
        {loading ? (
          <div className="p-8 text-center text-xs text-slate-500">Loading risk alerts...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-surface-border/80 text-slate-400 uppercase tracking-wider text-[11px]">
                  <th className="pb-3 font-semibold">Alert ID</th>
                  <th className="pb-3 font-semibold">Target Account</th>
                  <th className="pb-3 font-semibold">Severity</th>
                  <th className="pb-3 font-semibold">Risk Score</th>
                  <th className="pb-3 font-semibold">Primary Rule</th>
                  <th className="pb-3 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border/40">
                {alerts.map((alert) => (
                  <tr key={alert.id} className="hover:bg-surface-elevated/40 transition-colors">
                    <td className="py-3 font-mono font-medium text-slate-200">{alert.id}</td>
                    <td className="py-3 font-mono text-slate-300">{alert.account_id}</td>
                    <td className="py-3">
                      <Badge variant={alert.severity}>{alert.severity.toUpperCase()}</Badge>
                    </td>
                    <td className="py-3 font-bold font-mono text-rose-400">{alert.risk_score}/100</td>
                    <td className="py-3 text-slate-300">{alert.detection_rule}</td>
                    <td className="py-3 text-right">
                      <Link
                        to={`/app/alerts/${alert.id}`}
                        className="text-brand-400 hover:text-brand-300 font-semibold px-2 py-1 rounded bg-brand-500/10 hover:bg-brand-500/20 transition-colors"
                      >
                        Investigate
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
};
