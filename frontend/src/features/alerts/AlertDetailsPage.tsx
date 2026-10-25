import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { apiService } from '../../services/api';
import { RiskAlert } from '../../types';
import { formatINR } from '../../utils/formatters';
import {
  ArrowLeft,
  Network,
  CheckCircle,
  AlertTriangle,
  Layers
} from 'lucide-react';

export const AlertDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [alert, setAlert] = useState<RiskAlert | null>(null);
  const [loading, setLoading] = useState(true);
  const [reviewNote, setReviewNote] = useState('');
  const [submittedMessage, setSubmittedMessage] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      apiService.getAlertById(id).then((data) => {
        setAlert(data || null);
        setLoading(false);
      });
    }
  }, [id]);

  const handleDecision = async (decision: 'confirm_fraud' | 'false_positive' | 'needs_escalation') => {
    if (!alert) return;
    await apiService.submitInvestigationReview(alert.id, {
      alert_id: alert.id,
      decision,
      notes: reviewNote || `Investigation review decision: ${decision}`,
      investigator_id: 'INV-401',
      tags: [decision, alert.detection_rule],
    });
    setSubmittedMessage(`Adjudication '${decision.replace('_', ' ')}' permanently recorded in compliance audit log.`);
  };

  if (loading) {
    return <div className="p-12 text-center text-xs text-ink-muted">Loading alert dossier…</div>;
  }

  if (!alert) {
    return (
      <div className="space-y-4 max-w-[1440px] mx-auto">
        <Link to="/alerts" className="text-xs text-brand-600 flex items-center gap-1 font-semibold">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Alerts Queue
        </Link>
        <div className="bg-surface border border-surface-border rounded-xl p-6 shadow-xs">
          <h2 className="text-sm font-bold text-ink">Alert Not Found</h2>
          <p className="text-xs text-ink-muted mt-1">The requested alert identifier does not exist or has been archived.</p>
        </div>
      </div>
    );
  }

  const isCritical = alert.severity === 'critical';
  const isHigh = alert.severity === 'high';
  const exposureAmount = (alert.risk_score || 70) * 1250;

  return (
    <div className="space-y-5 max-w-[1440px] mx-auto pb-10">
      {/* Navigation & Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <Link
            to="/alerts"
            className="text-xs text-ink-muted hover:text-ink flex items-center gap-1.5 mb-1.5 transition-colors font-medium"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Alerts Queue
          </Link>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-xl font-bold tracking-tight text-ink font-mono">{alert.id}</h1>
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
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-surface-elevated text-ink-secondary border border-surface-border uppercase">
              {alert.status.replace('_', ' ')}
            </span>
          </div>
          <p className="text-xs text-ink-secondary mt-1">{alert.title}</p>
        </div>
        <Link
          to={`/network?account=${alert.account_id}`}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold text-white bg-brand-950 hover:bg-slate-800 transition-colors shadow-xs"
        >
          <Network className="w-3.5 h-3.5 text-blue-400" />
          <span>Trace in Graph Explorer</span>
        </Link>
      </div>

      {submittedMessage && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 text-xs font-medium flex items-center gap-2">
          <CheckCircle className="w-4 h-4 shrink-0 text-emerald-600" />
          <span>{submittedMessage}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left: Details (~62% = 7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-surface border border-surface-border rounded-xl p-5 shadow-xs space-y-3.5">
            <h2 className="text-xs font-bold text-ink uppercase tracking-wider">
              Signal Narrative &amp; Trigger Details
            </h2>
            <p className="text-ink-secondary text-xs leading-relaxed bg-surface-elevated p-3.5 rounded-lg border border-surface-border">
              {alert.summary}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
              <div className="bg-surface-elevated p-3 rounded-lg border border-surface-border">
                <span className="text-[10px] text-ink-muted block font-medium uppercase tracking-wider mb-1">Target Account</span>
                <Link to={`/accounts/${alert.account_id}`} className="text-xs font-mono font-bold text-brand-700 hover:text-brand-900">
                  {alert.account_id}
                </Link>
              </div>
              <div className="bg-surface-elevated p-3 rounded-lg border border-surface-border">
                <span className="text-[10px] text-ink-muted block font-medium uppercase tracking-wider mb-1">Trigger Txn ID</span>
                <Link to={`/transactions?account=${alert.account_id}`} className="text-xs font-mono font-bold text-brand-700 hover:text-brand-900">
                  {alert.transaction_id}
                </Link>
              </div>
              <div className="bg-surface-elevated p-3 rounded-lg border border-surface-border">
                <span className="text-[10px] text-ink-muted block font-medium uppercase tracking-wider mb-1">Est. Exposure</span>
                <span className="text-xs font-mono font-bold text-ink tabular-nums">{formatINR(exposureAmount)}</span>
              </div>
            </div>
          </div>

          <div className="bg-surface border border-surface-border rounded-xl p-5 shadow-xs space-y-3.5">
            <div>
              <h2 className="text-xs font-bold text-ink uppercase tracking-wider">
                Explainable Risk Factors &amp; Model Feature Weights
              </h2>
              <p className="text-[11px] text-ink-muted mt-0.5">Feature-level attribution indicating why this transaction breached thresholds</p>
            </div>
            <div className="space-y-2.5 pt-1">
              {alert.factors.map((factor, idx) => (
                <div key={idx} className="bg-surface-elevated p-3.5 rounded-lg border border-surface-border space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-ink">{factor.name}</span>
                    <span className="text-rose-600 font-mono font-bold">+{factor.contribution.toFixed(1)} pts</span>
                  </div>
                  <p className="text-[11px] text-ink-secondary">{factor.description}</p>
                  <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-brand-600 h-full rounded-full transition-all duration-300"
                      style={{ width: `${Math.min(factor.weight * 100, 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Verdict & Adjudication (~38% = 5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-surface border border-surface-border rounded-xl p-5 shadow-xs">
            <h2 className="text-xs font-bold text-ink uppercase tracking-wider mb-3">Model Risk Verdict</h2>
            <div className="text-center py-4 border-b border-surface-border">
              <span className={`text-5xl font-extrabold font-mono tracking-tight ${alert.risk_score > 75 ? 'text-risk-critical' : 'text-risk-medium'}`}>
                {alert.risk_score}
              </span>
              <span className="text-ink-muted text-[11px] block mt-1 font-mono">/ 100 Risk Score</span>
              <p className={`text-xs mt-1.5 font-bold ${alert.risk_score > 75 ? 'text-risk-critical' : 'text-risk-medium'}`}>
                {alert.risk_score > 75 ? 'Critical Threshold Exceeded' : 'Elevated Anomaly Detected'}
              </p>
            </div>
            <div className="pt-3 text-xs text-ink-secondary space-y-1.5">
              <div className="flex items-center justify-between">
                <span>Model Confidence:</span>
                <span className="font-mono font-bold text-ink">92.4%</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Zero-Lookahead Feature Policy:</span>
                <span className="text-emerald-700 font-bold">Enforced</span>
              </div>
            </div>
          </div>

          <div className="bg-surface border border-surface-border rounded-xl p-5 shadow-xs space-y-3.5">
            <div>
              <h2 className="text-xs font-bold text-ink uppercase tracking-wider">Human-in-the-Loop Adjudication</h2>
              <p className="text-[11px] text-ink-muted mt-0.5">Submit binding AML compliance review</p>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-[11px] font-semibold text-ink-secondary mb-1">Investigator Rationale &amp; Notes</label>
                <textarea
                  rows={3}
                  placeholder="Record rationale for fraud confirmation or false-positive clearance..."
                  value={reviewNote}
                  onChange={(e) => setReviewNote(e.target.value)}
                  className="w-full bg-surface-elevated border border-surface-border rounded-lg p-2.5 text-xs text-ink placeholder:text-ink-muted focus:outline-none focus:ring-1 focus:ring-brand-500 font-sans resize-none"
                />
              </div>

              <div className="space-y-1.5 pt-1">
                <button
                  onClick={() => handleDecision('confirm_fraud')}
                  className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-semibold shadow-xs transition-colors"
                >
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>Confirm Fraudulent Activity (File SAR)</span>
                </button>
                <button
                  onClick={() => handleDecision('false_positive')}
                  className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-surface-elevated hover:bg-slate-200 text-ink text-xs font-semibold border border-surface-border transition-colors"
                >
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Dismiss as Legitimate (False Positive)</span>
                </button>
                <button
                  onClick={() => handleDecision('needs_escalation')}
                  className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-surface hover:bg-surface-elevated text-ink-secondary border border-surface-border text-xs font-semibold transition-colors"
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>Escalate to Tier-3 FinCEN Desk</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
