import React, { useMemo, useEffect } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  Node,
  Edge,
  MarkerType,
  useNodesState,
  useEdgesState,
  getBezierPath,
  BaseEdge,
  EdgeProps,
  EdgeLabelRenderer,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { AccountNetworkData, GraphNode, GraphEdge } from '../../../types';
import { ReplayEvent } from '../types';

interface GraphCanvasProps {
  networkData: AccountNetworkData;
  selectedNodeId?: string | null;
  onSelectNode?: (nodeId: string) => void;
  highlightedStep?: number;
  replayEvents?: ReplayEvent[];
  isReplaying?: boolean;
}

// ── Custom Animated Replay Edge ──────────────────────────────────────────────

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

  const isReplayActive = Boolean(data?.isReplayActive);
  const label = typeof data?.label === 'string' ? data.label : undefined;

  return (
    <>
      <BaseEdge id={id} path={edgePath} style={style} markerEnd={markerEnd} />

      {/* Real Animated Traveling Particle Marker along the directed edge */}
      {isReplayActive && (
        <>
          {/* Outer glow ring */}
          <circle r="7" fill="#3B82F6" opacity="0.35">
            <animateMotion dur="1.2s" repeatCount="indefinite" path={edgePath} />
          </circle>
          {/* Main traveling marker */}
          <circle r="5" fill="#2563EB" stroke="#FFFFFF" strokeWidth="2">
            <animateMotion dur="1.2s" repeatCount="indefinite" path={edgePath} />
          </circle>
          {/* Center core */}
          <circle r="2" fill="#FFFFFF">
            <animateMotion dur="1.2s" repeatCount="indefinite" path={edgePath} />
          </circle>
        </>
      )}

      {/* Transaction Label Pill */}
      {label && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              pointerEvents: 'all',
            }}
            className={`px-2.5 py-1 rounded-full text-[10px] font-semibold tracking-tight shadow-xs transition-all ${
              isReplayActive
                ? 'bg-blue-600 text-white shadow-md ring-2 ring-blue-300'
                : 'bg-white text-neutral-700 border border-neutral-200/80 hover:border-neutral-300'
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
  if (isTarget) return { bg: '#F0F5FF', border: '#3B82F6', ring: '#93C5FD' };
  if (type === 'flagged_mule') return { bg: '#FEF2F2', border: '#EF4444', ring: '#FCA5A5' };
  if (type === 'external_entity') return { bg: '#FAF5FF', border: '#8B5CF6', ring: '#C4B5FD' };
  return { bg: '#FFFFFF', border: '#E2E8F0', ring: '#CBD5E1' };
}

function buildNode(
  n: GraphNode,
  idx: number,
  total: number,
  isTarget: boolean,
  selectedNodeId: string | null | undefined,
  replayState: { sourceId?: string; destId?: string; isActive: boolean },
  onSelectNode?: (id: string) => void,
): Node {
  const radius = 180;
  const cx = 320, cy = 240;
  const angle = (idx / total) * 2 * Math.PI;
  const x = isTarget ? cx : cx + radius * Math.cos(angle);
  const y = isTarget ? cy : cy + radius * Math.sin(angle);

  const { bg, border, ring } = nodeTypeStyles(n.type, isTarget);
  const isSelected = selectedNodeId === n.id;
  const isSource = replayState.isActive && replayState.sourceId === n.id;
  const isDest = replayState.isActive && replayState.destId === n.id;

  let ringStyle = '';
  if (isSource) ringStyle = '0 0 0 4px rgba(239,68,68,0.35)';
  else if (isDest) ringStyle = '0 0 0 4px rgba(59,130,246,0.35)';
  else if (isSelected) ringStyle = `0 0 0 2px ${ring}`;

  const bgColor = isSource ? '#FEF2F2' : isDest ? '#EFF6FF' : bg;
  const borderColor = isSource ? '#EF4444' : isDest ? '#3B82F6' : border;

  return {
    id: n.id,
    position: { x, y },
    data: {
      label: (
        <div
          onClick={() => onSelectNode && onSelectNode(n.id)}
          style={{
            padding: '10px 14px',
            borderRadius: 16,
            border: `2px solid ${borderColor}`,
            backgroundColor: bgColor,
            boxShadow: ringStyle || '0 2px 8px rgba(0,0,0,0.04)',
            cursor: 'pointer',
            transition: 'all 0.25s ease',
            minWidth: 130,
          }}
          className="hover:scale-[1.02]"
        >
          <div style={{ fontWeight: 700, fontSize: 12, color: '#0F172A' }}>
            {n.label}
          </div>
          <div style={{ marginTop: 4, display: 'flex', justifyContent: 'space-between', gap: 8, fontSize: 11, color: '#64748B' }}>
            <span>
              Risk:{' '}
              <b style={{ color: n.riskScore > 70 ? '#DC2626' : n.riskScore > 40 ? '#D97706' : '#16A34A' }}>
                {n.riskScore}
              </b>
            </span>
            {n.balance !== undefined && <span>${(n.balance / 1000).toFixed(0)}k</span>}
          </div>

          {(isSource || isDest) && (
            <div
              style={{
                marginTop: 6,
                padding: '2px 6px',
                borderRadius: 9999,
                fontSize: 9,
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                textAlign: 'center',
                backgroundColor: isSource ? '#FEE2E2' : '#DBEAFE',
                color: isSource ? '#991B1B' : '#1E40AF',
              }}
            >
              {isSource ? '▶ Active Source' : '◀ Destination'}
            </div>
          )}
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
    activeEdgeId !== undefined &&
    e.source === replaySourceId &&
    e.target === replayDestId;

  return {
    id: e.id,
    type: 'replayEdge',
    source: e.source,
    target: e.target,
    data: {
      isReplayActive,
      label: `$${e.amount.toLocaleString()}`,
    },
    style: {
      stroke: isReplayActive ? '#2563EB' : e.suspicious ? '#EF4444' : '#CBD5E1',
      strokeWidth: isReplayActive ? 3.5 : e.suspicious ? 2 : 1.5,
      strokeDasharray: isReplayActive ? '6 4' : undefined,
    },
    markerEnd: {
      type: MarkerType.ArrowClosed,
      color: isReplayActive ? '#2563EB' : e.suspicious ? '#EF4444' : '#94A3B8',
      width: 14,
      height: 14,
    },
  };
}

// ── GraphCanvas Component ─────────────────────────────────────────────────────

export const GraphCanvas: React.FC<GraphCanvasProps> = ({
  networkData,
  selectedNodeId,
  onSelectNode,
  highlightedStep,
  replayEvents = [],
  isReplaying = false,
}) => {
  // Determine current replay event
  const currentEvent = useMemo(() => {
    if (!isReplaying || highlightedStep === undefined) return null;
    return replayEvents.find((e) => e.step === highlightedStep) ?? null;
  }, [isReplaying, highlightedStep, replayEvents]);

  const replayState = useMemo(() => ({
    isActive: isReplaying && currentEvent !== null,
    sourceId: currentEvent?.sourceAccount,
    destId: currentEvent?.targetAccount,
  }), [isReplaying, currentEvent]);

  // Build nodes
  const initialNodes = useMemo(() => {
    const total = networkData.nodes.length;
    return networkData.nodes.map((n, idx) =>
      buildNode(
        n,
        idx,
        total,
        n.id === networkData.account_id,
        selectedNodeId,
        replayState,
        onSelectNode,
      )
    );
  }, [networkData, selectedNodeId, replayState, onSelectNode]);

  // Find active edge matching source -> destination
  const activeEdgeId = useMemo(() => {
    if (!currentEvent) return undefined;
    return networkData.edges.find(
      (e) => e.source === currentEvent.sourceAccount && e.target === currentEvent.targetAccount
    )?.id;
  }, [networkData.edges, currentEvent]);

  // Build edges
  const initialEdges = useMemo(() => {
    return networkData.edges.map((e) =>
      buildEdge(e, activeEdgeId, currentEvent?.sourceAccount, currentEvent?.targetAccount)
    );
  }, [networkData.edges, activeEdgeId, currentEvent]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // Sync whenever replay step or selection changes
  useEffect(() => { setNodes(initialNodes); }, [initialNodes, setNodes]);
  useEffect(() => { setEdges(initialEdges); }, [initialEdges, setEdges]);

  return (
    <div className="w-full h-full min-h-[480px] rounded-3xl overflow-hidden border border-neutral-100 bg-[#fafbfe]">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        edgeTypes={edgeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        fitView
      >
        <Background color="#E2E8F0" gap={24} size={1} />
        <Controls
          style={{
            background: '#ffffff',
            border: '1px solid #F1F5F9',
            borderRadius: 12,
            boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
          }}
        />
      </ReactFlow>
    </div>
  );
};
