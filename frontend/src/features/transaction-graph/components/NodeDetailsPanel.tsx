import React from 'react';
import { Link } from 'react-router-dom';
import { GraphNode } from '../../../types';
import { formatINR } from '../../../utils/formatters';
import { Activity, ArrowUpRight } from 'lucide-react';

interface NodeDetailsPanelProps {
  node?: GraphNode | null;
}

export const NodeDetailsPanel: React.FC<NodeDetailsPanelProps> = ({ node }) => {
  if (!node) {
    return (
      <div className="bg-surface border border-surface-border rounded-xl p-5 shadow-xs text-center">
        <h3 className="font-semibold text-xs text-ink uppercase tracking-wider">Topology Inspector</h3>
        <p className="text-xs text-ink-muted mt-2">
          Select any node on the graph canvas to inspect ledger balance, centrality, and mule flags.
        </p>
      </div>
    );
  }

  const isCritical = node.riskScore > 70;
  const isMed = node.riskScore > 40;

  return (
    <div className="bg-surface border border-surface-border rounded-xl p-4 shadow-xs space-y-3.5">
      <div className="flex items-center justify-between pb-2.5 border-b border-surface-border">
        <div>
          <h3 className="font-bold text-sm text-ink font-mono">{node.id}</h3>
          <p className="text-[11px] text-ink-muted">{node.label}</p>
        </div>
        <span className="bg-surface-elevated text-ink-secondary text-[10px] font-semibold px-2 py-0.5 rounded border border-surface-border uppercase font-mono">
          {node.type.replace('_', ' ')}
        </span>
      </div>

      <div className="space-y-2.5 text-xs">
        <div className="flex items-center justify-between py-1 border-b border-surface-border">
          <span className="text-ink-secondary font-medium">Risk Score</span>
          <span className={`font-mono font-bold text-xs ${isCritical ? 'text-risk-critical' : isMed ? 'text-risk-medium' : 'text-risk-low'}`}>
            {node.riskScore} / 100
          </span>
        </div>

        {node.balance !== undefined && (
          <div className="flex items-center justify-between py-1 border-b border-surface-border">
            <span className="text-ink-secondary font-medium">Ledger Balance</span>
            <span className="font-mono font-bold text-xs text-ink tabular-nums">{formatINR(node.balance)}</span>
          </div>
        )}

        <div className="p-3 rounded-lg bg-surface-elevated border border-surface-border space-y-1">
          <div className="flex items-center gap-1.5 text-ink font-semibold text-[11px]">
            <Activity className="w-3.5 h-3.5 text-brand-600" />
            <span>NetworkX Topology Metrics</span>
          </div>
          <div className="text-ink-secondary text-[11px] leading-relaxed">
            Degree Centrality: <b className="text-ink font-mono">0.67</b> · Fanout Ratio: <b className="text-ink font-mono">1:4</b>
          </div>
        </div>

        <Link
          to={`/accounts/${node.id}`}
          className="inline-flex items-center justify-center gap-1.5 w-full py-2 rounded-lg bg-brand-950 hover:bg-slate-800 text-white text-xs font-semibold transition-colors shadow-xs"
        >
          <span>View Account Profile</span>
          <ArrowUpRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
};
