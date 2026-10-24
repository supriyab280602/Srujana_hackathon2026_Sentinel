import React, { useMemo } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  Node,
  Edge,
  MarkerType,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { AccountNetworkData, GraphNode, GraphEdge } from '../../../types';

interface GraphCanvasProps {
  networkData: AccountNetworkData;
  selectedNodeId?: string | null;
  onSelectNode?: (nodeId: string) => void;
  highlightedStep?: number;
}

export const GraphCanvas: React.FC<GraphCanvasProps> = ({
  networkData,
  selectedNodeId,
  onSelectNode,
}) => {
  // Convert domain nodes to ReactFlow nodes
  const nodes: Node[] = useMemo(() => {
    // Basic circular/hierarchical positioning for scaffold
    const total = networkData.nodes.length;
    const radius = 180;
    const centerX = 260;
    const centerY = 200;

    return networkData.nodes.map((n: GraphNode, idx: number) => {
      const isTarget = n.id === networkData.account_id;
      const angle = (idx / total) * 2 * Math.PI;
      const x = isTarget ? centerX : centerX + radius * Math.cos(angle);
      const y = isTarget ? centerY : centerY + radius * Math.sin(angle);

      const isMule = n.type === 'flagged_mule';
      const isExternal = n.type === 'external_entity';

      let bg = 'bg-surface-elevated';
      let border = 'border-slate-500';
      if (isTarget) {
        bg = 'bg-brand-950';
        border = 'border-brand-500 shadow-[0_0_15px_rgba(59,130,246,0.5)]';
      } else if (isMule) {
        bg = 'bg-rose-950/80';
        border = 'border-rose-500 shadow-[0_0_12px_rgba(244,63,94,0.4)]';
      } else if (isExternal) {
        bg = 'bg-purple-950/80';
        border = 'border-purple-500';
      }

      const isSelected = selectedNodeId === n.id;

      return {
        id: n.id,
        position: { x, y },
        data: {
          label: (
            <div
              onClick={() => onSelectNode && onSelectNode(n.id)}
              className={`p-3 rounded-xl border text-xs cursor-pointer transition-all ${bg} ${border} ${
                isSelected ? 'ring-2 ring-white ring-offset-2 ring-offset-background' : ''
              }`}
            >
              <div className="font-mono font-bold text-slate-100">{n.label}</div>
              <div className="text-[10px] text-slate-400 mt-0.5 flex justify-between gap-3">
                <span>Score: <b className={n.riskScore > 70 ? 'text-rose-400' : 'text-slate-300'}>{n.riskScore}</b></span>
                {n.balance !== undefined && <span>${n.balance.toLocaleString()}</span>}
              </div>
            </div>
          ),
        },
      };
    });
  }, [networkData, selectedNodeId, onSelectNode]);

  // Convert domain edges to ReactFlow edges
  const edges: Edge[] = useMemo(() => {
    return networkData.edges.map((e: GraphEdge) => {
      return {
        id: e.id,
        source: e.source,
        target: e.target,
        animated: e.suspicious,
        label: `$${e.amount.toLocaleString()} (${e.timestamp})`,
        style: {
          stroke: e.suspicious ? '#EF4444' : '#64748B',
          strokeWidth: e.suspicious ? 2.5 : 1.5,
        },
        labelStyle: {
          fill: '#F1F5F9',
          fontWeight: 600,
          fontSize: 10,
        },
        labelBgStyle: {
          fill: '#111827',
          fillOpacity: 0.85,
        },
        labelBgPadding: [6, 3] as [number, number],
        labelBgBorderRadius: 4,
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: e.suspicious ? '#EF4444' : '#64748B',
        },
      };
    });
  }, [networkData]);

  return (
    <div className="w-full h-full min-h-[440px] bg-surface/40 rounded-xl overflow-hidden border border-surface-border">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        fitView
        className="bg-[#0B0F19]"
      >
        <Background color="#1F2937" gap={20} size={1} />
        <Controls className="bg-surface border border-surface-border text-white fill-white" />
      </ReactFlow>
    </div>
  );
};
