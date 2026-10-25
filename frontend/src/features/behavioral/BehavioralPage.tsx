import React, { useState, useEffect } from 'react';
import { apiService } from '../../services/api';
import { BehavioralFingerprint } from '../../types';
import { formatINR } from '../../utils/formatters';
import { Fingerprint, Clock, AlertTriangle, ChevronRight, Info } from 'lucide-react';
import { Link } from 'react-router-dom';

// Circadian Hour Heatmap (24-column grid)
const CircadianHeatmap: React.FC<{ accountId: string; activeWindows: string[] }> = ({ accountId, activeWindows }) => {
  const hours = Array.from({ length: 24 }, (_, i) => i);
  const activeHours = new Set<number>();
  activeWindows.forEach((w) => {
    const match = w.match(/(\d+):00\s*-\s*(\d+):00/);
    if (match) {
      const start = parseInt(match[1]);
      const end = parseInt(match[2]);
      for (let h = start; h < end; h++) activeHours.add(h);
    }
  });

  const baseIntensity = (h: number) => {
    if (h >= 9 && h <= 17) return 0.75;
    if (h >= 2 && h <= 5) return 0.15;
    return 0.1;
  };

  const intensities = hours.map(baseIntensity);
  const anomalyHours = accountId === 'ACC-7749' ? new Set([2, 3, 14]) : new Set([22]);

  return (
    <div>
      <div className="flex items-center justify-between mb-2.5">
        <span className="text-xs text-ink-secondary font-medium">Circadian Transacting Frequency (24h UTC)</span>
        <span className="text-[10px] text-ink-muted">Darker = Baseline activity density</span>
      </div>
      <div className="flex gap-1">
        {hours.map((h) => {
          const intensity = intensities[h];
          const isAnomaly = anomalyHours.has(h);
          return (
            <div key={h} className="flex flex-col items-center gap-1 flex-1">
              <div
                title={`${h.toString().padStart(2, '0')}:00 UTC - ${isAnomaly ? 'Anomalous Event' : intensity > 0.5 ? 'Normal Baseline' : 'Idle'}`}
                className={`h-6 w-full rounded-xs transition-all ${
                  isAnomaly ? 'bg-red-600 ring-1 ring-red-400' : intensity > 0.6 ? 'bg-emerald-600' : intensity > 0.3 ? 'bg-emerald-200' : 'bg-slate-200'
                }`}
                style={{ opacity: isAnomaly ? 1 : Math.max(0.4, intensity) }}
              />
              {h % 6 === 0 && (
                <span className="text-[9px] font-mono text-ink-muted font-medium">{h.toString().padStart(2, '0')}</span>
              )}
            </div>
          );
        })}
      </div>
      <div className="flex items-center gap-4 mt-2.5 text-[11px] text-ink-muted font-medium">
        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-600" /> Typical Window</span>
        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-red-600" /> Anomaly Spike</span>
        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-slate-300" /> Low Frequency</span>
      </div>
    </div>
  );
};

// Velocity Sparkline
const VelocityChart: React.FC<{ accountId: string }> = ({ accountId }) => {
  const days = 14;
  const baseVol = accountId === 'ACC-7749' ? 125000 : 450000;
  const data = [
    baseVol * 0.9, baseVol * 1.1, baseVol * 0.8, baseVol * 1.0,
    baseVol * 0.95, baseVol * 1.05, baseVol * 1.2, baseVol * 0.9,
    baseVol * 1.1, baseVol * 0.85, baseVol * 1.0,
    accountId === 'ACC-7749' ? baseVol * 3.8 : baseVol * 1.15, // Burst on day 12
    baseVol * 1.4, baseVol * 1.05
  ];
  const max = Math.max(...data);
  const svgW = 280, svgH = 60;
  const points = data.map((v, i) => {
    const x = (i / (days - 1)) * svgW;
    const y = svgH - (v / max) * (svgH - 10) - 5;
    return `${x},${y}`;
  }).join(' ');

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-ink-secondary font-medium">14-Day Rolling Volume Velocity</span>
        <span className="text-xs font-mono font-bold text-ink tabular-nums">{formatINR(data[data.length - 1])} current</span>
      </div>
      <svg viewBox={`0 0 ${svgW} ${svgH}`} className="w-full h-14 overflow-visible">
        <polyline
          fill="none"
          stroke={accountId === 'ACC-7749' ? '#DC2626' : '#2563EB'}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          points={points}
        />
        {data.map((v, i) => {
          if (v > max * 0.75) {
            const x = (i / (days - 1)) * svgW;
            const y = svgH - (v / max) * (svgH - 10) - 5;
            return (
              <circle
                key={i}
                cx={x}
                cy={y}
                r="3.5"
                fill="#DC2626"
                stroke="#FFFFFF"
                strokeWidth="1.5"
              />
            );
          }
          return null;
        })}
      </svg>
      <div className="flex justify-between text-[10px] text-ink-muted mt-1 font-mono">
        <span>Day 1</span>
        <span>Day 7</span>
        <span className="text-risk-critical font-bold">Day 12 (1,420% Burst)</span>
        <span>Today</span>
      </div>
    </div>
  );
};

