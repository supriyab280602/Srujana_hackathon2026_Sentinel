import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
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
    return <div className="p-12 text-center text-xs text-neutral-400">Loading alert details…</div>;
  }

  if (!alert) {
    return (
      <div className="space-y-4 max-w-[1400px] mx-auto">
        <Link to="/alerts" className="text-xs text-blue-600 flex items-center gap-1 font-semibold">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Alerts Queue
        </Link>
        <div className="bg-white border border-neutral-100 rounded-3xl p-8 shadow-sm">
          <h2 className="text-base font-bold text-neutral-900">Alert Not Found</h2>
          <p className="text-xs text-neutral-500 mt-1">The requested alert identifier does not exist or has been archived.</p>
        </div>
      </div>
    );
  }

  const isCritical = alert.severity === 'critical';
  const isHigh = alert.severity === 'high';
  const riskColor = alert.risk_score > 70 ? 'text-rose-600' : alert.risk_score > 40 ? 'text-amber-600' : 'text-emerald-600';

  return (
    <div className="space-y-8 max-w-[1400px] mx-auto pb-12">
      {/* Navigation & Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <Link
            to="/alerts"
            className="text-xs text-neutral-400 hover:text-neutral-900 flex items-center gap-1.5 mb-2 transition-colors font-medium"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Alerts Queue
          </Link>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-3xl font-bold tracking-tight text-neutral-900">{alert.id}</h1>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-neutral-100">
              <span className={`w-1.5 h-1.5 rounded-full ${isCritical ? 'bg-rose-500' : isHigh ? 'bg-amber-400' : 'bg-emerald-500'}`} />
              <span className={isCritical ? 'text-rose-700' : isHigh ? 'text-amber-700' : 'text-emerald-700'}>
                {alert.severity.toUpperCase()}
              </span>
            </span>
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-neutral-100 text-neutral-700 uppercase">
              {alert.status.replace('_', ' ')}
            </span>
          </div>
          <p className="text-xs text-neutral-500 mt-1">{alert.title}</p>
        </div>
        <Link
          to={`/network?account=${alert.account_id}`}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-semibold text-white bg-neutral-900 hover:bg-neutral-800 transition-colors shadow-xs"
        >
          <Network className="w-4 h-4" />
          <span>Trace in Graph Explorer</span>
        </Link>
      </div>

      {submittedMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-800 text-xs font-medium flex items-center gap-2.5">
          <CheckCircle className="w-4 h-4 shrink-0 text-emerald-600" />
          <span>{submittedMessage}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left: Details (~62% = 7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white border border-neutral-100 rounded-3xl p-6 shadow-sm space-y-4">
            <h2 className="text-base font-bold text-neutral-900">
              Signal Summary &amp; Narrative
            </h2>
            <p className="text-neutral-600 text-xs leading-relaxed bg-[#f7f8fa] p-4 rounded-2xl border border-neutral-100">
              {alert.summary}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              {[
                { label: 'Associated Account', value: alert.account_id, link: `/accounts/${alert.account_id}` },
                { label: 'Triggering Txn', value: alert.transaction_id, link: `/transactions?account=${alert.account_id}` },
                { label: 'Detection Engine', value: alert.detection_rule, link: null },
              ].map((item) => (
                <div key={item.label} className="bg-[#f7f8fa] p-3.5 rounded-2xl border border-neutral-100">
                  <span className="text-[10px] text-neutral-400 block font-medium mb-1">{item.label}</span>
                  {item.link ? (
                    <Link to={item.link} className="text-xs font-bold text-blue-600 hover:underline">
                      {item.value}
                    </Link>
                  ) : (
                    <span className="text-xs font-bold text-neutral-800">{item.value}</span>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white border border-neutral-100 rounded-3xl p-6 shadow-sm space-y-4">
            <div>
              <h2 className="text-base font-bold text-neutral-900">
                Explainable Risk Factors &amp; Model Weights
              </h2>
              <p className="text-xs text-neutral-400 mt-0.5">Feature-level attribution indicating why this transaction breached thresholds</p>
            </div>
            <div className="space-y-3 pt-1">
              {alert.factors.map((factor, idx) => (
                <div key={idx} className="bg-[#f7f8fa] p-4 rounded-2xl border border-neutral-100">
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="font-bold text-neutral-900">{factor.name}</span>
                    <span className="text-rose-600 font-bold">+{factor.contribution.toFixed(1)} pts</span>
                  </div>
                  <p className="text-[11px] text-neutral-500 mb-3">{factor.description}</p>
                  <div className="w-full bg-neutral-200 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-blue-600 h-full rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(factor.weight * 100, 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Verdict & Adjudication (~38% = 5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white border border-neutral-100 rounded-3xl p-6 shadow-sm">
            <h2 className="text-base font-bold text-neutral-900 mb-4">Risk Verdict</h2>
            <div className="text-center py-6 border-b border-neutral-100">
              <span className={`text-6xl font-extrabold ${riskColor}`}>{alert.risk_score}</span>
              <span className="text-neutral-400 text-xs block mt-1 font-medium">/ 100 Risk Index</span>
              <p className={`text-xs mt-2 font-bold ${riskColor}`}>
                {alert.risk_score > 70 ? 'Critical Threshold Exceeded' : alert.risk_score > 40 ? 'Elevated Anomaly Risk' : 'Within Expected Bounds'}
              </p>
            </div>
            <div className="pt-4 text-xs text-neutral-600 space-y-2">
              <div className="flex items-center justify-between">
                <span>Model Confidence</span>
                <span className="font-bold text-neutral-900">92.4%</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Zero-Lookahead Temporal Policy</span>
                <span className="text-emerald-600 font-bold">Enforced</span>
              </div>
            </div>
          </div>

          <div className="bg-white border border-neutral-100 rounded-3xl p-6 shadow-sm space-y-4">
            <div>
              <h2 className="text-base font-bold text-neutral-900">Investigator Decision</h2>
              <p className="text-xs text-neutral-400 mt-0.5">Submit binding human-in-the-loop review</p>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-neutral-500 mb-1.5">Investigator Notes</label>
                <textarea
                  rows={3}
                  placeholder="Enter rationale for confirmation or false-positive classification..."
                  value={reviewNote}
                  onChange={(e) => setReviewNote(e.target.value)}
                  className="w-full bg-[#f4f5f7] border-0 rounded-2xl p-3.5 text-xs text-neutral-800 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-300 transition-all resize-none"
                />
              </div>

              <div className="space-y-2 pt-1">
                <button
                  onClick={() => handleDecision('confirm_fraud')}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-full bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-xs transition-colors"
                >
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>Confirm Fraudulent Pattern</span>
                </button>
                <button
                  onClick={() => handleDecision('false_positive')}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-full bg-neutral-100 hover:bg-neutral-200 text-neutral-800 text-xs font-semibold transition-colors"
                >
                  <CheckCircle className="w-3.5 h-3.5" />
                  <span>Dismiss as False Positive</span>
                </button>
                <button
                  onClick={() => handleDecision('needs_escalation')}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-full bg-white hover:bg-neutral-50 text-neutral-700 border border-neutral-200/80 text-xs font-semibold transition-colors"
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>Escalate to Tier-3 AML</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
