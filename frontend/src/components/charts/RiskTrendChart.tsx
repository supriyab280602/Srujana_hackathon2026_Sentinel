import React from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid
} from 'recharts';

interface RiskTrendChartProps {
  data?: Array<{ time: string; score: number; baseline: number }>;
}

const defaultData = [
  { time: 'Jan', score: 32, baseline: 20 },
  { time: 'Feb', score: 48, baseline: 22 },
  { time: 'Mar', score: 25, baseline: 21 },
  { time: 'Apr', score: 62, baseline: 22 },
  { time: 'May', score: 38, baseline: 24 },
  { time: 'Jun', score: 71, baseline: 23 },
  { time: 'Jul', score: 42, baseline: 25 },
  { time: 'Aug', score: 55, baseline: 26 },
  { time: 'Sep', score: 34, baseline: 24 },
  { time: 'Oct', score: 88, baseline: 25 },
];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#151619] text-white px-3.5 py-2 rounded-xl shadow-xl text-center select-none border border-neutral-800">
        <p className="text-[10px] text-neutral-400 font-medium uppercase tracking-wider">{label} 24, 2026</p>
        <p className="text-sm font-bold mt-0.5 text-white">Risk: {payload[0].value} / 100</p>
      </div>
    );
  }
  return null;
};

export const RiskTrendChart: React.FC<RiskTrendChartProps> = ({ data = defaultData }) => {
  return (
    <div className="w-full h-64 pt-2">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="blueGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#60A5FA" stopOpacity={0.25} />
              <stop offset="100%" stopColor="#93C5FD" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} stroke="#F1F5F9" strokeDasharray="3 3" />
          <XAxis
            dataKey="time"
            stroke="#94A3B8"
            fontSize={11}
            tickLine={false}
            axisLine={false}
            dy={8}
          />
          <YAxis
            stroke="#94A3B8"
            fontSize={11}
            tickLine={false}
            axisLine={false}
            domain={[0, 100]}
            tickFormatter={(val) => `${val}k`}
          />
          <Tooltip content={<CustomTooltip />} />
          <Area
            type="natural"
            dataKey="score"
            stroke="#3B82F6"
            strokeWidth={2.5}
            fillOpacity={1}
            fill="url(#blueGradient)"
            activeDot={{ r: 5, fill: '#1E40AF', stroke: '#EFF6FF', strokeWidth: 3 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};
