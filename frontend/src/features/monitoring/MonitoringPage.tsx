import React, { useState } from 'react';
import { Activity } from 'lucide-react';

export const MonitoringPage: React.FC = () => {
  const [sensitivity, setSensitivity] = useState(75);
  const [velocityWindow, setVelocityWindow] = useState('15m');

  return (
    <div className="space-y-8 max-w-[1400px] mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-neutral-900">
            Adaptive Risk Monitoring
          </h1>
          <p className="text-xs text-neutral-500 mt-1">
            Dynamic threshold calibration, drift surveillance, and multi-scale sensitivity balancing
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-100 px-4 py-2 rounded-full shadow-xs self-start md:self-auto">
          <Activity className="w-3.5 h-3.5 text-blue-600" />
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
            Real-Time Drift Surveillance Active
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left 8 cols */}
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-white border border-neutral-100 rounded-3xl p-6 shadow-sm space-y-6">
            <div>
              <h2 className="text-base font-bold text-neutral-900">
                Threshold Sensitivity Calibration
              </h2>
              <p className="text-xs text-neutral-400 mt-0.5">Adjust real-time scoring trigger thresholds</p>
            </div>

            <div className="space-y-6 pt-2">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-semibold text-neutral-700">Anomaly Detection Sensitivity</span>
                  <span className="text-base font-bold text-blue-600">{sensitivity}%</span>
                </div>
                <input
                  type="range"
                  min={30}
                  max={95}
                  value={sensitivity}
                  onChange={(e) => setSensitivity(Number(e.target.value))}
                  className="w-full accent-blue-600 cursor-pointer h-2 bg-neutral-200 rounded-lg"
                />
                <div className="flex justify-between text-[11px] text-neutral-400 mt-2 font-medium">
                  <span>Conservative (Fewer alerts)</span>
                  <span className="text-blue-600 font-semibold">Balanced (Recommended: 75%)</span>
                  <span>Aggressive (Max catch)</span>
                </div>
              </div>

              <div className="pt-4 border-t border-neutral-100">
                <label className="block text-xs font-semibold text-neutral-700 mb-3">Burst Velocity Time Window</label>
                <div className="flex flex-wrap gap-2">
                  {['5m', '15m', '1h', '6h', '24h'].map((w) => (
                    <button
                      key={w}
                      onClick={() => setVelocityWindow(w)}
                      className={`px-5 py-2 rounded-full text-xs font-semibold transition-all ${
                        velocityWindow === w
                          ? 'bg-neutral-900 text-white shadow-xs'
                          : 'bg-neutral-50 text-neutral-600 border border-neutral-200/80 hover:bg-neutral-100'
                      }`}
                    >
                      {w}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white border border-neutral-100 rounded-3xl p-6 shadow-sm space-y-4">
            <h2 className="text-base font-bold text-neutral-900">Concept Drift &amp; Feature Stability</h2>
            <div className="space-y-3 pt-1 text-xs">
              {[
                { name: 'Velocity Dispersion Drift (PSI)', value: '0.042 (Stable)', color: 'text-emerald-600', dot: 'bg-emerald-500' },
                { name: 'Circadian Entropy Shift', value: '0.018 (Stable)', color: 'text-emerald-600', dot: 'bg-emerald-500' },
                { name: 'Counterparty Network Centrality', value: '0.089 (Minor drift)', color: 'text-amber-600', dot: 'bg-amber-400' },
              ].map((item) => (
                <div key={item.name} className="flex justify-between items-center py-2 border-b border-neutral-50 last:border-0">
                  <span className="text-neutral-600 font-medium">{item.name}</span>
                  <span className={`font-bold flex items-center gap-1.5 ${item.color}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${item.dot}`} />
                    {item.value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right 4 cols */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white border border-neutral-100 rounded-3xl p-6 shadow-sm space-y-4">
            <h3 className="font-bold text-base text-neutral-900">Scoring Engine Metrics</h3>
            <div className="space-y-3 text-xs pt-1">
              <div className="flex justify-between items-center pb-2 border-b border-neutral-50">
                <span className="text-neutral-500 font-medium">Throughput</span>
                <span className="font-bold text-neutral-900">1,240 txn/sec</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-neutral-50">
                <span className="text-neutral-500 font-medium">Inference Latency (p99)</span>
                <span className="font-bold text-emerald-600">18 ms</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-neutral-50">
                <span className="text-neutral-500 font-medium">Auto-Triage Precision</span>
                <span className="font-bold text-neutral-900">98.4%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-neutral-500 font-medium">Temporal Leakage Check</span>
                <span className="font-bold text-emerald-600">0 Violations</span>
              </div>
            </div>
          </div>

          <div className="bg-[#f0f5ff] border border-blue-100 rounded-3xl p-6 text-xs text-neutral-700 space-y-2">
            <h4 className="font-bold text-neutral-900 text-sm">Automated Recalibration</h4>
            <p className="text-neutral-600 leading-relaxed">
              When feature drift PSI exceeds 0.20, Sentinel automatically flags the scoring pipeline for model retuning without impacting live transaction ingress.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
