import React, { useState, useEffect } from 'react';
import { apiService } from '../../services/api';
import { BehavioralFingerprint } from '../../types';
import { Fingerprint, Clock, TrendingUp, AlertTriangle, ChevronRight } from 'lucide-react';
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
    if (h >= 9 && h <= 17) return 0.7 + Math.random() * 0.3;
    if (h >= 2 && h <= 5) return 0.1 + Math.random() * 0.2;
    return 0.05 + Math.random() * 0.15;
  };

  const intensities = hours.map(baseIntensity);
  const anomalyHours = accountId === 'ACC-7749' ? new Set([2, 3, 14]) : new Set([22]);

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs text-neutral-500 font-medium">Circadian Activity Heatmap (24h UTC)</span>
        <span className="text-[11px] text-neutral-400">Darker = Higher activity</span>
      </div>
      <div className="flex gap-1">
        {hours.map((h) => {
          const intensity = intensities[h];
          const isAnomaly = anomalyHours.has(h);
          return (
            <div key={h} className="flex flex-col items-center gap-1 flex-1">
              <div
                title={`${h.toString().padStart(2, '0')}:00 - ${intensity > 0.5 ? 'Active' : 'Low'}`}
                className={`h-7 w-full rounded-md transition-all ${
                  isAnomaly ? 'bg-rose-500' : intensity > 0.6 ? 'bg-emerald-500' : intensity > 0.3 ? 'bg-emerald-200' : 'bg-neutral-200'
                }`}
                style={{ opacity: Math.max(0.35, intensity) }}
              />
              {h % 6 === 0 && (
                <span className="text-[9px] text-neutral-400 font-medium">{h.toString().padStart(2, '0')}</span>
              )}
            </div>
          );
        })}
      </div>
      <div className="flex items-center gap-4 mt-3 text-[11px] text-neutral-500 font-medium">
        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-500" /> Typical</span>
        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-rose-500" /> Anomaly burst</span>
        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-neutral-300" /> Low / Idle</span>
      </div>
    </div>
  );
};

// Velocity Sparkline
const VelocityChart: React.FC<{ accountId: string }> = ({ accountId }) => {
  const days = 14;
  const baseVol = accountId === 'ACC-7749' ? 12500 : 45000;
  const data = Array.from({ length: days }, (_, i) => {
    const spike = (accountId === 'ACC-7749' && i === 11) ? 4.2 : (accountId === 'ACC-3120' && i === 9) ? 1.8 : 1;
    return Math.round(baseVol * (0.85 + Math.random() * 0.3) * spike);
  });
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
        <span className="text-xs text-neutral-500 font-medium">14-Day Rolling Transaction Velocity</span>
        <span className="text-xs font-bold text-neutral-900">${(data[data.length - 1] / 1000).toFixed(1)}k today</span>
      </div>
      <svg viewBox={`0 0 ${svgW} ${svgH}`} className="w-full h-16 overflow-visible">
        <polyline
          fill="none"
          stroke={accountId === 'ACC-7749' ? '#F43F5E' : '#3B82F6'}
          strokeWidth="2.5"
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
                r="4"
                fill="#F43F5E"
                stroke="#fff"
                strokeWidth="2"
              />
            );
          }
          return null;
        })}
      </svg>
      <div className="flex justify-between text-[10px] text-neutral-400 mt-1 font-medium">
        <span>Day 1</span>
        <span>Day 7</span>
        <span className="text-rose-600 font-bold">Day 12 (Burst)</span>
        <span>Today</span>
      </div>
    </div>
  );
};

