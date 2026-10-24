import React, { useState } from 'react';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';

export const MonitoringPage: React.FC = () => {
  const [sensitivity, setSensitivity] = useState(75);
  const [velocityWindow, setVelocityWindow] = useState('15m');

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white tracking-tight">Adaptive Risk Monitoring</h2>
        <p className="text-xs text-slate-400 mt-1">
          Dynamic threshold calibration, drift monitoring, and multi-scale sensitivity balancing
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <Card title="Threshold Sensitivity Calibration" subtitle="Adjust real-time scoring trigger thresholds">
            <div className="space-y-5 pt-2 text-xs">
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-slate-300 font-medium">Anomaly Detection Sensitivity:</span>
                  <span className="font-mono text-brand-400 font-bold">{sensitivity}%</span>
                </div>
                <input
                  type="range"
                  min={30}
                  max={95}
                  value={sensitivity}
                  onChange={(e) => setSensitivity(Number(e.target.value))}
                  className="w-full accent-brand-500 cursor-pointer h-2 bg-surface-elevated rounded-lg"
                />
                <div className="flex justify-between text-[10px] text-slate-500 mt-1">
                  <span>Conservative (Fewer alerts)</span>
                  <span>Balanced</span>
                  <span>Aggressive (Maximum catch rate)</span>
                </div>
              </div>

              <div className="pt-2 border-t border-surface-border">
                <label className="block text-slate-300 font-medium mb-2">Burst Velocity Time Window:</label>
                <div className="flex gap-2">
                  {['5m', '15m', '1h', '6h', '24h'].map((w) => (
                    <button
                      key={w}
                      onClick={() => setVelocityWindow(w)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-colors ${
                        velocityWindow === w
                          ? 'bg-brand-600 text-white'
                          : 'bg-surface-elevated text-slate-400 hover:text-slate-200 border border-surface-border'
                      }`}
                    >
                      {w}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </Card>

          <Card title="Concept Drift &amp; Feature Stability">
            <div className="space-y-3 pt-1 text-xs">
              <div className="flex items-center justify-between p-3 rounded-lg bg-surface-elevated/40 border border-surface-border">
                <div>
                  <span className="font-semibold text-slate-200 block">Transaction Velocity Drift (PSI)</span>
                  <span className="text-[11px] text-slate-400">Population Stability Index over last 24 hours</span>
                </div>
                <Badge variant="low">0.04 (Stable)</Badge>
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg bg-surface-elevated/40 border border-surface-border">
                <div>
                  <span className="font-semibold text-slate-200 block">Graph Degree Centrality Shift</span>
                  <span className="text-[11px] text-slate-400">Mule clustering formation speed</span>
                </div>
                <Badge variant="medium">+12% Shift</Badge>
              </div>
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card title="Operating Characteristics">
            <div className="space-y-3 pt-1 text-xs">
              <div className="flex justify-between pb-2 border-b border-surface-border">
                <span className="text-slate-400">Estimated Catch Rate:</span>
                <span className="font-mono font-bold text-emerald-400">96.2%</span>
              </div>
              <div className="flex justify-between pb-2 border-b border-surface-border">
                <span className="text-slate-400">False Positive Rate:</span>
                <span className="font-mono font-bold text-amber-400">2.1%</span>
              </div>
              <div className="flex justify-between pb-2 border-b border-surface-border">
                <span className="text-slate-400">Scoring Latency (p99):</span>
                <span className="font-mono font-bold text-slate-200">14ms</span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
