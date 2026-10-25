import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { GraphCanvas } from './components/GraphCanvas';
import { NodeDetailsPanel } from './components/NodeDetailsPanel';
import { GraphControls } from './components/GraphControls';
import { ReplayControls } from './replay/ReplayControls';
import { EventTimeline } from './replay/EventTimeline';
import { RiskScoreHistory } from './replay/RiskScoreHistory';
import { CurrentEventEvidence } from './replay/CurrentEventEvidence';
import { GraphViewMode, ReplayEvent } from './types';
import { apiService } from '../../services/api';
import { AccountNetworkData } from '../../types';

// Replay event sequence: chronologically ordered by timestamp (deterministic).
const REPLAY_EVENTS: ReplayEvent[] = [
  {
    step: 1,
    timestamp: '14:05:00',
    sourceAccount: 'ACC-7749',
    targetAccount: 'ACC-1102',
    amount: 1500,
    currency: 'USD',
    scoreAtEvent: 18,
    channel: 'ach',
    flaggedHop: false,
    emergingPattern: 'Routine Vendor Payment',
  },
  {
    step: 2,
    timestamp: '14:10:02',
    sourceAccount: 'ACC-7749',
    targetAccount: 'ACC-4410',
    amount: 125000,
    currency: 'USD',
    scoreAtEvent: 64,
    channel: 'wire',
    flaggedHop: true,
    emergingPattern: 'Unusual Large Volume Burst',
  },
  {
    step: 3,
    timestamp: '14:11:15',
    sourceAccount: 'ACC-7749',
    targetAccount: 'ACC-5128',
    amount: 95000,
    currency: 'USD',
    scoreAtEvent: 79,
    channel: 'wire',
    flaggedHop: true,
    emergingPattern: 'Fan-Out Siphon Scheme',
  },
  {
    step: 4,
    timestamp: '14:12:40',
    sourceAccount: 'ACC-4410',
    targetAccount: 'ACC-9901',
    amount: 124200,
    currency: 'USD',
    scoreAtEvent: 91,
    channel: 'crypto',
    flaggedHop: true,
    emergingPattern: 'Rapid Multi-Hop Layering Exit',
  },
  {
    step: 5,
    timestamp: '14:13:02',
    sourceAccount: 'ACC-5128',
    targetAccount: 'ACC-9901',
    amount: 94100,
    currency: 'USD',
    scoreAtEvent: 94,
    channel: 'crypto',
    flaggedHop: true,
    emergingPattern: 'Funnel Convergence to Shell Entity',
  },
];

const SPEED_OPTIONS = [0.5, 1, 1.5, 2] as const;
type Speed = (typeof SPEED_OPTIONS)[number];
const BASE_INTERVAL_MS = 2200;

export const TransactionGraphPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const accountParam = searchParams.get('account') || 'ACC-7749';

  const [networkData, setNetworkData] = useState<AccountNetworkData | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(accountParam);
  const [mode, setMode] = useState<GraphViewMode>('exploration');

  // Replay state
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [speed, setSpeed] = useState<Speed>(1);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    apiService.getAccountNetwork(accountParam).then((data) => {
      setNetworkData(data);
      setSelectedNodeId(accountParam);
    });
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
    }
    setMode(next);
  }, [clearTicker]);

  const handleTogglePlay = useCallback(() => setIsPlaying((p) => !p), []);

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
  }, [clearTicker]);

  const handleSeek = useCallback((step: number) => {
    setIsPlaying(false);
    clearTicker();
    setCurrentStep(Math.max(1, Math.min(step, REPLAY_EVENTS.length)));
  }, [clearTicker]);

  useEffect(() => () => clearTicker(), [clearTicker]);

  const selectedNode = networkData?.nodes.find((n) => n.id === selectedNodeId) || null;
  const currentEvent = REPLAY_EVENTS.find((e) => e.step === currentStep);
  const isReplayMode = mode === 'replay';

  return (
    <div className="space-y-8 max-w-[1400px] mx-auto pb-12">
      {/* Title & Mode Switcher */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-neutral-900">
            Relationship Graph &amp; Replay
          </h1>
          <p className="text-xs text-neutral-500 mt-1">
            Multi-hop financial topology, mule rings, and animated transaction playback
          </p>
        </div>

        <GraphControls
          mode={mode}
          onModeChange={handleModeChange}
          onRefresh={() => setSelectedNodeId(accountParam)}
        />
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Canvas + Controls (Left/Center ~65% = 8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          <div className="h-[520px] rounded-3xl border border-neutral-100 overflow-hidden shadow-sm bg-white">
            {networkData ? (
              <GraphCanvas
                networkData={networkData}
                selectedNodeId={selectedNodeId}
                onSelectNode={setSelectedNodeId}
                highlightedStep={isReplayMode ? currentStep : undefined}
                replayEvents={REPLAY_EVENTS}
                isReplaying={isReplayMode}
              />
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-neutral-400 bg-neutral-50">
                Loading transaction topology…
              </div>
            )}
          </div>

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
        <div className="lg:col-span-4 space-y-6">
          {!isReplayMode ? (
            <>
              <NodeDetailsPanel node={selectedNode} />
              <div className="p-6 bg-[#f0f5ff] rounded-3xl border border-blue-100 text-xs text-neutral-700 space-y-2">
                <span className="font-bold text-neutral-900 block text-sm">Investigator Guidance</span>
                <p className="text-neutral-600 leading-relaxed">
                  • Colored nodes identify entity classifications and mule risk tiers.
                </p>
                <p className="text-neutral-600 leading-relaxed">
                  • Click <strong>Flow Replay Mode</strong> above to step through actual chronological transaction flows.
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
