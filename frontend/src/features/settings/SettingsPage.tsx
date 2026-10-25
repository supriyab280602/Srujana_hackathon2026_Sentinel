import React, { useState } from 'react';
import {
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';

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
    <div className="space-y-8 max-w-[1400px] mx-auto pb-12">
      {/* Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-neutral-900">
            Platform Configuration
          </h1>
          <p className="text-xs text-neutral-500 mt-1">
            Global inference boundaries, zero-lookahead guardrails, graph traversal limits, and triage sensitivity
          </p>
        </div>

        <button
          onClick={handleSave}
          className="flex items-center gap-2 bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-semibold py-3 px-5 rounded-full shadow-xs transition-colors self-start md:self-auto"
        >
          <CheckCircle2 className="w-4 h-4" />
          <span>Save Configuration</span>
        </button>
      </div>

      {savedMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-800 text-xs font-medium flex items-center gap-2.5">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
          <span>Platform configuration saved. Sensitivity thresholds dynamically propagated to real-time scoring engine.</span>
        </div>
      )}

      {/* Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left 8 cols */}
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-white border border-neutral-100 rounded-3xl p-6 shadow-sm space-y-6">
            <div>
              <h2 className="text-base font-bold text-neutral-900">
                Risk Sensitivity Calibration
              </h2>
              <p className="text-xs text-neutral-400 mt-0.5">Balance detection catch rate against investigator triage fatigue</p>
            </div>

            <div className="space-y-6 pt-2 text-xs">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="font-semibold text-neutral-700">Anomaly Threshold Cutoff</span>
                  <span className="text-sm font-bold text-blue-600">{anomalyThreshold} / 100</span>
                </div>
                <input
                  type="range"
                  min={40}
                  max={95}
                  value={anomalyThreshold}
                  onChange={(e) => setAnomalyThreshold(Number(e.target.value))}
                  className="w-full accent-blue-600 cursor-pointer h-2 bg-neutral-200 rounded-lg"
                />
                <div className="flex justify-between text-[11px] text-neutral-400 mt-2 font-medium">
                  <span>Lower Cutoff (Higher Alert Volume)</span>
                  <span className="font-semibold text-blue-600">Recommended: 75</span>
                  <span>Strict (Only Critical Outliers)</span>
                </div>
              </div>

              <div className="pt-5 border-t border-neutral-100">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-semibold text-neutral-700">Auto-Triage Model Confidence Threshold</span>
                  <span className="text-sm font-bold text-blue-600">{autoTriageConfidence}%</span>
                </div>
                <input
                  type="range"
                  min={70}
                  max={99}
                  value={autoTriageConfidence}
                  onChange={(e) => setAutoTriageConfidence(Number(e.target.value))}
                  className="w-full accent-blue-600 cursor-pointer h-2 bg-neutral-200 rounded-lg"
                />
                <p className="text-[11px] text-neutral-400 mt-2 leading-relaxed">
                  Alerts with ML confidence above this threshold receive automated dossier synthesis and prioritized queue placement.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white border border-neutral-100 rounded-3xl p-6 shadow-sm space-y-4">
            <div>
              <h2 className="text-base font-bold text-neutral-900">
                Temporal Causality &amp; Zero-Lookahead Guardrails
              </h2>
              <p className="text-xs text-neutral-400 mt-0.5">Prevent inference-time leakage of future transactions or ground-truth labels</p>
            </div>

            <div className="space-y-4 pt-2 text-xs">
              <div className="flex items-center justify-between p-4 rounded-2xl bg-[#f7f8fa] border border-neutral-100">
                <div className="space-y-1 pr-4">
                  <span className="font-bold text-neutral-900 block text-xs">Strict Zero-Lookahead Temporal Enforcement</span>
                  <p className="text-[11px] text-neutral-500 leading-relaxed">
                    Feature extraction strictly filters out any event timestamp where T &gt; t_current.
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer shrink-0">
                  <input
                    type="checkbox"
                    checked={strictZeroLookahead}
                    onChange={(e) => setStrictZeroLookahead(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-neutral-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-neutral-900"></div>
                </label>
              </div>

              <div className="flex items-center justify-between p-4 rounded-2xl bg-[#f7f8fa] border border-neutral-100">
                <div className="space-y-1 pr-4">
                  <span className="font-bold text-neutral-900 block text-xs">Graph Multi-Hop Traversal Depth</span>
                  <p className="text-[11px] text-neutral-500">Max radius of entity exploration in NetworkX topology for circular loops</p>
                </div>
                <select
                  value={maxGraphHops}
                  onChange={(e) => setMaxGraphHops(Number(e.target.value))}
                  className="bg-white border border-neutral-200/80 rounded-full px-4 py-1.5 text-xs font-semibold text-neutral-800 focus:outline-none cursor-pointer shadow-xs"
                >
                  <option value={1}>1 HOP (DIRECT)</option>
                  <option value={2}>2 HOPS (INTERMEDIARIES)</option>
                  <option value={3}>3 HOPS (MULE RING)</option>
                  <option value={4}>4 HOPS (DEEP FORENSIC)</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Right 4 cols */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white border border-neutral-100 rounded-3xl p-6 shadow-sm space-y-4">
            <h3 className="font-bold text-base text-neutral-900">System Integrity</h3>
            <div className="space-y-3 text-xs pt-1">
              <div className="flex justify-between items-center pb-2.5 border-b border-neutral-50">
                <span className="text-neutral-500 font-medium">Scoring Engine</span>
                <span className="font-bold text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-100">Zero-Lookahead v1.0</span>
              </div>
              <div className="flex justify-between items-center pb-2.5 border-b border-neutral-50">
                <span className="text-neutral-500 font-medium">Topology Engine</span>
                <span className="font-bold text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-100">NetworkX DiGraph</span>
              </div>
              <div className="flex justify-between items-center pb-2.5 border-b border-neutral-50">
                <span className="text-neutral-500 font-medium">Ingress Mode</span>
                <span className="font-bold text-emerald-600">Active / Stream</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-neutral-500 font-medium">Model Artifact</span>
                <span className="font-bold text-neutral-800">XGB-Sentinel-2026.1</span>
              </div>
            </div>
          </div>

          <div className="bg-[#f0f5ff] border border-blue-100 rounded-3xl p-6 text-xs text-neutral-700 space-y-2">
            <div className="flex items-center gap-2 text-neutral-900 font-bold">
              <ShieldCheck className="w-4 h-4 text-blue-600" />
              <span className="text-sm">Compliance Standards</span>
            </div>
            <p className="text-neutral-600 leading-relaxed">
              Sentinel strictly adheres to FinCEN and FATF guidance on explainable AI in AML transaction monitoring and SAR reporting.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
