import React, { useState, useEffect } from 'react';
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

const INITIAL_REPLAY_EVENTS: ReplayEvent[] = [
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

export const TransactionGraphPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const accountParam = searchParams.get('account') || 'ACC-7749';

  const [networkData, setNetworkData] = useState<AccountNetworkData | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(accountParam);
  const [mode, setMode] = useState<GraphViewMode>('exploration');

  // Replay State
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);

  useEffect(() => {
    apiService.getAccountNetwork(accountParam).then((data) => {
      setNetworkData(data);
      setSelectedNodeId(accountParam);
    });
  }, [accountParam]);

  // Step play ticker
  useEffect(() => {
    let interval: any;
    if (isPlaying && mode === 'replay') {
      interval = setInterval(() => {
        setCurrentStep((prev) => {
          if (prev >= INITIAL_REPLAY_EVENTS.length) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, 1800);
    }
    return () => clearInterval(interval);
  }, [isPlaying, mode]);

  const selectedNode = networkData?.nodes.find((n) => n.id === selectedNodeId) || null;
  const currentEvent = INITIAL_REPLAY_EVENTS.find((e) => e.step === currentStep);

  return (
    <div className="space-y-6">
      {/* Title & Mode Switcher */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">
            Transaction Relationship Graph &amp; Replay Engine
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Multi-hop financial topology, mule rings, and chronological event playback
          </p>
        </div>

        <GraphControls
          mode={mode}
          onModeChange={setMode}
          onRefresh={() => setSelectedNodeId(accountParam)}
        />
      </div>

      {/* Main Graph Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: React Flow Canvas */}
        <div className="lg:col-span-2 space-y-4">
          <div className="h-[480px]">
            {networkData ? (
              <GraphCanvas
                networkData={networkData}
                selectedNodeId={selectedNodeId}
                onSelectNode={setSelectedNodeId}
                highlightedStep={mode === 'replay' ? currentStep : undefined}
              />
            ) : (
              <div className="h-full bg-surface border border-surface-border rounded-xl flex items-center justify-center text-xs text-slate-500">
                Loading transaction topology...
              </div>
            )}
          </div>

          {/* If in Replay Mode, show Replay Controls directly under the canvas */}
          {mode === 'replay' && (
            <ReplayControls
              currentStep={currentStep}
              totalSteps={INITIAL_REPLAY_EVENTS.length}
              isPlaying={isPlaying}
              onTogglePlay={() => setIsPlaying(!isPlaying)}
              onStepForward={() => setCurrentStep((s) => Math.min(s + 1, INITIAL_REPLAY_EVENTS.length))}
              onReset={() => {
                setIsPlaying(false);
                setCurrentStep(1);
              }}
              onStepChange={(step) => setCurrentStep(step)}
            />
          )}
        </div>

        {/* Right 1 Col: Context Panels based on mode */}
        <div className="space-y-4">
          {mode === 'exploration' ? (
            <>
              <NodeDetailsPanel node={selectedNode} />
              <div className="p-4 bg-surface rounded-xl border border-surface-border text-xs text-slate-400 space-y-2">
                <span className="font-semibold text-slate-200 block">Investigator Tips</span>
                <p>
                  • Red pulsed edges indicate transactions that trigger high-velocity threshold rules.
                </p>
                <p>
                  • Switch to <strong className="text-purple-300">Replay Mode</strong> above to walk through the event chronology step-by-step.
                </p>
              </div>
            </>
          ) : (
            <>
              <RiskScoreHistory
                events={INITIAL_REPLAY_EVENTS}
                currentStep={currentStep}
              />
              <CurrentEventEvidence currentEvent={currentEvent} />
              <EventTimeline
                events={INITIAL_REPLAY_EVENTS}
                activeStep={currentStep}
                onSelectStep={(s) => setCurrentStep(s)}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
};
