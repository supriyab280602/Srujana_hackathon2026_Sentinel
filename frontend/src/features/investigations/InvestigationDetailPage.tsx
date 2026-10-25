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
    setStatusMessage(`Investigation verdict successfully recorded as ${actionLabel}. Compliance audit log updated.`);
  };

  if (loading) {
    return <div className="p-12 text-center text-xs text-ink-muted">Loading investigation case...</div>;
  }

  if (!caseItem) {
    return (
      <div className="space-y-4 max-w-[1440px] mx-auto">
        <Link to="/investigations" className="text-xs text-brand-600 flex items-center gap-1 font-semibold">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Investigations Queue
        </Link>
        <div className="bg-surface border border-surface-border rounded-xl p-6 shadow-xs">
          <h2 className="text-sm font-bold text-ink">Docket Not Found</h2>
          <p className="text-xs text-ink-muted mt-1">Investigation docket {targetId} could not be found.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5 max-w-[1440px] mx-auto pb-10">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-1.5 mb-1.5 text-xs text-ink-muted">
            <Link to="/investigations" className="hover:text-ink transition-colors">Investigations</Link>
            <span>/</span>
            <span className="font-mono font-semibold text-ink">{caseItem.id}</span>
          </div>
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-xl font-bold tracking-tight text-ink font-mono">{caseItem.id}: {caseItem.case_title}</h1>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-red-50 text-red-700 border border-red-200 uppercase">
              {caseItem.priority} PRIORITY
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-surface-elevated text-ink-secondary border border-surface-border uppercase">
              {caseItem.status.replace('_', ' ')}
            </span>
          </div>
          <p className="text-xs text-ink-muted mt-1">
            Target Account: <Link to={`/accounts/${caseItem.target_account}`} className="font-mono font-bold text-brand-700 hover:text-brand-900">{caseItem.target_account}</Link> • Assigned to {caseItem.investigator}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to={`/network?account=${caseItem.target_account}`}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-brand-950 hover:bg-slate-800 text-xs font-semibold text-white transition-colors shadow-xs"
          >
            <Network className="w-3.5 h-3.5 text-blue-400" />
            <span>Launch Replay on Graph</span>
          </Link>
        </div>
      </div>

      {statusMessage && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 text-xs font-medium flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
          <span>{statusMessage}</span>
        </div>
      )}

      {/* Main Investigation Dossier Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left 8 cols: Summary, Evidence Items, Notes History */}
        <div className="lg:col-span-8 space-y-4">
          <div className="bg-surface border border-surface-border rounded-xl p-5 shadow-xs space-y-3.5">
            <h2 className="text-xs font-bold text-ink uppercase tracking-wider">Investigation Summary &amp; Allegation</h2>
            <p className="text-ink-secondary text-xs leading-relaxed bg-surface-elevated p-3.5 rounded-lg border border-surface-border">
              {caseItem.summary}
            </p>

            {caseItem.verdict && (
              <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center gap-2 text-xs font-medium">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                <span>Adjudicated Verdict: <b className="font-mono font-bold text-emerald-900">{caseItem.verdict}</b></span>
              </div>
            )}
          </div>

          {/* Evidence Dossier Items */}
          <div className="bg-surface border border-surface-border rounded-xl p-5 shadow-xs space-y-3.5">
            <div>
              <h2 className="text-xs font-bold text-ink uppercase tracking-wider">
                Evidence Exhibits &amp; Anomaly Signals
              </h2>
              <p className="text-[11px] text-ink-muted mt-0.5">Verified technical evidence items collected under zero-lookahead temporal integrity</p>
            </div>
            <div className="space-y-2.5">
              {caseItem.evidence_items.map((ev) => (
                <div key={ev.id} className="p-3.5 rounded-lg bg-surface-elevated border border-surface-border space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-ink flex items-center gap-2">
                      <span className="font-mono font-bold text-brand-700 text-xs">{ev.id}</span>
                      <span className="text-xs font-bold text-ink">{ev.title}</span>
                    </span>
                    <span className="font-mono font-bold text-brand-700 text-[10px] bg-brand-50 px-2 py-0.5 rounded border border-brand-200">
                      {(ev.confidence * 100).toFixed(0)}% Confidence
                    </span>
                  </div>
                  <p className="text-ink-secondary text-xs leading-relaxed">{ev.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Notes & Audit Trail History */}
          <div className="bg-surface border border-surface-border rounded-xl p-5 shadow-xs space-y-3.5">
            <h2 className="text-xs font-bold text-ink uppercase tracking-wider">Investigator Action Log &amp; Audit Trail</h2>
            <div className="space-y-2.5 text-xs">
              <div className="divide-y divide-surface-border">
                {caseItem.notes_history.map((entry, idx) => (
                  <div key={idx} className="py-2.5 first:pt-0 last:pb-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="font-semibold text-ink flex items-center gap-1.5 text-xs">
                        <User className="w-3.5 h-3.5 text-brand-600" /> {entry.author}
                      </span>
                      <span className="text-ink-muted font-mono flex items-center gap-1 text-[10px]">
                        <Clock className="w-3 h-3" /> {entry.timestamp}
                      </span>
                    </div>
                    <p className="text-ink-secondary text-xs pl-5 leading-relaxed">{entry.note}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right 4 cols: Adjudication Action Panel */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-surface border border-surface-border rounded-xl p-4 shadow-xs space-y-3">
            <h2 className="text-xs font-bold text-ink uppercase tracking-wider">Adjudication Decision</h2>
            <p className="text-[11px] text-ink-muted">Submit official compliance determination</p>

            <div>
              <label className="block text-[11px] font-semibold text-ink-secondary mb-1">Add Case Note</label>
              <textarea
                rows={3}
                placeholder="Record compliance justification..."
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                className="w-full bg-surface-elevated border border-surface-border rounded-lg p-2.5 text-xs text-ink placeholder:text-ink-muted focus:outline-none focus:ring-1 focus:ring-brand-500 font-sans resize-none"
              />
            </div>

            <div className="space-y-1.5 pt-1">
              <button
                onClick={() => handleVerdict('CONFIRMED_FRAUD')}
                className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-semibold shadow-xs transition-colors"
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Confirm Mule Syndicate (SAR Filing)</span>
              </button>
              <button
                onClick={() => handleVerdict('FALSE_POSITIVE')}
                className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-surface-elevated hover:bg-slate-200 text-ink text-xs font-semibold border border-surface-border transition-colors"
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Clear as False Positive</span>
              </button>
              <button
                onClick={() => handleVerdict('ESCALATED')}
                className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-surface hover:bg-surface-elevated text-ink-secondary border border-surface-border text-xs font-semibold transition-colors"
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Escalate to High-Risk FinCEN Review</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
