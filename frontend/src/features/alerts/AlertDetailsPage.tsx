import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { apiService } from '../../services/api';
import { RiskAlert } from '../../types';
import {
  ArrowLeft,
  Network,
  CheckCircle,
  AlertTriangle,
  Layers,
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
    setSubmittedMessage(`Decision '${decision.replace('_', ' ')}' logged successfully.`);
  };

  if (loading) {
    return <div className="p-8 text-center text-xs text-slate-400">Loading alert details...</div>;
  }

  if (!alert) {
    return (
      <div className="space-y-4">
        <Link to="/app/alerts" className="text-xs text-brand-400 flex items-center gap-1">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Alerts Queue
        </Link>
        <Card title="Alert Not Found">
          <p className="text-xs text-slate-400">The requested alert identifier does not exist or has been archived.</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Navigation & Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <Link to="/app/alerts" className="text-xs text-brand-400 hover:text-brand-300 flex items-center gap-1 mb-2 font-medium">
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Alerts Queue
          </Link>
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold text-white tracking-tight">{alert.id}</h2>
            <Badge variant={alert.severity}>{alert.severity.toUpperCase()}</Badge>
            <Badge variant={alert.status}>{alert.status.replace('_', ' ')}</Badge>
          </div>
          <p className="text-xs text-slate-400 mt-1">{alert.title}</p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to={`/app/network?account=${alert.account_id}`}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-surface-elevated hover:bg-slate-700 text-xs font-semibold text-brand-400 border border-brand-500/30 transition-colors shadow-sm"
          >
            <Network className="w-4 h-4" />
            <span>Trace In Graph Explorer</span>
          </Link>
        </div>
      </div>

      {submittedMessage && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-emerald-400 text-xs flex items-center gap-2">
          <CheckCircle className="w-4 h-4 shrink-0" />
          <span>{submittedMessage}</span>
        </div>
      )}

      {/* Grid: Details & Explainable Risk Scoring */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Context & Metadata */}
        <div className="lg:col-span-2 space-y-6">
          <Card title="Signal Summary &amp; Anomaly Narrative">
            <div className="space-y-3 text-xs">
              <p className="text-slate-300 leading-relaxed bg-surface-elevated/40 p-3.5 rounded-lg border border-surface-border/60">
                {alert.summary}
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
                <div className="bg-surface-elevated/40 p-3 rounded-lg border border-surface-border">
                  <span className="text-slate-400 block text-[11px]">Associated Account</span>
                  <span className="font-mono font-semibold text-slate-200">{alert.account_id}</span>
                </div>
                <div className="bg-surface-elevated/40 p-3 rounded-lg border border-surface-border">
                  <span className="text-slate-400 block text-[11px]">Triggering Txn</span>
                  <span className="font-mono font-semibold text-slate-200">{alert.transaction_id}</span>
                </div>
                <div className="bg-surface-elevated/40 p-3 rounded-lg border border-surface-border">
                  <span className="text-slate-400 block text-[11px]">Detection Engine</span>
                  <span className="font-mono font-semibold text-amber-400">{alert.detection_rule}</span>
                </div>
              </div>
            </div>
          </Card>

          {/* Feature 2: Explainable Risk Scoring Breakdown */}
          <Card
            title="Explainable Risk Factors &amp; Model Weights"
            subtitle="Feature-level attribution scoring indicating why this transaction breached thresholds"
          >
            <div className="space-y-4 pt-1">
              {alert.factors.map((factor, idx) => (
                <div key={idx} className="bg-surface-elevated/30 p-3.5 rounded-lg border border-surface-border/50">
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="font-semibold text-slate-200">{factor.name}</span>
                    <span className="font-mono text-rose-400 font-bold">+{factor.contribution.toFixed(1)} pts</span>
                  </div>
                  <p className="text-[11px] text-slate-400 mb-2">{factor.description}</p>
                  <div className="w-full bg-surface-elevated h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-amber-500 to-rose-500 h-full rounded-full"
                      style={{ width: `${Math.min(factor.weight * 100, 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Right Column: Risk Adjudication / Human-in-the-Loop */}
        <div className="space-y-6">
          <Card title="Risk Scoring Verdict">
            <div className="text-center py-4 border-b border-surface-border/60">
              <span className="text-5xl font-black text-rose-500 font-mono tracking-tight">{alert.risk_score}</span>
              <span className="text-slate-400 text-xs block mt-1 font-mono">/ 100 Risk Index</span>
              <p className="text-xs text-rose-400 mt-2 font-medium">Critical Action Threshold Exceeded</p>
            </div>
            <div className="pt-3 text-[11px] text-slate-400 space-y-2">
              <div className="flex items-center justify-between">
                <span>Model Confidence</span>
                <span className="font-mono text-slate-200">92.4%</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Ground Truth Masked</span>
                <span className="text-emerald-400">Yes (Strict Inference)</span>
              </div>
            </div>
          </Card>

          {/* Adjudication Form */}
          <Card title="Investigator Action &amp; Triage" subtitle="Log human decision and structured notes">
            <div className="space-y-3 pt-1">
              <label className="block text-xs font-medium text-slate-300">Investigator Notes</label>
              <textarea
                rows={3}
                placeholder="Enter rationale for confirmation or false-positive classification..."
                value={reviewNote}
                onChange={(e) => setReviewNote(e.target.value)}
                className="w-full bg-surface-elevated border border-surface-border rounded-lg p-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-brand-500"
              />

              <div className="grid grid-cols-1 gap-2 pt-2">
                <Button
                  onClick={() => handleDecision('confirm_fraud')}
                  variant="danger"
                  size="sm"
                  className="w-full"
                >
                  <AlertTriangle className="w-3.5 h-3.5 mr-1" />
                  Confirm Fraudulent Pattern
                </Button>
                <Button
                  onClick={() => handleDecision('false_positive')}
                  variant="secondary"
                  size="sm"
                  className="w-full"
                >
                  <CheckCircle className="w-3.5 h-3.5 mr-1" />
                  Dismiss as False Positive
                </Button>
                <Button
                  onClick={() => handleDecision('needs_escalation')}
                  variant="outline"
                  size="sm"
                  className="w-full"
                >
                  <Layers className="w-3.5 h-3.5 mr-1" />
                  Escalate to Tier-3 AML
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
