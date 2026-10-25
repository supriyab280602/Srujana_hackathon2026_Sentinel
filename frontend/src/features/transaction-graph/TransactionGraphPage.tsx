import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { GraphCanvas } from './components/GraphCanvas';
import { NodeDetailsPanel } from './components/NodeDetailsPanel';
import { GraphControls } from './components/GraphControls';
import { ReplayControls } from './replay/ReplayControls';
import { EventTimeline } from './replay/EventTimeline';
import { RiskScoreHistory } from './replay/RiskScoreHistory';
import { CurrentEventEvidence } from './replay/CurrentEventEvidence';
import { GraphViewMode } from './types';
import { apiService } from '../../services/api';
import { AccountNetworkData } from '../../types';
import { Info, GripVertical, RotateCcw } from 'lucide-react';
import {
  CANONICAL_REPLAY_EVENTS,
  CANONICAL_NETWORK_DATA,
} from './canonicalData';

// Canonical Replay Events: exactly 8 transactions deterministically ordered from Node 0 (ACC-7749)
const REPLAY_EVENTS = CANONICAL_REPLAY_EVENTS;

const SPEED_OPTIONS = [0.5, 1, 1.5, 2] as const;
type Speed = (typeof SPEED_OPTIONS)[number];
const BASE_INTERVAL_MS = 2200;

