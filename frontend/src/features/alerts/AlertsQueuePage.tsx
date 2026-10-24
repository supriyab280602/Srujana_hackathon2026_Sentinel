import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { apiService } from '../../services/api';
import { RiskAlert, RiskSeverity } from '../../types';
import { Filter, Eye, AlertCircle } from 'lucide-react';

export const AlertsQueuePage: React.FC = () => {
  const [alerts, setAlerts] = useState<RiskAlert[]>([]);
  const [filterSeverity, setFilterSeverity] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    apiService.getAlerts().then(setAlerts);
  }, []);

  const filteredAlerts = alerts.filter((alert) => {
    const matchesSeverity = filterSeverity === 'all' || alert.severity === filterSeverity;
    const matchesSearch =
      alert.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      alert.account_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      alert.detection_rule.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSeverity && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Title & Filter bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Active Alert Triage Queue</h2>
          <p className="text-xs text-slate-400 mt-1">Review, prioritize, and initiate deep-dives on anomalous financial patterns</p>
        </div>
      </div>

      <Card>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 mb-4 border-b border-surface-border">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <span className="text-xs font-semibold text-slate-300">Filter Severity:</span>
            <div className="flex gap-1.5">
              {['all', 'critical', 'high', 'medium', 'low'].map((sev) => (
                <button
                  key={sev}
                  onClick={() => setFilterSeverity(sev)}
                  className={`text-xs px-2.5 py-1 rounded-md font-medium capitalize transition-colors ${
                    filterSeverity === sev
                      ? 'bg-brand-600 text-white'
                      : 'bg-surface-elevated text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {sev}
                </button>
              ))}
            </div>
          </div>

          <div className="w-full sm:w-64">
            <input
              type="text"
              placeholder="Search alert ID or account..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-surface-elevated border border-surface-border rounded-lg px-3 py-1.5 text-xs text-slate-100 placeholder-slate-400 focus:outline-none focus:border-brand-500"
            />
          </div>
        </div>

        {filteredAlerts.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs">
            <AlertCircle className="w-8 h-8 text-slate-500 mx-auto mb-2" />
            No alerts found matching the current filters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-surface-border/80 text-slate-400 uppercase tracking-wider text-[11px]">
                  <th className="pb-3 font-semibold">Alert</th>
                  <th className="pb-3 font-semibold">Account</th>
                  <th className="pb-3 font-semibold">Severity</th>
                  <th className="pb-3 font-semibold">Score</th>
                  <th className="pb-3 font-semibold">Detection Summary</th>
                  <th className="pb-3 font-semibold">Status</th>
                  <th className="pb-3 font-semibold text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border/40">
                {filteredAlerts.map((alert) => (
                  <tr key={alert.id} className="hover:bg-surface-elevated/40 transition-colors">
                    <td className="py-3.5 font-mono font-medium text-slate-100">{alert.id}</td>
                    <td className="py-3.5 font-mono text-slate-300">{alert.account_id}</td>
                    <td className="py-3.5">
                      <Badge variant={alert.severity as RiskSeverity}>{alert.severity.toUpperCase()}</Badge>
                    </td>
                    <td className="py-3.5 font-bold font-mono text-rose-400">{alert.risk_score}</td>
                    <td className="py-3.5 max-w-md">
                      <p className="font-medium text-slate-200 truncate">{alert.title}</p>
                      <p className="text-[11px] text-slate-400 truncate">{alert.summary}</p>
                    </td>
                    <td className="py-3.5">
                      <Badge variant={alert.status}>{alert.status.replace('_', ' ')}</Badge>
                    </td>
                    <td className="py-3.5 text-right">
                      <Link
                        to={`/app/alerts/${alert.id}`}
                        className="inline-flex items-center gap-1 text-brand-400 hover:text-brand-300 font-semibold px-2.5 py-1.5 rounded-lg bg-brand-500/10 hover:bg-brand-500/20 transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Inspect</span>
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
