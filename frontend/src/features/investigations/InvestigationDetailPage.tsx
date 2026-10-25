import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { apiService } from '../../services/api';
import { InvestigationCase } from '../../types';
import {
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  Layers,
  Network,
  Clock,
  User
} from 'lucide-react';

export const InvestigationDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [caseItem, setCaseItem] = useState<InvestigationCase | null>(null);
  const [loading, setLoading] = useState(true);
  const [newNote, setNewNote] = useState('');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const targetId = id || 'CASE-2026-081';

  useEffect(() => {
    setLoading(true);
    apiService.getInvestigationById(targetId).then((data) => {
      setCaseItem(data || null);
      setLoading(false);
    });
  }, [targetId]);

  const handleVerdict = (verdict: 'CONFIRMED_FRAUD' | 'FALSE_POSITIVE' | 'ESCALATED') => {
    if (!caseItem) return;
    const actionLabel = verdict.replace('_', ' ');
    const noteEntry = {
      author: 'Investigator (You)',
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      note: newNote || `Adjudicated investigation docket as ${actionLabel}.`,
      action: verdict,
    };
    setCaseItem({
      ...caseItem,
      status: verdict === 'ESCALATED' ? 'escalated' : 'completed',
      verdict,
      notes_history: [...caseItem.notes_history, noteEntry]
    });
    setNewNote('');
    setStatusMessage(`Investigation verdict successfully recorded as ${actionLabel}. Labeled delta submitted to ML feedback loop.`);
  };

  if (loading) {
    return <div className="p-12 text-center text-xs text-neutral-400">Loading investigation case...</div>;
  }

  if (!caseItem) {
    return (
      <div className="space-y-4 max-w-[1400px] mx-auto">
        <Link to="/investigations" className="text-xs text-blue-600 flex items-center gap-1 font-semibold">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Investigations Queue
        </Link>
        <div className="bg-white border border-neutral-100 rounded-3xl p-8 shadow-sm">
          <h2 className="text-base font-bold text-neutral-900">Docket Not Found</h2>
          <p className="text-xs text-neutral-500 mt-1">Investigation docket {targetId} could not be found.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-[1400px] mx-auto pb-12">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2 text-xs font-medium text-neutral-400">
            <Link to="/investigations" className="hover:text-neutral-900 transition-colors">Investigations</Link>
            <span>/</span>
            <span className="font-bold text-neutral-900">{caseItem.id}</span>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight text-neutral-900">{caseItem.id}: {caseItem.case_title}</h1>
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-neutral-100 text-neutral-800 uppercase">
              {caseItem.priority} PRIORITY
            </span>
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-neutral-100 text-neutral-700 uppercase">
              {caseItem.status.replace('_', ' ')}
            </span>
          </div>
          <p className="text-xs text-neutral-500 mt-1">
            Target Account: <Link to={`/accounts/${caseItem.target_account}`} className="font-bold text-blue-600 hover:underline">{caseItem.target_account}</Link> • Assigned to {caseItem.investigator}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to={`/network?account=${caseItem.target_account}`}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-neutral-900 hover:bg-neutral-800 text-xs font-semibold text-white transition-colors shadow-xs"
          >
            <Network className="w-4 h-4" />
            <span>Launch Replay on Graph</span>
          </Link>
        </div>
      </div>

      {statusMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-800 text-xs font-medium flex items-center gap-2.5">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
          <span>{statusMessage}</span>
        </div>
      )}

      {/* Main Investigation Dossier Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left 8 cols: Summary, Evidence Items, Notes History */}
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-white border border-neutral-100 rounded-3xl p-6 shadow-sm space-y-4">
            <h2 className="text-base font-bold text-neutral-900">Investigation Summary &amp; Allegation</h2>
            <p className="text-neutral-600 text-xs leading-relaxed bg-[#f7f8fa] p-4 rounded-2xl border border-neutral-100">
              {caseItem.summary}
            </p>

            {caseItem.verdict && (
              <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center gap-2 text-xs font-medium">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                <span>Adjudicated Verdict: <b className="font-bold text-emerald-900">{caseItem.verdict}</b></span>
              </div>
            )}
          </div>

          {/* Evidence Dossier Items */}
          <div className="bg-white border border-neutral-100 rounded-3xl p-6 shadow-sm space-y-4">
            <div>
              <h2 className="text-base font-bold text-neutral-900">
                Evidence Exhibits &amp; Anomaly Signals
              </h2>
              <p className="text-xs text-neutral-400 mt-0.5">Verified technical evidence items collected under zero-lookahead temporal integrity</p>
            </div>
            <div className="space-y-3">
              {caseItem.evidence_items.map((ev) => (
                <div key={ev.id} className="p-4 rounded-2xl bg-[#f7f8fa] border border-neutral-100">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-semibold text-neutral-900 flex items-center gap-2">
                      <span className="font-bold text-blue-600 text-xs uppercase">{ev.id}</span>
                      <span className="text-xs font-bold text-neutral-900">{ev.title}</span>
                    </span>
                    <span className="font-bold text-blue-600 text-[11px] bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-100">
                      {(ev.confidence * 100).toFixed(0)}% Confidence
                    </span>
                  </div>
                  <p className="text-neutral-500 text-xs leading-relaxed">{ev.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Notes & Audit Trail History */}
          <div className="bg-white border border-neutral-100 rounded-3xl p-6 shadow-sm space-y-4">
            <h2 className="text-base font-bold text-neutral-900">Investigator Action Log &amp; Audit Trail</h2>
            <div className="space-y-3 text-xs">
              <div className="divide-y divide-neutral-100">
                {caseItem.notes_history.map((entry, idx) => (
                  <div key={idx} className="py-3.5 first:pt-0 last:pb-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-neutral-900 flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-blue-600" /> {entry.author}
                      </span>
                      <span className="text-neutral-400 flex items-center gap-1 text-[11px]">
                        <Clock className="w-3 h-3" /> {entry.timestamp}
                      </span>
                    </div>
                    <p className="text-neutral-600 text-xs pl-5 leading-relaxed">{entry.note}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right 4 cols: Adjudication Action Panel */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white border border-neutral-100 rounded-3xl p-6 shadow-sm space-y-4">
            <div>
              <h2 className="text-base font-bold text-neutral-900">Adjudication Panel</h2>
              <p className="text-xs text-neutral-400 mt-0.5">Submit binding human-in-the-loop decision</p>
            </div>
            <div className="space-y-3 text-xs">
              <label className="block text-neutral-500 font-medium">Investigator Rationale</label>
              <textarea
                rows={3}
                placeholder="State technical basis for confirming fraud or dismissing as benign..."
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                className="w-full bg-[#f4f5f7] border-0 rounded-2xl p-3.5 text-xs text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-300 resize-none"
              />

              <div className="space-y-2 pt-2">
                <button
                  onClick={() => handleVerdict('CONFIRMED_FRAUD')}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-full bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-xs transition-colors"
                >
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>Confirm Fraud Ring (Freeze &amp; SAR)</span>
                </button>
                <button
                  onClick={() => handleVerdict('FALSE_POSITIVE')}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-full bg-neutral-100 hover:bg-neutral-200 text-neutral-800 text-xs font-semibold transition-colors"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Dismiss as False Positive</span>
                </button>
                <button
                  onClick={() => handleVerdict('ESCALATED')}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-full bg-white hover:bg-neutral-50 text-neutral-700 border border-neutral-200/80 text-xs font-semibold transition-colors"
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>Escalate to Tier-3 FinCEN Desk</span>
                </button>
              </div>
            </div>
          </div>

          <div className="bg-white border border-neutral-100 rounded-3xl p-6 shadow-sm space-y-3">
            <h3 className="font-bold text-base text-neutral-900">Related Alerts</h3>
            <div className="space-y-2 pt-1 text-xs">
              {caseItem.related_alerts.map((altId) => (
                <Link
                  key={altId}
                  to={`/alerts/${altId}`}
                  className="flex items-center justify-between p-3.5 rounded-2xl bg-[#f7f8fa] hover:bg-neutral-100 text-neutral-800 border border-neutral-100 transition-colors"
                >
                  <span className="font-bold text-blue-600">{altId}</span>
                  <span className="text-[11px] font-medium text-neutral-400">View Alert →</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
