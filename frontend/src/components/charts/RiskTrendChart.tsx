import React from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

interface RiskTrendChartProps {
  data?: Array<{ time: string; score: number; baseline: number }>;
}

const defaultData = [
  { time: '10:00', score: 18, baseline: 20 },
  { time: '11:00', score: 22, baseline: 20 },
  { time: '12:00', score: 25, baseline: 21 },
  { time: '13:00', score: 65, baseline: 22 },
  { time: '14:00', score: 92, baseline: 20 },
  { time: '15:00', score: 88, baseline: 21 },
  { time: '16:00', score: 45, baseline: 22 },
];

export const RiskTrendChart: React.FC<RiskTrendChartProps> = ({ data = defaultData }) => {
  return (
    <div className="w-full h-48">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="scoreGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#EF4444" stopOpacity={0.4} />
              <stop offset="95%" stopColor="#EF4444" stopOpacity={0.0} />
            </linearGradient>
            <linearGradient id="baselineGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.2} />
              <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.0} />
            </linearGradient>
          </defs>
          <XAxis dataKey="time" stroke="#64748B" fontSize={11} tickLine={false} />
          <YAxis stroke="#64748B" fontSize={11} tickLine={false} domain={[0, 100]} />
          <Tooltip
            contentStyle={{ backgroundColor: '#1F2937', borderColor: '#374151', borderRadius: '8px', fontSize: '12px' }}
          />
          <Area type="monotone" dataKey="score" stroke="#EF4444" strokeWidth={2} fillOpacity={1} fill="url(#scoreGrad)" name="Risk Score" />
          <Area type="monotone" dataKey="baseline" stroke="#3B82F6" strokeWidth={1} strokeDasharray="3 3" fillOpacity={1} fill="url(#baselineGrad)" name="Baseline Norm" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};