// SHAP Feature Bar
const ShapFeatureBar: React.FC<{ label: string; value: number; color: string }> = ({ label, value, color }) => (
  <div className="space-y-1">
    <div className="flex justify-between text-xs">
      <span className="text-neutral-600 font-medium">{label}</span>
      <span className="font-bold text-neutral-900">{(value * 100).toFixed(0)}%</span>
    </div>
    <div className="w-full bg-neutral-100 h-2 rounded-full overflow-hidden">
      <div
        className={`h-full rounded-full transition-all duration-500 ${color}`}
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
    <div className="space-y-8 max-w-[1400px] mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-neutral-900">
            Behavioral Fingerprinting Engine
          </h1>
          <p className="text-xs text-neutral-500 mt-1">
            Dynamic anomaly detection across circadian transacting windows, velocity thresholds, and counterparty shifts
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-100 px-4 py-2 rounded-full self-start md:self-auto shadow-xs">
          <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
          <span>Surveillance Baseline Active · {profiles.length} Profiles</span>
        </div>
      </div>

      {/* Profile Selector Pills */}
      {profiles.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {profiles.map((p) => (
            <button
              key={p.account_id}
              onClick={() => setSelectedProfile(p.account_id)}
              className={`px-5 py-2 rounded-full text-xs font-semibold transition-all ${
                selectedProfile === p.account_id
                  ? 'bg-neutral-900 text-white shadow-xs'
                  : 'bg-white text-neutral-600 border border-neutral-200/80 hover:bg-neutral-50'
              }`}
            >
              {p.account_id}
              {p.account_id === 'ACC-7749' && (
                <span className="ml-2 px-2 py-0.5 rounded-full bg-rose-500 text-white text-[9px] font-bold">HIGH RISK</span>
              )}
            </button>
          ))}
        </div>
      )}

      {activeProfile && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left: Profile Summary (4 cols) */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white border border-neutral-100 rounded-3xl p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                    <Fingerprint className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-bold text-neutral-900 text-sm">{activeProfile.account_id}</div>
                    <div className="text-[10px] text-neutral-400">Behavioral Baseline</div>
                  </div>
                </div>
                <Link to={`/accounts/${activeProfile.account_id}`} className="text-xs text-blue-600 font-semibold hover:underline flex items-center gap-0.5">
                  Profile <ChevronRight className="w-3 h-3" />
                </Link>
              </div>

              <div className="space-y-3 text-xs">
                <div className="flex justify-between items-center py-1.5 border-b border-neutral-50">
                  <span className="text-neutral-500 font-medium">Baseline Confidence</span>
                  <span className="font-bold text-blue-600">{(activeProfile.confidence_score * 100).toFixed(0)}% Reliable</span>
                </div>
                <div className="flex justify-between items-center py-1.5 border-b border-neutral-50">
                  <span className="text-neutral-500 font-medium">Avg Daily Volume</span>
                  <span className="font-bold text-neutral-900">${activeProfile.avg_daily_volume.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center py-1.5 border-b border-neutral-50">
                  <span className="text-neutral-500 font-medium flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-500" /> Anomalies (30d)
                  </span>
                  <span className={`font-bold ${activeProfile.anomalies_detected > 5 ? 'text-rose-600' : 'text-amber-600'}`}>
                    {activeProfile.anomalies_detected} Events
                  </span>
                </div>
                <div className="flex justify-between items-center py-1.5">
                  <span className="text-neutral-500 font-medium flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-neutral-400" /> Active Hours
                  </span>
                  <span className="font-medium text-neutral-800">{activeProfile.typical_hours[0]}</span>
                </div>
              </div>

              {/* Counterparties */}
              <div className="pt-3 border-t border-neutral-100">
                <span className="text-xs font-semibold text-neutral-700 block mb-2">Whitelisted Counterparties</span>
                <div className="flex flex-wrap gap-1.5">
                  {activeProfile.frequent_counterparties.map((cp, i) => (
                    <span key={i} className="px-2.5 py-1 rounded-full bg-neutral-100 text-neutral-700 text-[10px] font-semibold uppercase">
                      {cp}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* SHAP Feature Attribution */}
            <div className="bg-white border border-neutral-100 rounded-3xl p-6 shadow-sm space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-neutral-100">
                <TrendingUp className="w-4 h-4 text-blue-600" />
                <span className="font-bold text-sm text-neutral-900">SHAP Risk Attribution</span>
              </div>
              <div className="space-y-3">
                <ShapFeatureBar label="Velocity Burst Score" value={activeProfile.account_id === 'ACC-7749' ? 0.87 : 0.31} color="bg-rose-500" />
                <ShapFeatureBar label="Circadian Deviation" value={activeProfile.account_id === 'ACC-7749' ? 0.72 : 0.18} color="bg-amber-500" />
                <ShapFeatureBar label="New Counterparty Rate" value={activeProfile.account_id === 'ACC-7749' ? 0.64 : 0.22} color="bg-blue-500" />
                <ShapFeatureBar label="Geographic Dispersion" value={activeProfile.account_id === 'ACC-7749' ? 0.58 : 0.12} color="bg-indigo-500" />
                <ShapFeatureBar label="Device Consistency" value={activeProfile.account_id === 'ACC-7749' ? 0.41 : 0.89} color="bg-emerald-500" />
              </div>
            </div>
          </div>

          {/* Right: Charts & Anomaly Log (8 cols) */}
          <div className="lg:col-span-8 space-y-6">
            <div className="bg-white border border-neutral-100 rounded-3xl p-6 shadow-sm">
              <CircadianHeatmap
                accountId={activeProfile.account_id}
                activeWindows={activeProfile.typical_hours}
              />
            </div>

            <div className="bg-white border border-neutral-100 rounded-3xl p-6 shadow-sm">
              <VelocityChart accountId={activeProfile.account_id} />
            </div>

            <div className="bg-white border border-neutral-100 rounded-3xl p-6 shadow-sm space-y-3">
              <h3 className="font-bold text-sm text-neutral-900">Flagged Behavioral Deviations (Last 30 Days)</h3>
              <div className="space-y-2.5">
                {activeProfile.account_id === 'ACC-7749' ? (
                  <>
                    <div className="flex items-start gap-3 p-4 rounded-2xl bg-rose-50 border border-rose-100 text-xs">
                      <span className="w-2 h-2 rounded-full bg-rose-500 mt-1 shrink-0" />
                      <div className="flex-1">
                        <div className="font-bold text-rose-900">Velocity spike 4.2× above 30-day moving average</div>
                        <div className="text-rose-700 mt-0.5">ACH rapid bursts totaling $125,000 sent to 3 newly created accounts within 12 minutes</div>
                      </div>
                      <span className="text-[10px] font-bold text-rose-800 bg-white px-2 py-0.5 rounded-full border border-rose-200 shrink-0">Day 12</span>
                    </div>
                    <div className="flex items-start gap-3 p-4 rounded-2xl bg-amber-50 border border-amber-100 text-xs">
                      <span className="w-2 h-2 rounded-full bg-amber-500 mt-1 shrink-0" />
                      <div className="flex-1">
                        <div className="font-bold text-amber-900">Circadian deviation — 03:15 UTC transfer</div>
                        <div className="text-amber-700 mt-0.5">Outside established 09:00–17:00 window by 6.25 hours</div>
                      </div>
                      <span className="text-[10px] font-bold text-amber-800 bg-white px-2 py-0.5 rounded-full border border-amber-200 shrink-0">Day 7</span>
                    </div>
                  </>
                ) : (
                  <div className="flex items-start gap-3 p-4 rounded-2xl bg-neutral-50 border border-neutral-100 text-xs">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 mt-1 shrink-0" />
                    <div className="flex-1">
                      <div className="font-bold text-neutral-900">Normal operating parameters maintained</div>
                      <div className="text-neutral-500 mt-0.5">No significant circadian deviations detected in the rolling surveillance window.</div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