// Feature Weight Bar
const ShapFeatureBar: React.FC<{ label: string; value: number; color: string }> = ({ label, value, color }) => (
  <div className="space-y-1">
    <div className="flex justify-between text-xs">
      <span className="text-ink-secondary font-medium">{label}</span>
      <span className="font-mono font-bold text-ink">{(value * 100).toFixed(0)}%</span>
    </div>
    <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
      <div
        className={`h-full rounded-full transition-all duration-300 ${color}`}
        style={{ width: `${Math.min(value * 100, 100)}%` }}
      />
    </div>
  </div>
);

export const BehavioralPage: React.FC = () => {
  const [profiles, setProfiles] = useState<BehavioralFingerprint[]>([]);
  const [selectedProfile, setSelectedProfile] = useState<string>('ACC-7749');

  useEffect(() => {
    apiService.getBehavioralProfiles().then((data) => {
      setProfiles(data);
      if (data.length > 0 && !data.find((p) => p.account_id === selectedProfile)) {
        setSelectedProfile(data[0].account_id);
      }
    });
  }, []);

  const activeProfile = profiles.find((p) => p.account_id === selectedProfile) || profiles[0];

  return (
    <div className="space-y-5 max-w-[1440px] mx-auto pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-ink">
            Behavioral Biometrics &amp; Fingerprinting Telemetry
          </h1>
          <p className="text-xs text-ink-secondary mt-0.5">
            Statistical anomaly detection across circadian transacting windows, keystroke velocities, and counterparty shifts
          </p>
        </div>
        <div className="flex items-center gap-1.5 text-xs font-semibold text-brand-700 bg-brand-50 border border-brand-200 px-3 py-1.5 rounded-lg shadow-xs self-start sm:self-auto">
          <span className="w-2 h-2 rounded-full bg-brand-600 animate-pulse" />
          <span>Surveillance Baseline Active · {profiles.length} Profiles</span>
        </div>
      </div>

      {/* Profile Selector */}
      {profiles.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {profiles.map((p) => (
            <button
              key={p.account_id}
              onClick={() => setSelectedProfile(p.account_id)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-mono font-semibold transition-all ${
                selectedProfile === p.account_id
                  ? 'bg-brand-950 text-white shadow-xs'
                  : 'bg-surface text-ink-secondary border border-surface-border hover:bg-surface-elevated'
              }`}
            >
              {p.account_id}
              {p.account_id === 'ACC-7749' && (
                <span className="ml-2 px-1.5 py-0.2 rounded bg-red-600 text-white text-[9px] font-bold">FLAGGED</span>
              )}
            </button>
          ))}
        </div>
      )}

      {activeProfile && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* Left: Profile Summary (4 cols) */}
          <div className="lg:col-span-4 space-y-4">
            <div className="bg-surface border border-surface-border rounded-xl p-5 shadow-xs space-y-3.5">
              <div className="flex items-center justify-between pb-3 border-b border-surface-border">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-surface-elevated border border-surface-border flex items-center justify-center text-brand-700">
                    <Fingerprint className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-mono font-bold text-ink text-sm">{activeProfile.account_id}</div>
                    <div className="text-[10px] text-ink-muted">Historical Persona Model</div>
                  </div>
                </div>
                <Link to={`/accounts/${activeProfile.account_id}`} className="text-xs text-brand-600 font-semibold hover:underline flex items-center gap-0.5">
                  Profile <ChevronRight className="w-3 h-3" />
                </Link>
              </div>

              <div className="space-y-2.5 text-xs">
                <div className="flex justify-between items-center py-1 border-b border-surface-border">
                  <span className="text-ink-secondary font-medium">Model Certainty</span>
                  <span className="font-mono font-bold text-brand-700">{(activeProfile.confidence_score * 100).toFixed(0)}% Reliable</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-surface-border">
                  <span className="text-ink-secondary font-medium">Avg Daily Volume</span>
                  <span className="font-mono font-bold text-ink tabular-nums">{formatINR(activeProfile.avg_daily_volume)}</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-surface-border">
                  <span className="text-ink-secondary font-medium flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-500" /> Anomalous Spikes (30d)
                  </span>
                  <span className={`font-mono font-bold ${activeProfile.anomalies_detected > 5 ? 'text-risk-critical' : 'text-risk-medium'}`}>
                    {activeProfile.anomalies_detected} Events
                  </span>
                </div>
                <div className="flex justify-between items-center py-1">
                  <span className="text-ink-secondary font-medium flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-ink-muted" /> Active Hours
                  </span>
                  <span className="font-mono font-medium text-ink text-[11px]">{activeProfile.typical_hours[0]}</span>
                </div>
              </div>

              {/* Counterparties */}
              <div className="pt-2 border-t border-surface-border">
                <div className="text-[10px] font-bold text-ink-muted uppercase tracking-wider mb-2">Established Counterparties</div>
                <div className="flex flex-wrap gap-1.5">
                  {activeProfile.frequent_counterparties.map((cp) => (
                    <span key={cp} className="font-mono text-[10px] px-2 py-0.5 rounded bg-surface-elevated text-ink-secondary border border-surface-border">
                      {cp}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Regulatory Disclaimer Note */}
            <div className="p-4 bg-surface border border-surface-border rounded-xl shadow-xs text-xs space-y-1.5">
              <span className="font-semibold text-ink flex items-center gap-1.5 text-xs">
                <Info className="w-3.5 h-3.5 text-brand-600" />
                <span>Compliance Note</span>
              </span>
              <p className="text-ink-secondary leading-relaxed text-[11px]">
                Behavioral signals provide corroborative context for AML analysts. They do not constitute unilateral proof of fraud and must be evaluated alongside transaction topology.
              </p>
            </div>
          </div>

          {/* Right: Telemetry Charts (8 cols) */}
          <div className="lg:col-span-8 space-y-4">
            <div className="bg-surface border border-surface-border rounded-xl p-5 shadow-xs space-y-3">
              <h2 className="text-sm font-bold text-ink">Circadian Transacting Baseline</h2>
              <CircadianHeatmap accountId={activeProfile.account_id} activeWindows={activeProfile.typical_hours} />
            </div>

            <div className="bg-surface border border-surface-border rounded-xl p-5 shadow-xs space-y-3">
              <h2 className="text-sm font-bold text-ink">Velocity Volatility Tracking</h2>
              <VelocityChart accountId={activeProfile.account_id} />
            </div>

            <div className="bg-surface border border-surface-border rounded-xl p-5 shadow-xs space-y-3">
              <h2 className="text-sm font-bold text-ink">Feature Importance Attribution</h2>
              <div className="space-y-2.5 pt-1">
                <ShapFeatureBar label="Circadian Off-Hours Spike" value={0.88} color="bg-rose-500" />
                <ShapFeatureBar label="Single-Hop Velocity Surge" value={0.76} color="bg-orange-500" />
                <ShapFeatureBar label="Novel Counterparty Entropy" value={0.52} color="bg-amber-500" />
                <ShapFeatureBar label="Device Switch Fingerprint" value={0.34} color="bg-blue-500" />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
