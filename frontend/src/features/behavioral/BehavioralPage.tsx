import React, { useState, useEffect } from 'react';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { apiService } from '../../services/api';
import { BehavioralFingerprint } from '../../types';
import { Fingerprint, Activity } from 'lucide-react';

export const BehavioralPage: React.FC = () => {
  const [profiles, setProfiles] = useState<BehavioralFingerprint[]>([]);

  useEffect(() => {
    apiService.getBehavioralProfiles().then(setProfiles);
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white tracking-tight">Behavioral Fingerprinting Intelligence</h2>
        <p className="text-xs text-slate-400 mt-1">
          Historical habit synthesis, circadian transaction rhythms, and sudden behavioral velocity shifts
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {profiles.map((profile) => (
          <Card key={profile.account_id} title={`Profile: ${profile.account_id}`}>
            <div className="space-y-4 pt-1 text-xs">
              <div className="flex items-center justify-between pb-3 border-b border-surface-border">
                <span className="text-slate-400">Baseline Confidence:</span>
                <span className="font-mono font-semibold text-emerald-400">
                  {(profile.confidence_score * 100).toFixed(0)}% Reliable
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-surface-elevated/40 p-3 rounded-lg border border-surface-border">
                  <div className="flex items-center gap-1.5 text-slate-400 mb-1">
                    <Activity className="w-3.5 h-3.5 text-blue-400" />
                    <span>Avg Daily Volume</span>
                  </div>
                  <span className="text-sm font-bold text-white font-mono">
                    ${profile.avg_daily_volume.toLocaleString()}
                  </span>
                </div>

                <div className="bg-surface-elevated/40 p-3 rounded-lg border border-surface-border">
                  <div className="flex items-center gap-1.5 text-slate-400 mb-1">
                    <Fingerprint className="w-3.5 h-3.5 text-rose-400" />
                    <span>Anomalies Logged</span>
                  </div>
                  <span className="text-sm font-bold text-rose-400 font-mono">
                    {profile.anomalies_detected} Events
                  </span>
                </div>
              </div>

              <div>
                <span className="text-slate-400 block mb-1.5">Typical Transacting Windows:</span>
                <div className="flex flex-wrap gap-1.5">
                  {profile.typical_hours.map((h, i) => (
                    <Badge key={i} variant="outline" className="font-mono text-[11px]">
                      {h}
                    </Badge>
                  ))}
                </div>
              </div>

              <div>
                <span className="text-slate-400 block mb-1.5">Whitelisted Baseline Counterparties:</span>
                <div className="flex flex-wrap gap-1.5">
                  {profile.frequent_counterparties.map((cp, i) => (
                    <span
                      key={i}
                      className="px-2 py-0.5 rounded bg-surface-elevated text-slate-300 font-mono text-[11px] border border-surface-border"
                    >
                      {cp}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};
