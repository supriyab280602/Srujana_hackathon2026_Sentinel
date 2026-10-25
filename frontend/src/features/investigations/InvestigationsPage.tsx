import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, ArrowRight, ClipboardList } from 'lucide-react';

interface InvestigationDocket {
  id: string;
  case_title: string;
  target_account: string;
  opened_at: string;
  investigator: string;
  status: 'in_progress' | 'completed' | 'escalated';
  summary: string;
  verdict?: string;
}

const INITIAL_CASES: InvestigationDocket[] = [
  {
    id: 'CASE-2026-081',
    case_title: 'Structured Fanout via Rapid ACH',
    target_account: 'ACC-7749',
    opened_at: '2026-10-24 14:15',
    investigator: 'AJ / Tier-2 AML Desk',
    status: 'in_progress',
    summary: 'Corroborating high velocity layering burst across newly activated mule accounts with immediate exit to offshore crypto rails.',
  },
  {
    id: 'CASE-2026-079',
    case_title: 'Layering Loop Multi-Hop Verification',
    target_account: 'ACC-3120',
    opened_at: '2026-10-24 11:30',
    investigator: 'Compliance Desk Unit',
    status: 'completed',
    summary: 'Confirmed legitimate inter-subsidiary liquidity sweep after corporate treasury compliance document validation.',
    verdict: 'FALSE_POSITIVE_RESOLVED',
  },
];

export const InvestigationsPage: React.FC = () => {
  const [cases] = useState<InvestigationDocket[]>(INITIAL_CASES);

  return (
    <div className="space-y-5 max-w-[1440px] mx-auto pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-ink">
            Human-in-the-Loop Investigation Workflow
          </h1>
          <p className="text-xs text-ink-secondary mt-0.5">
            Compliance docket queue, legitimacy adjudication records, and immutable regulatory audit trail
          </p>
        </div>
        <div className="flex items-center gap-1.5 text-xs font-semibold text-brand-700 bg-brand-50 border border-brand-200 px-3 py-1.5 rounded-lg shadow-xs self-start sm:self-auto">
          <ClipboardList className="w-3.5 h-3.5 text-brand-600" />
          <span>Active AML Dockets · {cases.length} Open</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Cases list (8 cols) */}
        <div className="lg:col-span-8 space-y-4">
          {cases.map((docket) => {
            const isDone = docket.status === 'completed';
            return (
              <div key={docket.id} className="bg-surface border border-surface-border rounded-xl p-5 shadow-xs space-y-3.5">
                <div className="flex items-center justify-between pb-3 border-b border-surface-border">
                  <div>
                    <h2 className="text-sm font-bold text-ink">
                      <Link to={`/investigations/${docket.id}`} className="hover:text-brand-600">
                        {docket.id}: {docket.case_title}
                      </Link>
                    </h2>
                    <p className="text-[11px] text-ink-muted mt-0.5">Assigned to {docket.investigator} • Opened {docket.opened_at}</p>
                  </div>
                  <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-mono font-semibold ${
                    isDone ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'
                  }`}>
                    <span className={`w-1 h-1 rounded-full ${isDone ? 'bg-emerald-500' : 'bg-amber-400'}`} />
                    {docket.status.replace('_', ' ').toUpperCase()}
                  </span>
                </div>

                <p className="text-ink-secondary text-xs leading-relaxed bg-surface-elevated p-3.5 rounded-lg border border-surface-border">
                  {docket.summary}
                </p>

                <div className="grid grid-cols-3 gap-2.5 text-xs pt-0.5">
                  <div className="bg-surface-elevated p-2.5 rounded-lg border border-surface-border">
                    <span className="block text-[10px] text-ink-muted font-medium uppercase tracking-wider mb-0.5">Target Account</span>
                    <Link to={`/accounts/${docket.target_account}`} className="font-mono font-bold text-brand-700 hover:text-brand-900">
                      {docket.target_account}
                    </Link>
                  </div>
                  <div className="bg-surface-elevated p-2.5 rounded-lg border border-surface-border">
                    <span className="block text-[10px] text-ink-muted font-medium uppercase tracking-wider mb-0.5">Lead Investigator</span>
                    <span className="font-semibold text-ink">{docket.investigator}</span>
                  </div>
                  <div className="bg-surface-elevated p-2.5 rounded-lg border border-surface-border">
                    <span className="block text-[10px] text-ink-muted font-medium uppercase tracking-wider mb-0.5">Opened Timestamp</span>
                    <span className="font-mono text-ink text-[11px]">{docket.opened_at}</span>
                  </div>
                </div>

                {docket.verdict && (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 flex items-center gap-2 font-medium">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Adjudicated Verdict: <b className="font-mono font-bold">{docket.verdict}</b></span>
                  </div>
                )}

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-surface-border">
                  <Link
                    to={`/network?account=${docket.target_account}`}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-surface hover:bg-surface-elevated text-xs font-semibold text-ink-secondary border border-surface-border transition-colors"
                  >
                    <span>Trace Graph</span>
                  </Link>
                  <Link
                    to={`/investigations/${docket.id}`}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-brand-950 hover:bg-slate-800 text-xs font-semibold text-white transition-colors"
                  >
                    <span>Open Case Dossier</span>
                    <ArrowRight className="w-3.5 h-3.5 text-blue-400" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>

        {/* Right Info (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-surface border border-surface-border rounded-xl p-4 shadow-xs space-y-3">
            <h2 className="text-xs font-bold text-ink uppercase tracking-wider">Regulatory Standards</h2>
            <div className="text-xs text-ink-secondary space-y-2 leading-relaxed">
              <p>
                Sentinel requires dual-key signoff for all SAR (Suspicious Activity Report) submissions over compliance thresholds.
              </p>
              <p>
                Cleared false positives are automatically fed into the active ML training feedback loop with strict zero-lookahead audit records.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
