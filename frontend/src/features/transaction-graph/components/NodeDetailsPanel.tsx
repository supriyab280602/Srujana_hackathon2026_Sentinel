import React from 'react';
import { Link } from 'react-router-dom';
import { GraphNode } from '../../../types';
import { Activity, ArrowUpRight } from 'lucide-react';

interface NodeDetailsPanelProps {
  node?: GraphNode | null;
}

export const NodeDetailsPanel: React.FC<NodeDetailsPanelProps> = ({ node }) => {
  if (!node) {
    return (
      <div className="bg-white border border-neutral-100 rounded-3xl p-6 shadow-sm text-center">
        <h3 className="font-bold text-sm text-neutral-900">Entity Topology Inspector</h3>
        <p className="text-xs text-neutral-400 mt-2">
          Click any account node on the canvas to inspect its centrality and behavioral flags.
        </p>
      </div>
    );
  }

  const riskColor =
    node.riskScore > 70 ? 'text-rose-600' :
    node.riskScore > 40 ? 'text-amber-600' :
    'text-emerald-600';

  return (
    <div className="bg-white border border-neutral-100 rounded-3xl p-6 shadow-sm space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
        <div>
          <h3 className="font-bold text-base text-neutral-900">{node.id}</h3>
          <p className="text-xs text-neutral-400 mt-0.5">{node.label}</p>
        </div>
        <span className="bg-neutral-100 text-neutral-800 text-[11px] font-semibold px-3 py-1 rounded-full uppercase">
          {node.type.replace('_', ' ')}
        </span>
      </div>

      <div className="space-y-3 text-xs">
        <div className="flex items-center justify-between py-1.5 border-b border-neutral-50">
          <span className="text-neutral-500 font-medium">Risk Score</span>
          <span className={`font-bold text-sm ${riskColor}`}>{node.riskScore} / 100</span>
        </div>

        {node.balance !== undefined && (
          <div className="flex items-center justify-between py-1.5 border-b border-neutral-50">
            <span className="text-neutral-500 font-medium">Ledger Balance</span>
            <span className="font-bold text-neutral-900">${node.balance.toLocaleString()}</span>
          </div>
        )}

        <div className="p-4 rounded-2xl bg-[#f7f8fa] border border-neutral-100 space-y-1.5">
          <div className="flex items-center gap-1.5 text-neutral-900 font-bold">
            <Activity className="w-3.5 h-3.5 text-blue-600" />
            <span>Graph Analytics</span>
          </div>
          <div className="text-neutral-500 text-[11px] leading-relaxed">
            Degree Centrality: <b className="text-neutral-800">0.67</b> · In/Out Ratio: <b className="text-neutral-800">1:4</b>
          </div>
        </div>

        <Link
          to={`/accounts/${node.id}`}
          className="inline-flex items-center justify-center gap-1.5 w-full py-3 rounded-full bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-semibold transition-colors mt-2"
        >
          <span>View Full Entity Profile</span>
          <ArrowUpRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
};
