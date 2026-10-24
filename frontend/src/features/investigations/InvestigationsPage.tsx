import React, { useState } from 'react';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { CheckCircle2 } from 'lucide-react';

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
    investigator: 'AJ / Tier-2 AML',
    status: 'in_progress',
    summary: 'Corroborating high velocity layering burst across newly activated mule accounts.',
  },
  {
    id: 'CASE-2026-079',
    case_title: 'Layering Loop Multi-hop Verification',
    target_account: 'ACC-3120',
    opened_at: '2026-10-24 11:30',
    investigator: 'Investigator Unit',
    status: 'completed',
    summary: 'Confirmed legitimate inter-subsidiary liquidity sweep after compliance document validation.',
    verdict: 'FALSE_POSITIVE_RESOLVED',
  },
];

export const InvestigationsPage: React.FC = () => {
  const [cases] = useState<InvestigationDocket[]>(INITIAL_CASES);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white tracking-tight">
          Human-in-the-Loop Investigation Workflow
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          AML investigator docket queue, legitimacy adjudication records, and audit log history
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-4">
          {cases.map((docket) => (
            <Card
              key={docket.id}
              title={`${docket.id}: ${docket.case_title}`}
              action={
                <Badge variant={docket.status === 'completed' ? 'resolved' : 'under_review'}>
                  {docket.status.replace('_', ' ').toUpperCase()}
                </Badge>
              }
            >
              <div className="space-y-3 pt-1 text-xs">
                <p className="text-slate-300 leading-relaxed bg-surface-elevated/40 p-3 rounded-lg border border-surface-border">
                  {docket.summary}
                </p>

                <div className="grid grid-cols-3 gap-3 text-[11px] text-slate-400">
                  <div>
                    <span className="block text-slate-500">Target Account</span>
                    <span className="font-mono text-slate-200">{docket.target_account}</span>
                  </div>
                  <div>
                    <span className="block text-slate-500">Assigned Investigator</span>
                    <span className="text-slate-200">{docket.investigator}</span>
                  </div>
                  <div>
                    <span className="block text-slate-500">Docket Opened</span>
                    <span className="font-mono text-slate-200">{docket.opened_at}</span>
                  </div>
                </div>

                {docket.verdict && (
                  <div className="p-2.5 rounded-lg bg-emerald-950/40 border border-emerald-800/50 text-emerald-300 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>Adjudicated Verdict: <b className="font-mono">{docket.verdict}</b></span>
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>

        <div className="space-y-4">
          <Card title="Adjudication Statistics">
            <div className="space-y-3 pt-1 text-xs">
              <div className="flex justify-between pb-2 border-b border-surface-border">
                <span className="text-slate-400">Confirmed Fraud Cases:</span>
                <span className="font-mono font-bold text-rose-400">14 (41%)</span>
              </div>
              <div className="flex justify-between pb-2 border-b border-surface-border">
                <span className="text-slate-400">False Positives Suppressed:</span>
                <span className="font-mono font-bold text-emerald-400">18 (53%)</span>
              </div>
              <div className="flex justify-between pb-2 border-b border-surface-border">
                <span className="text-slate-400">Escalated to Law Enforcement:</span>
                <span className="font-mono font-bold text-purple-400">2 (6%)</span>
              </div>
            </div>
          </Card>

          <Card title="Feedback Loop to ML">
            <p className="text-xs text-slate-400 leading-relaxed">
              Decisions committed in the investigation workflow generate labeled ground-truth deltas used for offline retraining and threshold recalibration.
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
};