export const TransactionGraphPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const accountParam = searchParams.get('account') || 'ACC-7749';

  const [networkData, setNetworkData] = useState<AccountNetworkData | null>(CANONICAL_NETWORK_DATA);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>('ACC-7749');
  const [mode, setMode] = useState<GraphViewMode>('exploration');

  // Replay state - strictly starts at Step 1 (Node 0: ACC-7749)
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [speed, setSpeed] = useState<Speed>(1);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    // For the primary investigation scenario (ACC-7749), load canonical 8-transaction network
    if (accountParam === 'ACC-7749' || !accountParam) {
      setNetworkData(CANONICAL_NETWORK_DATA);
      setSelectedNodeId('ACC-7749');
    } else {
      apiService.getAccountNetwork(accountParam).then((data) => {
        setNetworkData(data);
        setSelectedNodeId(accountParam);
      });
    }
  }, [accountParam]);

  const clearTicker = useCallback(() => {
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  useEffect(() => {
    clearTicker();
    if (!isPlaying || mode !== 'replay') return;

    intervalRef.current = setInterval(() => {
      setCurrentStep((prev) => {
        if (prev >= REPLAY_EVENTS.length) {
          setIsPlaying(false);
          return prev;
        }
        return prev + 1;
      });
    }, BASE_INTERVAL_MS / speed);

    return clearTicker;
  }, [isPlaying, mode, speed, clearTicker]);

  const handleModeChange = useCallback((next: GraphViewMode) => {
    if (next === 'replay') {
      clearTicker();
      setIsPlaying(false);
      setCurrentStep(1);
      setSelectedNodeId('ACC-7749');
    }
    setMode(next);
  }, [clearTicker]);

  const handleTogglePlay = useCallback(() => {
    setIsPlaying((prev) => {
      if (!prev && currentStep >= REPLAY_EVENTS.length) {
        setCurrentStep(1);
        setSelectedNodeId('ACC-7749');
      }
      return !prev;
    });
  }, [currentStep]);

  const handleStepForward = useCallback(() => {
    setIsPlaying(false);
    clearTicker();
    setCurrentStep((s) => Math.min(s + 1, REPLAY_EVENTS.length));
  }, [clearTicker]);

  const handleStepBackward = useCallback(() => {
    setIsPlaying(false);
    clearTicker();
    setCurrentStep((s) => Math.max(s - 1, 1));
  }, [clearTicker]);

  const handleReset = useCallback(() => {
    clearTicker();
    setIsPlaying(false);
    setCurrentStep(1);
    setSelectedNodeId('ACC-7749');
  }, [clearTicker]);

  const handleSeek = useCallback((step: number) => {
    setIsPlaying(false);
    clearTicker();
    setCurrentStep(Math.max(1, Math.min(step, REPLAY_EVENTS.length)));
  }, [clearTicker]);

  useEffect(() => () => clearTicker(), [clearTicker]);

  // Draggable workspace state
  const workspaceRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const dragStartRef = useRef<{
    startX: number;
    startY: number;
    initialPosX: number;
    initialPosY: number;
    pointerId: number;
  } | null>(null);

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    const target = e.target as HTMLElement;
    if (target.closest('button, a, input, select, textarea, [role="button"], [data-no-drag="true"]')) {
      return;
    }

    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // Ignore if pointer capture unsupported
    }

    dragStartRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      initialPosX: position.x,
      initialPosY: position.y,
      pointerId: e.pointerId,
    };
    setIsDragging(true);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragStartRef.current || dragStartRef.current.pointerId !== e.pointerId) return;

    const deltaX = e.clientX - dragStartRef.current.startX;
    const deltaY = e.clientY - dragStartRef.current.startY;

    const targetX = dragStartRef.current.initialPosX + deltaX;
    const targetY = dragStartRef.current.initialPosY + deltaY;

    if (workspaceRef.current) {
      const rect = workspaceRef.current.getBoundingClientRect();
      const unTransformedLeft = rect.left - position.x;
      const unTransformedTop = rect.top - position.y;

      const minX = 10 - unTransformedLeft;
      const maxX = Math.max(minX, window.innerWidth - 140 - unTransformedLeft);
      const minY = 10 - unTransformedTop;
      const maxY = Math.max(minY, window.innerHeight - 80 - unTransformedTop);

      const clampedX = Math.max(minX, Math.min(targetX, maxX));
      const clampedY = Math.max(minY, Math.min(targetY, maxY));

      setPosition({ x: Math.round(clampedX), y: Math.round(clampedY) });
    } else {
      setPosition({ x: targetX, y: targetY });
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (dragStartRef.current && dragStartRef.current.pointerId === e.pointerId) {
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch {
        // Ignore
      }
      dragStartRef.current = null;
      setIsDragging(false);
    }
  };

  const selectedNode = networkData?.nodes.find((n) => n.id === selectedNodeId) || null;
  const currentEvent = REPLAY_EVENTS.find((e) => e.step === currentStep);
  const isReplayMode = mode === 'replay';
  const isRepositioned = position.x !== 0 || position.y !== 0;

  return (
    <div
      ref={workspaceRef}
      style={{
        transform: isRepositioned ? `translate3d(${position.x}px, ${position.y}px, 0)` : undefined,
        willChange: isDragging ? 'transform' : undefined,
      }}
      className={`space-y-5 max-w-[1440px] mx-auto pb-10 transition-shadow ${
        isRepositioned
          ? 'relative z-20 shadow-2xl rounded-2xl p-4 bg-background/95 ring-1 ring-surface-border backdrop-blur-xs'
          : ''
      }`}
    >
      {/* Title & Mode Switcher (Drag Handle) */}
      <div
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        className={`flex flex-col md:flex-row md:items-center justify-between gap-4 p-3 rounded-xl border transition-colors touch-none select-none ${
          isDragging
            ? 'cursor-grabbing bg-brand-50/80 border-brand-300 ring-2 ring-brand-400/20 shadow-xs'
            : 'cursor-grab bg-surface/60 hover:bg-surface border-surface-border hover:border-slate-300'
        }`}
        title="Transaction Relationship Graph workspace handle (click and drag to reposition)"
      >
        <div className="flex items-start sm:items-center gap-2.5">
          <div
            className="mt-0.5 sm:mt-0 p-1 rounded text-ink-muted hover:text-brand-600 flex items-center justify-center shrink-0"
            aria-hidden="true"
          >
            <GripVertical className="w-4 h-4 text-ink-muted" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-ink flex flex-wrap items-center gap-2">
              <span>Transaction Relationship Graph &amp; Replay</span>
              <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-brand-50 text-brand-700 border border-brand-200">
                {networkData?.max_hops || 3} Hops
              </span>
              {isRepositioned && (
                <button
                  type="button"
                  onClick={() => setPosition({ x: 0, y: 0 })}
                  className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-medium text-ink-secondary bg-surface hover:text-ink hover:bg-slate-100 border border-surface-border rounded-md shadow-2xs transition-colors cursor-pointer"
                  title="Reset workspace to default position"
                  data-no-drag="true"
                >
                  <RotateCcw className="w-3 h-3 text-ink-muted" />
                  <span>Reset Position</span>
                </button>
              )}
            </h1>
            <p className="text-xs text-ink-secondary mt-0.5">
              NetworkX multi-hop transaction topology, circular layering loop discovery, and chronological flow playback
            </p>
          </div>
        </div>

        <div data-no-drag="true" className="shrink-0">
          <GraphControls
            mode={mode}
            onModeChange={handleModeChange}
            onRefresh={() => setSelectedNodeId(accountParam)}
          />
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Canvas + Controls (Left/Center ~65% = 8 cols) */}
        <div className="lg:col-span-8 space-y-4">
          {networkData ? (
            <GraphCanvas
              nodes={networkData.nodes}
              edges={networkData.edges}
              selectedNodeId={selectedNodeId}
              onSelectNode={setSelectedNodeId}
              replayState={
                isReplayMode && currentEvent
                  ? {
                      isActive: true,
                      activeEdgeId: `e${currentStep}`,
                      sourceId: currentEvent.sourceAccount,
                      destId: currentEvent.targetAccount,
                      amount: currentEvent.amount,
                    }
                  : { isActive: false }
              }
            />
          ) : (
            <div className="h-[520px] rounded-xl border border-surface-border flex items-center justify-center text-xs text-ink-muted bg-surface">
              Loading transaction topology…
            </div>
          )}

          {isReplayMode && (
            <ReplayControls
              currentStep={currentStep}
              totalSteps={REPLAY_EVENTS.length}
              isPlaying={isPlaying}
              speed={speed}
              onTogglePlay={handleTogglePlay}
              onStepForward={handleStepForward}
              onStepBackward={handleStepBackward}
              onReset={handleReset}
              onStepChange={handleSeek}
              onSpeedChange={setSpeed}
            />
          )}
        </div>

        {/* Right Details Panel (~35% = 4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          {!isReplayMode ? (
            <>
              <NodeDetailsPanel node={selectedNode} />
              <div className="p-4 bg-surface border border-surface-border rounded-xl shadow-xs text-xs space-y-2">
                <span className="font-semibold text-ink flex items-center gap-1.5 text-xs">
                  <Info className="w-3.5 h-3.5 text-brand-600" />
                  <span>Investigator Guidelines</span>
                </span>
                <p className="text-ink-secondary leading-relaxed text-[11px]">
                  • Colored nodes identify entity KYC risk tiers and mule accounts.
                </p>
                <p className="text-ink-secondary leading-relaxed text-[11px]">
                  • Switch to <strong>Replay Mode</strong> above to animate the exact transaction sequence and watch composite risk escalate over time.
                </p>
              </div>
            </>
          ) : (
            <>
              <RiskScoreHistory events={REPLAY_EVENTS} currentStep={currentStep} />
              <CurrentEventEvidence currentEvent={currentEvent} />
              <EventTimeline
                events={REPLAY_EVENTS}
                activeStep={currentStep}
                onSelectStep={handleSeek}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
};
