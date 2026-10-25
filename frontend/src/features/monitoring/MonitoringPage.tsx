import React, { useState } from 'react';
import { Activity } from 'lucide-react';

export const MonitoringPage: React.FC = () => {
  const [sensitivity, setSensitivity] = useState(75);
  const [velocityWindow, setVelocityWindow] = useState('15m');

  return (
    <div className="space-y-5 max-w-[1440px] mx-auto pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-ink">
            Adaptive Surveillance &amp; Threshold Monitoring
          </h1>
          <p className="text-xs text-ink-secondary mt-0.5">
            Dynamic threshold calibration, concept drift surveillance, and multi-scale sensitivity balancing
          </p>
        </div>
        <div className="flex items-center gap-1.5 text-xs font-semibold text-brand-700 bg-brand-50 border border-brand-200 px-3 py-1.5 rounded-lg shadow-xs self-start sm:self-auto">
          <Activity className="w-3.5 h-3.5 text-brand-600" />
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-brand-600 animate-pulse" />
            Real-Time Drift Surveillance Active
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left 8 cols */}
        <div className="lg:col-span-8 space-y-4">
          <div className="bg-surface border border-surface-border rounded-xl p-5 shadow-xs space-y-4">
            <div>
              <h2 className="text-xs font-bold text-ink uppercase tracking-wider">
                Threshold Sensitivity Calibration
              </h2>
              <p className="text-[11px] text-ink-muted mt-0.5">Adjust real-time scoring trigger thresholds across live transaction ingestion</p>
            </div>

            <div className="space-y-4 pt-1">
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <span className="text-xs font-semibold text-ink-secondary">Anomaly Trigger Threshold</span>
                  <span className="text-sm font-mono font-bold text-brand-700">{sensitivity}%</span>
                </div>
                <input
                  type="range"
                  min={30}
                  max={95}
                  value={sensitivity}
                  onChange={(e) => setSensitivity(Number(e.target.value))}
                  className="w-full accent-brand-600 cursor-pointer h-1.5 bg-slate-200 rounded-lg"
                />
                <div className="flex justify-between text-[10px] text-ink-muted mt-1 font-medium">
                  <span>Conservative (Fewer False Positives)</span>
                  <span className="text-brand-700 font-semibold font-mono">Standard Baseline: 75%</span>
                  <span>Strict (Maximum Catch Rate)</span>
                </div>
              </div>

              <div className="pt-3 border-t border-surface-border">
                <label className="block text-xs font-semibold text-ink-secondary mb-2">Rolling Velocity Aggregation Window</label>
                <div className="flex flex-wrap gap-1.5">
                  {['5m', '15m', '1h', '6h', '24h'].map((w) => (
                    <button
                      key={w}
                      onClick={() => setVelocityWindow(w)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-all ${
                        velocityWindow === w
                          ? 'bg-brand-950 text-white shadow-xs font-semibold'
                          : 'bg-surface-elevated text-ink-secondary border border-surface-border hover:bg-surface'
                      }`}
                    >
                      {w}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-surface border border-surface-border rounded-xl p-5 shadow-xs space-y-3">
            <h2 className="text-xs font-bold text-ink uppercase tracking-wider">Concept Drift &amp; Feature Stability (PSI)</h2>
            <div className="space-y-2 pt-1 text-xs">
              {[
                { name: 'Velocity Dispersion Drift (PSI)', value: '0.042 (Stable)', color: 'text-emerald-700', dot: 'bg-emerald-500' },
                { name: 'Circadian Entropy Shift (PSI)', value: '0.018 (Stable)', color: 'text-emerald-700', dot: 'bg-emerald-500' },
                { name: 'Counterparty Network Centrality (PSI)', value: '0.089 (Minor drift)', color: 'text-amber-700', dot: 'bg-amber-400' },
              ].map((item) => (
                <div key={item.name} className="flex justify-between items-center py-1.5 border-b border-surface-border last:border-0">
                  <span className="text-ink-secondary font-medium">{item.name}</span>
                  <span className={`font-mono font-bold flex items-center gap-1.5 ${item.color}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${item.dot}`} />
                    {item.value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right 4 cols */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-surface border border-surface-border rounded-xl p-4 shadow-xs space-y-3">
            <h2 className="text-xs font-bold text-ink uppercase tracking-wider">Pipeline Performance</h2>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between items-center py-1 border-b border-surface-border">
                <span className="text-ink-secondary">Real-Time Ingestion:</span>
                <span className="font-mono font-bold text-emerald-700">1,240 tx/sec</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-surface-border">
                <span className="text-ink-secondary">p99 Pipeline Latency:</span>
                <span className="font-mono font-bold text-ink">18 ms</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-surface-border">
                <span className="text-ink-secondary">Graph Engine Cycles:</span>
                <span className="font-mono font-bold text-ink">100% Validated</span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-ink-secondary">Feature Lookahead Guard:</span>
                <span className="font-mono font-bold text-emerald-700">Active (0 Leakage)</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
