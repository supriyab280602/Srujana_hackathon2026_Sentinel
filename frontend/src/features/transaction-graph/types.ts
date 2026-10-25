export type GraphViewMode = 'exploration' | 'replay';
export type { GraphNode, GraphEdge } from '../../types';

export interface ReplayEvent {
  step: number;
  timestamp: string;
  sourceAccount: string;
  targetAccount: string;
  amount: number;
  currency: string;
  scoreAtEvent: number;
  channel: string;
  flaggedHop: boolean;
  emergingPattern?: string;
}

export interface ReplayState {
  currentStep: number;
  totalSteps: number;
  isPlaying: boolean;
  speed: number; // e.g. 1x, 2x
}
