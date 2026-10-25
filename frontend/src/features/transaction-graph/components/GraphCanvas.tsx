import React, { useMemo } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  Node,
  Edge,
  MarkerType,
  BaseEdge,
  getBezierPath,
  EdgeLabelRenderer,
  EdgeProps
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { GraphNode, GraphEdge } from '../types';
import { formatINR } from '../../../utils/formatters';

interface GraphCanvasProps {
  nodes: GraphNode[];
  edges: GraphEdge[];
  selectedNodeId?: string | null;
  onSelectNode?: (nodeId: string) => void;
  replayState?: {
    isActive: boolean;
    activeEdgeId?: string;
    sourceId?: string;
    destId?: string;
    amount?: number;
  };
}

// ── Custom Replay Edge with Flow Pulse ────────────────────────────────────────

const CustomReplayEdge: React.FC<EdgeProps> = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
  data,
}) => {
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const isReplayActive = data?.isReplayActive as boolean | undefined;
  const label = typeof data?.label === 'string' ? data.label : undefined;

  return (
    <>
      <BaseEdge id={id} path={edgePath} style={style} markerEnd={markerEnd} />

      {/* Replay Active Flow Pulse Indicator */}
      {isReplayActive && (
        <circle r={4} fill="#2563EB" stroke="#FFFFFF" strokeWidth={1.5}>
          <animateMotion path={edgePath} dur="0.9s" repeatCount="indefinite" />
        </circle>
      )}

      {/* Amount Label on Edge */}
      {label && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              pointerEvents: 'none',
            }}
            className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold tracking-tight shadow-xs transition-all ${
              isReplayActive
                ? 'bg-brand-950 text-white ring-1 ring-brand-500 scale-105'
                : 'bg-surface text-ink-secondary border border-surface-border'
            }`}
          >
            {label}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
};

const edgeTypes = {
  replayEdge: CustomReplayEdge,
};

// ── Node Builder ─────────────────────────────────────────────────────────────

function nodeTypeStyles(type: GraphNode['type'], isTarget: boolean) {
  if (isTarget) return { bg: '#EFF6FF', border: '#2563EB', ring: '#93C5FD' };
  if (type === 'flagged_mule') return { bg: '#FEF2F2', border: '#DC2626', ring: '#FCA5A5' };
  if (type === 'external_entity') return { bg: '#F8FAFC', border: '#64748B', ring: '#CBD5E1' };
  return { bg: '#FFFFFF', border: '#E2E8F0', ring: '#CBD5E1' };
}

const NODE_COORDINATES: Record<string, { x: number; y: number }> = {
  'ACC-7749': { x: 50, y: 190 },   // Node 0: Source Account
  'ACC-4410': { x: 250, y: 100 },  // Node 1: Mule Branch A
  'ACC-3120': { x: 250, y: 290 },  // Node 3: Mule Branch B
  'ACC-5128': { x: 450, y: 40 },   // Node 2: Mule Sub-Branch A1
  'ACC-8812': { x: 450, y: 165 },  // Node 4: Mule Sub-Branch A2
  'ACC-6204': { x: 450, y: 290 },  // Node 6: Crypto Exit B
  'ACC-9901': { x: 660, y: 105 },  // Node 5: Offshore Gateway
  'ACC-9088': { x: 860, y: 105 },  // Node 7: Shadow Shell Co
};

function buildNode(
  n: GraphNode,
  idx: number,
  total: number,
  isTarget: boolean,
  selectedNodeId: string | null | undefined,
  replayState: { sourceId?: string; destId?: string; isActive: boolean },
  onSelectNode?: (id: string) => void,
): Node {
  const isNodeZero = n.id === 'ACC-7749';
  const coord = NODE_COORDINATES[n.id];
  let x: number;
  let y: number;

  if (coord) {
    x = coord.x;
    y = coord.y;
  } else {
    const radius = 175;
    const cx = 320;
    const cy = 230;
    const angle = (idx / Math.max(total, 1)) * 2 * Math.PI;
    x = isTarget ? cx : cx + radius * Math.cos(angle);
    y = isTarget ? cy : cy + radius * Math.sin(angle);
  }

  const { bg, border, ring } = nodeTypeStyles(n.type, isTarget);
  const isSelected = selectedNodeId === n.id;
  const isSource = replayState.isActive && replayState.sourceId === n.id;
  const isDest = replayState.isActive && replayState.destId === n.id;

  let ringStyle = '';
  if (isSource) ringStyle = '0 0 0 2px #DC2626, 0 2px 8px rgba(220,38,38,0.2)';
  else if (isDest) ringStyle = '0 0 0 2px #2563EB, 0 2px 8px rgba(37,99,235,0.2)';
  else if (isSelected) ringStyle = `0 0 0 2px ${ring}`;

  const bgColor = isSource ? '#FEF2F2' : isDest ? '#EFF6FF' : bg;
  const borderColor = isSource ? '#DC2626' : isDest ? '#2563EB' : border;

  return {
    id: n.id,
    position: { x, y },
    data: {
      label: (
        <div
          onClick={() => onSelectNode && onSelectNode(n.id)}
          style={{
            padding: '8px 12px',
            borderRadius: 8,
            border: `1.5px solid ${borderColor}`,
            backgroundColor: bgColor,
            boxShadow: ringStyle || '0 1px 3px rgba(15,23,42,0.06)',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
            minWidth: 125,
          }}
          className="hover:shadow-sm"
        >
          <div style={{ fontWeight: 700, fontSize: 11, color: '#0F172A', fontFamily: 'JetBrains Mono, monospace' }}>
            {n.label}
          </div>
          <div style={{ marginTop: 3, display: 'flex', justifyContent: 'space-between', gap: 6, fontSize: 10, color: '#475569' }}>
            <span>
              Risk:{' '}
              <b style={{ color: n.riskScore > 70 ? '#DC2626' : n.riskScore > 40 ? '#D97706' : '#16A34A', fontFamily: 'JetBrains Mono, monospace' }}>
                {n.riskScore}
              </b>
            </span>
            {n.balance !== undefined && (
              <span style={{ fontWeight: 600, fontFamily: 'JetBrains Mono, monospace' }}>
                {formatINR(n.balance, { compact: true })}
              </span>
            )}
          </div>

          {isSource ? (
            <div
              style={{
                marginTop: 4,
                padding: '2px 4px',
                borderRadius: 4,
                fontSize: 9,
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
                textAlign: 'center',
                backgroundColor: '#FEE2E2',
                color: '#991B1B',
              }}
            >
              {isNodeZero ? '▶ Node 0 (Source Hop)' : '▶ Source Hop'}
            </div>
          ) : isDest ? (
            <div
              style={{
                marginTop: 4,
                padding: '2px 4px',
                borderRadius: 4,
                fontSize: 9,
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
                textAlign: 'center',
                backgroundColor: '#DBEAFE',
                color: '#1E40AF',
              }}
            >
              ◀ Active Destination
            </div>
          ) : isNodeZero ? (
            <div
              style={{
                marginTop: 4,
                padding: '2px 4px',
                borderRadius: 4,
                fontSize: 9,
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
                textAlign: 'center',
                backgroundColor: '#EFF6FF',
                color: '#1D4ED8',
                border: '1px solid #BFDBFE',
              }}
            >
              ★ Node 0: Origin Account
            </div>
          ) : null}
        </div>
      ),
    },
  };
}

function buildEdge(
  e: GraphEdge,
  activeEdgeId?: string,
  replaySourceId?: string,
  replayDestId?: string,
): Edge {
  const isReplayActive =
    (activeEdgeId !== undefined && e.id === activeEdgeId) ||
    (e.source === replaySourceId && e.target === replayDestId);

  return {
    id: e.id,
    type: 'replayEdge',
    source: e.source,
    target: e.target,
    data: {
      isReplayActive,
      label: formatINR(e.amount),
    },
    style: {
      stroke: isReplayActive ? '#2563EB' : e.suspicious ? '#DC2626' : '#CBD5E1',
      strokeWidth: isReplayActive ? 3.5 : e.suspicious ? 1.75 : 1.25,
      strokeDasharray: isReplayActive ? '4 3' : undefined,
    },
    markerEnd: {
      type: MarkerType.ArrowClosed,
      color: isReplayActive ? '#2563EB' : e.suspicious ? '#DC2626' : '#94A3B8',
      width: 14,
      height: 14,
    },
  };
}

export const GraphCanvas: React.FC<GraphCanvasProps> = ({
  nodes,
  edges,
  selectedNodeId,
  onSelectNode,
  replayState = { isActive: false },
}) => {
  const targetId = 'ACC-7749';

  const flowNodes: Node[] = useMemo(() => {
    return nodes.map((n, idx) =>
      buildNode(
        n,
        idx,
        nodes.length,
        n.id === targetId,
        selectedNodeId,
        replayState,
        onSelectNode,
      ),
    );
  }, [nodes, selectedNodeId, replayState, onSelectNode]);

  const flowEdges: Edge[] = useMemo(() => {
    return edges.map((e) =>
      buildEdge(
        e,
        replayState.activeEdgeId,
        replayState.sourceId,
        replayState.destId,
      ),
    );
  }, [edges, replayState]);

  return (
    <div className="w-full h-[520px] rounded-xl overflow-hidden border border-surface-border relative bg-surface-subtle shadow-xs">
      <ReactFlow
        nodes={flowNodes}
        edges={flowEdges}
        edgeTypes={edgeTypes}
        fitView
        attributionPosition="bottom-left"
        minZoom={0.5}
        maxZoom={1.5}
        proOptions={{ hideAttribution: true }}
      >
        <Background color="#CBD5E1" gap={16} size={0.75} />
        <Controls className="!bg-surface !border !border-surface-border !shadow-xs !rounded-lg overflow-hidden" />
      </ReactFlow>

      {/* Institutional Legend Overlay */}
      <div className="absolute bottom-3 right-3 bg-surface/95 backdrop-blur-xs border border-surface-border rounded-lg p-2.5 text-[10px] space-y-1 shadow-xs pointer-events-none select-none">
        <div className="font-semibold text-ink uppercase tracking-wider text-[9px] mb-1">
          Topology Legend
        </div>
        <div className="flex items-center gap-2 text-ink-secondary">
          <span className="w-2.5 h-2.5 rounded bg-blue-50 border border-blue-600 shrink-0" />
          <span>Surveillance Target</span>
        </div>
        <div className="flex items-center gap-2 text-ink-secondary">
          <span className="w-2.5 h-2.5 rounded bg-red-50 border border-red-600 shrink-0" />
          <span>Flagged Mule Node</span>
        </div>
        <div className="flex items-center gap-2 text-ink-secondary">
          <span className="w-2.5 h-2.5 rounded bg-slate-50 border border-slate-400 shrink-0" />
          <span>External Entity</span>
        </div>
        <div className="flex items-center gap-2 text-ink-secondary pt-0.5 border-t border-surface-border">
          <span className="w-3.5 h-0.5 bg-red-500 shrink-0" />
          <span>Structuring Hop</span>
        </div>
      </div>
    </div>
  );
};
