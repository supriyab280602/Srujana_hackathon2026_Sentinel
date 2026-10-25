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
    <div className="space-y-8 max-w-[1400px] mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-neutral-900">
            Investigations Workflow
          </h1>
          <p className="text-xs text-neutral-500 mt-1">
            Human-in-the-loop docket queue, legitimacy adjudication records, and regulatory audit log
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-100 px-4 py-2 rounded-full shadow-xs self-start md:self-auto">
          <ClipboardList className="w-3.5 h-3.5 text-blue-600" />
          <span>Active Dockets · {cases.length} Open</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Cases list (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          {cases.map((docket) => {
            const isDone = docket.status === 'completed';
            return (
              <div key={docket.id} className="bg-white border border-neutral-100 rounded-3xl p-6 shadow-sm space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
                  <div>
                    <h2 className="text-base font-bold text-neutral-900">{docket.id}: {docket.case_title}</h2>
                    <p className="text-[11px] text-neutral-400 mt-0.5">Assigned to {docket.investigator} • Opened {docket.opened_at}</p>
                  </div>
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
                    isDone ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${isDone ? 'bg-emerald-500' : 'bg-amber-400'}`} />
                    {docket.status.replace('_', ' ').toUpperCase()}
                  </span>
                </div>

                <p className="text-neutral-600 text-xs leading-relaxed bg-[#f7f8fa] p-4 rounded-2xl border border-neutral-100">
                  {docket.summary}
                </p>

                <div className="grid grid-cols-3 gap-3 text-xs pt-1">
                  <div className="bg-[#f7f8fa] p-3 rounded-2xl border border-neutral-100">
                    <span className="block text-[10px] text-neutral-400 font-medium mb-0.5">Target Account</span>
                    <span className="font-bold text-blue-600">{docket.target_account}</span>
                  </div>
                  <div className="bg-[#f7f8fa] p-3 rounded-2xl border border-neutral-100">
                    <span className="block text-[10px] text-neutral-400 font-medium mb-0.5">Investigator</span>
                    <span className="font-bold text-neutral-800">{docket.investigator}</span>
                  </div>
                  <div className="bg-[#f7f8fa] p-3 rounded-2xl border border-neutral-100">
                    <span className="block text-[10px] text-neutral-400 font-medium mb-0.5">Opened Timestamp</span>
                    <span className="font-bold text-neutral-800">{docket.opened_at}</span>
                  </div>
                </div>

                {docket.verdict && (
                  <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-800 flex items-center gap-2 font-medium">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Verdict: <b className="font-bold text-emerald-900">{docket.verdict}</b></span>
                  </div>
                )}

                <div className="pt-2 flex justify-end">
                  <Link
                    to={`/investigations/${docket.id}`}
                    className="inline-flex items-center gap-2 text-xs font-semibold text-neutral-900 hover:text-white bg-neutral-100 hover:bg-neutral-900 px-5 py-2.5 rounded-full transition-colors shadow-xs"
                  >
                    <span>Open Case Docket</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>

        {/* Right sidebar: Workflow guidelines (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white border border-neutral-100 rounded-3xl p-6 shadow-sm space-y-3">
            <h3 className="font-bold text-base text-neutral-900">Adjudication Metrics</h3>
            <div className="space-y-3 text-xs pt-1">
              <div className="flex justify-between items-center pb-2 border-b border-neutral-50">
                <span className="text-neutral-500 font-medium">Cases Resolved (30d)</span>
                <span className="font-bold text-neutral-900">47 Dockets</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-neutral-50">
                <span className="text-neutral-500 font-medium">False Positive Rate</span>
                <span className="font-bold text-emerald-600">3.2% (Target &lt; 5%)</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-neutral-50">
                <span className="text-neutral-500 font-medium">SAR Filing Rate</span>
                <span className="font-bold text-rose-600">14.8%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-neutral-500 font-medium">Avg Review Duration</span>
                <span className="font-bold text-neutral-900">4.2 min</span>
              </div>
            </div>
          </div>

          <div className="bg-[#f0f5ff] border border-blue-100 rounded-3xl p-6 text-xs text-neutral-700 space-y-2">
            <h4 className="font-bold text-neutral-900 text-sm">Regulatory SAR Compliance</h4>
            <p className="text-neutral-600 leading-relaxed">
              Every confirmed fraud docket automatically generates an exportable Suspicious Activity Report (SAR) with complete temporal evidence and audit integrity.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
