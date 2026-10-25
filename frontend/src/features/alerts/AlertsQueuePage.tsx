import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { apiService } from '../../services/api';
import { RiskAlert } from '../../types';
import { formatINR } from '../../utils/formatters';
import { Filter, Eye, AlertCircle } from 'lucide-react';

const SEVERITY_FILTERS = ['all', 'critical', 'high', 'medium', 'low'] as const;

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
    <div className="space-y-5 max-w-[1440px] mx-auto pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-ink">
            Risk Alerts Queue
          </h1>
          <p className="text-xs text-ink-secondary mt-0.5">
            Review, prioritize, and initiate deep-dives on anomalous financial patterns and syndicate fanouts
          </p>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-red-50 text-red-700 border border-red-200 font-mono">
            {alerts.filter(a => a.severity === 'critical').length} Critical Unresolved
          </span>
        </div>
      </div>

      <div className="bg-surface border border-surface-border rounded-xl p-5 shadow-xs">
        {/* Filters row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 mb-4 border-b border-surface-border">
          <div className="flex flex-wrap items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-ink-muted mr-1" />
            <span className="text-[11px] text-ink-muted font-medium mr-1 uppercase tracking-wider">Severity:</span>
            <div className="flex flex-wrap gap-1">
              {SEVERITY_FILTERS.map((sev) => (
                <button
                  key={sev}
                  onClick={() => setFilterSeverity(sev)}
                  className={`text-xs font-medium px-2.5 py-1 rounded-md capitalize transition-all ${
                    filterSeverity === sev
                      ? 'bg-brand-950 text-white shadow-xs font-semibold'
                      : 'bg-surface-elevated text-ink-secondary hover:bg-surface border border-surface-border'
                  }`}
                >
                  {sev}
                </button>
              ))}
            </div>
          </div>

          <div className="w-full sm:w-72">
            <input
              type="text"
              placeholder="Search alert ID, rule, or account..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-surface-elevated border border-surface-border rounded-lg px-3 py-1.5 text-xs text-ink placeholder:text-ink-muted focus:outline-none focus:ring-1 focus:ring-brand-500 font-sans"
            />
          </div>
        </div>

        {filteredAlerts.length === 0 ? (
          <div className="py-12 text-center text-ink-muted">
            <AlertCircle className="w-7 h-7 mx-auto mb-2 opacity-40 text-brand-600" />
            <p className="text-xs">No alerts match the selected criteria.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-surface-border text-ink-muted font-semibold text-[11px] uppercase tracking-wider">
                  <th className="pb-2.5 font-medium">Alert ID</th>
                  <th className="pb-2.5 font-medium">Target Account</th>
                  <th className="pb-2.5 font-medium">Severity</th>
                  <th className="pb-2.5 font-medium text-right">Risk Score</th>
                  <th className="pb-2.5 font-medium text-right">Exposure Value</th>
                  <th className="pb-2.5 font-medium">Detection Trigger Rule</th>
                  <th className="pb-2.5 font-medium text-center">Status</th>
                  <th className="pb-2.5 font-medium text-right">Triage Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border">
                {filteredAlerts.map((alert) => {
                  const isCritical = alert.severity === 'critical';
                  const isHigh = alert.severity === 'high';
                  const exposureAmount = (alert.risk_score || 70) * 1250;

                  return (
                    <tr key={alert.id} className="hover:bg-surface-elevated/70 transition-colors group">
                      <td className="py-2.5 font-mono text-ink-secondary text-[11px] font-semibold whitespace-nowrap">
                        <Link to={`/alerts/${alert.id}`} className="hover:text-brand-600">
                          {alert.id}
                        </Link>
                      </td>
                      <td className="py-2.5 font-mono text-[11px] whitespace-nowrap">
                        <Link to={`/accounts/${alert.account_id}`} className="font-semibold text-brand-700 hover:text-brand-900">
                          {alert.account_id}
                        </Link>
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
                      <td className="py-2.5 text-right font-mono text-xs font-semibold tabular-nums whitespace-nowrap">
                        <span className={alert.risk_score > 75 ? 'text-risk-critical' : 'text-risk-medium'}>
                          {alert.risk_score}/100
                        </span>
                      </td>
                      <td className="py-2.5 text-right font-mono text-xs font-bold tabular-nums text-ink whitespace-nowrap">
                        {formatINR(exposureAmount)}
                      </td>
                      <td className="py-2.5 text-ink-secondary text-xs max-w-xs truncate">
                        <span className="font-mono text-[11px] text-ink">{alert.detection_rule}</span>
                        <span className="text-[10px] text-ink-muted block truncate">{alert.summary}</span>
                      </td>
                      <td className="py-2.5 text-center whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-surface-elevated text-ink-secondary border border-surface-border uppercase">
                          {alert.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="py-2.5 text-right whitespace-nowrap">
                        <Link
                          to={`/alerts/${alert.id}`}
                          className="inline-flex items-center gap-1 text-[11px] font-semibold text-brand-700 hover:text-brand-900 bg-brand-50 hover:bg-brand-100 border border-brand-200 px-2.5 py-1 rounded-md transition-colors"
                        >
                          <Eye className="w-3 h-3 text-brand-600" />
                          <span>Adjudicate</span>
                        </Link>
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
  );
};
