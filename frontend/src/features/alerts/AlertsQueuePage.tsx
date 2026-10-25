import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { apiService } from '../../services/api';
import { RiskAlert } from '../../types';
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
    <div className="space-y-8 max-w-[1400px] mx-auto pb-12">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-neutral-900">
          Risk Alerts Queue
        </h1>
        <p className="text-xs text-neutral-500 mt-1">
          Review, prioritize, and initiate deep-dives on anomalous financial patterns
        </p>
      </div>

      <div className="bg-white border border-neutral-100 rounded-3xl p-6 shadow-sm">
        {/* Filters row with Pill Buttons */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 mb-6 border-b border-neutral-100">
          <div className="flex flex-wrap items-center gap-2">
            <Filter className="w-4 h-4 text-neutral-400 mr-1" />
            <span className="text-xs text-neutral-400 font-medium mr-1">Severity:</span>
            <div className="flex flex-wrap gap-1.5">
              {SEVERITY_FILTERS.map((sev) => (
                <button
                  key={sev}
                  onClick={() => setFilterSeverity(sev)}
                  className={`text-xs font-semibold px-4 py-1.5 rounded-full capitalize transition-all ${
                    filterSeverity === sev
                      ? 'bg-neutral-900 text-white shadow-xs'
                      : 'bg-neutral-50 text-neutral-600 hover:bg-neutral-100 border border-neutral-200/60'
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
              placeholder="Search alert ID or account..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-[#f4f5f7] border-0 rounded-full px-4 py-2 text-xs text-neutral-800 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-300 transition-all"
            />
          </div>
        </div>

        {filteredAlerts.length === 0 ? (
          <div className="py-12 text-center text-neutral-400">
            <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-xs">No alerts match the current filters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-neutral-100 text-neutral-400 font-medium">
                  <th className="pb-3 font-medium">Alert ID</th>
                  <th className="pb-3 font-medium">Account ID</th>
                  <th className="pb-3 font-medium">Severity</th>
                  <th className="pb-3 font-medium">Risk Score</th>
                  <th className="pb-3 font-medium">Detection Summary</th>
                  <th className="pb-3 font-medium">Status</th>
                  <th className="pb-3 font-medium text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-50">
                {filteredAlerts.map((alert) => {
                  const isCritical = alert.severity === 'critical';
                  const isHigh = alert.severity === 'high';
                  return (
                    <tr key={alert.id} className="hover:bg-neutral-50/60 transition-colors group">
                      <td className="py-3.5 font-semibold">
                        <Link to={`/alerts/${alert.id}`} className="text-neutral-900 hover:text-blue-600 transition-colors">
                          {alert.id}
                        </Link>
                      </td>
                      <td className="py-3.5">
                        <Link to={`/accounts/${alert.account_id}`} className="font-medium text-neutral-600 hover:text-neutral-900">
                          {alert.account_id}
                        </Link>
                      </td>
                      <td className="py-3.5">
                        <span className="inline-flex items-center gap-1.5 text-xs font-medium">
                          <span className={`w-1.5 h-1.5 rounded-full ${
                            isCritical ? 'bg-rose-500' : isHigh ? 'bg-amber-400' : 'bg-emerald-500'
                          }`} />
                          <span className={isCritical ? 'text-rose-700' : isHigh ? 'text-amber-700' : 'text-emerald-700'}>
                            {alert.severity.toUpperCase()}
                          </span>
                        </span>
                      </td>
                      <td className="py-3.5 font-bold text-neutral-900">
                        {alert.risk_score} / 100
                      </td>
                      <td className="py-3.5 text-neutral-600 max-w-xs truncate">
                        {alert.detection_rule}
                      </td>
                      <td className="py-3.5">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-neutral-100 text-neutral-700 uppercase">
                          {alert.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="py-3.5 text-right">
                        <Link
                          to={`/alerts/${alert.id}`}
                          className="inline-flex items-center gap-1.5 text-xs font-semibold text-neutral-700 hover:text-neutral-900 bg-neutral-50 hover:bg-neutral-100 border border-neutral-200/80 px-3 py-1.5 rounded-full transition-colors shadow-xs"
                        >
                          <Eye className="w-3 h-3 text-neutral-400" />
                          <span>Triage</span>
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
