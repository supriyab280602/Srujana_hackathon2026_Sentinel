import React from 'react';
import { Card } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { GraphNode } from '../../../types';
import { Activity } from 'lucide-react';

interface NodeDetailsPanelProps {
  node?: GraphNode | null;
}

export const NodeDetailsPanel: React.FC<NodeDetailsPanelProps> = ({ node }) => {
  if (!node) {
    return (
      <Card title="Node Inspection" subtitle="Select an entity or transaction hop">
        <p className="text-xs text-slate-500 py-4 text-center">
          Click any account node on the canvas to inspect degree centrality and behavioral flags.
        </p>
      </Card>
    );
  }

  return (
    <Card title={`Entity: ${node.id}`} subtitle={node.label}>
      <div className="space-y-3 pt-2 text-xs">
        <div className="flex items-center justify-between pb-2 border-b border-surface-border">
          <span className="text-slate-400">Classification</span>
          <Badge variant={node.type === 'flagged_mule' ? 'critical' : 'info'}>
            {node.type.toUpperCase().replace('_', ' ')}
          </Badge>
        </div>

        <div className="flex items-center justify-between pb-2 border-b border-surface-border">
          <span className="text-slate-400">Risk Score</span>
          <span className="font-mono font-bold text-rose-400">{node.riskScore} / 100</span>
        </div>

        {node.balance !== undefined && (
          <div className="flex items-center justify-between pb-2 border-b border-surface-border">
            <span className="text-slate-400">Est. Node Balance</span>
            <span className="font-mono text-slate-200">${node.balance.toLocaleString()}</span>
          </div>
        )}

        <div className="p-2.5 rounded-lg bg-surface-elevated/40 border border-surface-border/60 text-[11px] text-slate-400">
          <div className="flex items-center gap-1.5 text-slate-300 font-semibold mb-1">
            <Activity className="w-3.5 h-3.5 text-brand-400" />
            <span>Graph Analytics (NetworkX Ready)</span>
          </div>
          Degree Centrality: <span className="text-slate-200 font-mono">0.67</span> • In/Out Ratio: <span className="text-slate-200 font-mono">1:4</span>
        </div>
      </div>
    </Card>
  );
};
