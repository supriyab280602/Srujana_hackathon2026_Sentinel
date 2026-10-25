import React from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  ReferenceLine
} from 'recharts';
import { formatINR } from '../../utils/formatters';

interface RiskTrendChartProps {
  data?: Array<{ time: string; score: number; baseline: number }>;
}

const defaultData = [
  { time: '00:00', score: 22, baseline: 25 },
  { time: '03:00', score: 18, baseline: 25 },
  { time: '06:00', score: 26, baseline: 25 },
  { time: '09:00', score: 38, baseline: 28 },
  { time: '12:00', score: 54, baseline: 30 },
  { time: '14:00', score: 94, baseline: 30 }, // Peak fanout burst
  { time: '15:00', score: 86, baseline: 30 },
  { time: '18:00', score: 62, baseline: 28 },
  { time: '21:00', score: 45, baseline: 25 },
  { time: '23:59', score: 34, baseline: 25 },
];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const score = payload[0].value;
    const estExposure = score * 5000;
    return (
      <div className="bg-slate-900 text-white px-3 py-2 rounded-lg shadow-lg text-left select-none border border-slate-800 text-xs">
        <div className="text-[10px] text-slate-400 font-mono">Timestamp: {label} UTC</div>
        <div className="font-semibold text-white mt-0.5 flex items-center justify-between gap-4">
          <span>Risk Threat Index:</span>
          <span className="font-mono tabular-nums text-rose-400">{score} / 100</span>
        </div>
        <div className="text-[11px] text-slate-300 mt-0.5 flex items-center justify-between gap-4 border-t border-slate-800 pt-1">
          <span>Est. 1h Exposure:</span>
          <span className="font-mono tabular-nums text-emerald-400 font-semibold">{formatINR(estExposure)}</span>
        </div>
      </div>
    );
  }
  return null;
};

export const RiskTrendChart: React.FC<RiskTrendChartProps> = ({ data = defaultData }) => {
  return (
    <div className="w-full h-56 pt-2">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 12, left: -22, bottom: 0 }}>
          <defs>
            <linearGradient id="riskGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#2563EB" stopOpacity={0.2} />
              <stop offset="100%" stopColor="#2563EB" stopOpacity={0.01} />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} stroke="#E2E8F0" strokeDasharray="2 2" />
          <XAxis
            dataKey="time"
            stroke="#94A3B8"
            fontSize={10}
            tickLine={false}
            axisLine={false}
            dy={6}
          />
          <YAxis
            stroke="#94A3B8"
            fontSize={10}
            tickLine={false}
            axisLine={false}
            domain={[0, 100]}
            ticks={[0, 25, 50, 75, 100]}
          />
          <ReferenceLine y={80} stroke="#EF4444" strokeDasharray="3 3" label={{ value: 'Critical (80)', fill: '#EF4444', fontSize: 9, position: 'insideTopRight' }} />
          <Tooltip content={<CustomTooltip />} />
          <Area
            type="monotone"
            dataKey="score"
            stroke="#1D4ED8"
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#riskGradient)"
            activeDot={{ r: 4, fill: '#1D4ED8', stroke: '#FFFFFF', strokeWidth: 2 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};
