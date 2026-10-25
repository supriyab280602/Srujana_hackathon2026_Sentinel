import React, { useState } from 'react';
import { CheckCircle2 } from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const [anomalyThreshold, setAnomalyThreshold] = useState(75);
  const [maxGraphHops, setMaxGraphHops] = useState(3);
  const [strictZeroLookahead, setStrictZeroLookahead] = useState(true);
  const [autoTriageConfidence, setAutoTriageConfidence] = useState(92);
  const [savedMessage, setSavedMessage] = useState(false);

  const handleSave = () => {
    setSavedMessage(true);
    setTimeout(() => setSavedMessage(false), 3000);
  };

  return (
    <div className="space-y-5 max-w-[1440px] mx-auto pb-10">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-ink">
            Platform Surveillance Configuration
          </h1>
          <p className="text-xs text-ink-secondary mt-0.5">
            Global inference boundaries, zero-lookahead guardrails, graph traversal limits, and triage sensitivity
          </p>
        </div>

        <button
          onClick={handleSave}
          className="flex items-center gap-1.5 bg-brand-950 hover:bg-slate-800 text-white text-xs font-semibold py-2 px-3.5 rounded-lg shadow-xs transition-colors self-start sm:self-auto"
        >
          <CheckCircle2 className="w-3.5 h-3.5 text-blue-400" />
          <span>Save Configuration</span>
        </button>
      </div>

      {savedMessage && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 text-xs font-medium flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
          <span>Platform configuration saved. Sensitivity thresholds dynamically propagated to real-time scoring engine.</span>
        </div>
      )}

      {/* Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left 8 cols */}
        <div className="lg:col-span-8 space-y-4">
          <div className="bg-surface border border-surface-border rounded-xl p-5 shadow-xs space-y-4">
            <div>
              <h2 className="text-xs font-bold text-ink uppercase tracking-wider">
                Risk Sensitivity Calibration
              </h2>
              <p className="text-[11px] text-ink-muted mt-0.5">Balance detection catch rate against investigator triage fatigue</p>
            </div>

            <div className="space-y-4 pt-1 text-xs">
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <span className="font-semibold text-ink-secondary">Anomaly Threshold Cutoff</span>
                  <span className="text-xs font-mono font-bold text-brand-700">{anomalyThreshold} / 100</span>
                </div>
                <input
                  type="range"
                  min={40}
                  max={95}
                  value={anomalyThreshold}
                  onChange={(e) => setAnomalyThreshold(Number(e.target.value))}
                  className="w-full accent-brand-600 cursor-pointer h-1.5 bg-slate-200 rounded-lg"
                />
                <div className="flex justify-between text-[10px] text-ink-muted mt-1 font-medium">
                  <span>Lower Cutoff (Higher Alert Volume)</span>
                  <span className="font-mono font-semibold text-brand-700">Recommended: 75</span>
                  <span>Strict (Only Critical Outliers)</span>
                </div>
              </div>

              <div className="pt-3 border-t border-surface-border">
                <div className="flex justify-between items-center mb-1.5">
                  <span className="font-semibold text-ink-secondary">Auto-Triage Model Confidence Threshold</span>
                  <span className="text-xs font-mono font-bold text-brand-700">{autoTriageConfidence}%</span>
                </div>
                <input
                  type="range"
                  min={70}
                  max={99}
                  value={autoTriageConfidence}
                  onChange={(e) => setAutoTriageConfidence(Number(e.target.value))}
                  className="w-full accent-brand-600 cursor-pointer h-1.5 bg-slate-200 rounded-lg"
                />
                <p className="text-[10px] text-ink-muted mt-1.5 leading-relaxed">
                  Alerts with ML confidence above this threshold receive automated dossier synthesis and prioritized queue placement.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-surface border border-surface-border rounded-xl p-5 shadow-xs space-y-3.5">
            <div>
              <h2 className="text-xs font-bold text-ink uppercase tracking-wider">
                Graph Topology &amp; Zero-Lookahead Guardrails
              </h2>
              <p className="text-[11px] text-ink-muted mt-0.5">Graph traversal depth and temporal policy boundaries</p>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between py-1 border-b border-surface-border">
                <div>
                  <span className="font-semibold text-ink block">Strict Zero-Lookahead Enforcement</span>
                  <span className="text-[11px] text-ink-muted">Guarantee feature extraction uses only data prior to transaction timestamp</span>
                </div>
                <input
                  type="checkbox"
                  checked={strictZeroLookahead}
                  onChange={(e) => setStrictZeroLookahead(e.target.checked)}
                  className="w-4 h-4 accent-brand-600 rounded cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between py-1">
                <div>
                  <span className="font-semibold text-ink block">Max Multi-Hop Traversal Radius</span>
                  <span className="text-[11px] text-ink-muted">Maximum entity network depth for real-time cycle detection</span>
                </div>
                <select
                  value={maxGraphHops}
                  onChange={(e) => setMaxGraphHops(Number(e.target.value))}
                  className="bg-surface-elevated border border-surface-border rounded-lg px-2.5 py-1 text-xs font-mono font-medium focus:outline-none"
                >
                  <option value={2}>2 Hops</option>
                  <option value={3}>3 Hops (Default)</option>
                  <option value={4}>4 Hops (Deep Scan)</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Right 4 cols */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-surface border border-surface-border rounded-xl p-4 shadow-xs space-y-3">
            <h2 className="text-xs font-bold text-ink uppercase tracking-wider">Institutional Audit Trail</h2>
            <div className="text-xs text-ink-secondary space-y-2 leading-relaxed">
              <p>
                All threshold adjustments are recorded with cryptographically signed investigator timestamps.
              </p>
              <p>
                Compliance retention window: <b className="text-ink font-mono">7 Years (FINCEN Rule 31)</b>.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
