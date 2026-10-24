import React from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldAlert,
  Network,
  Activity,
  Layers,
  ArrowRight,
  Fingerprint,
  CheckCircle2,
} from 'lucide-react';

export const LandingPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col justify-between">
      {/* Navigation */}
      <nav className="border-b border-surface-border px-8 py-5 flex items-center justify-between max-w-7xl mx-auto w-full">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-brand-600 to-blue-400 flex items-center justify-center text-white shadow-lg shadow-brand-500/20">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <span className="font-bold text-lg tracking-wider text-white">SENTINEL</span>
        </div>
        <div className="flex items-center gap-4">
          <Link
            to="/login"
            className="text-xs font-semibold text-slate-300 hover:text-white px-3 py-1.5 transition-colors"
          >
            Investigator Sign In
          </Link>
          <Link
            to="/app"
            className="text-xs font-semibold bg-brand-600 hover:bg-brand-500 text-white px-4 py-2 rounded-lg shadow-sm transition-colors flex items-center gap-1.5"
          >
            Launch Console
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="max-w-6xl mx-auto px-6 py-16 flex-1 flex flex-col justify-center text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand-500/10 border border-brand-500/30 text-brand-400 text-xs font-mono mx-auto mb-6">
          <span className="w-2 h-2 rounded-full bg-brand-400 animate-pulse" />
          48-Hour Hackathon Foundation • Phase 1
        </div>

        <h1 className="text-4xl md:text-6xl font-extrabold text-white tracking-tight leading-tight max-w-4xl mx-auto">
          AI/ML-Powered Financial Fraud Detection &amp; Investigation
        </h1>

        <p className="text-base md:text-lg text-slate-400 max-w-2xl mx-auto mt-6">
          Next-generation AML surveillance combining behavioral fingerprinting, explainable risk scoring, multi-hop relationship graph intelligence, and integrated chronological replay.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-4 mt-8">
          <Link
            to="/app"
            className="bg-brand-600 hover:bg-brand-500 text-white font-medium text-sm px-6 py-3 rounded-lg shadow-lg shadow-brand-600/30 flex items-center gap-2 transition-all hover:scale-[1.02]"
          >
            Open Investigation Console
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            to="/login"
            className="bg-surface-elevated hover:bg-slate-700 text-slate-200 border border-surface-border font-medium text-sm px-6 py-3 rounded-lg transition-colors"
          >
            Investigator Auth Scaffold
          </Link>
        </div>

        {/* Feature Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-16 text-left">
          <div className="bg-surface border border-surface-border/80 rounded-xl p-5 hover:border-brand-500/40 transition-colors">
            <div className="w-10 h-10 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center mb-4">
              <Fingerprint className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-semibold text-white">1. Behavioral Fingerprinting</h3>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              Synthesizes account transaction habits, baseline rhythms, typical counterparties, and flags anomalous deviations.
            </p>
          </div>

          <div className="bg-surface border border-surface-border/80 rounded-xl p-5 hover:border-brand-500/40 transition-colors">
            <div className="w-10 h-10 rounded-lg bg-rose-500/10 text-rose-400 flex items-center justify-center mb-4">
              <Activity className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-semibold text-white">2. Explainable Risk Scoring</h3>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              Transparent factor breakdowns and evidence-backed contributions rather than opaque black-box verdicts.
            </p>
          </div>

          <div className="bg-surface border border-surface-border/80 rounded-xl p-5 hover:border-brand-500/40 transition-colors">
            <div className="w-10 h-10 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center mb-4">
              <Network className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-semibold text-white">3. Relationship Graph &amp; Replay</h3>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              Multi-hop mule network tracing with in-page chronological transaction replay to uncover suspicious patterns over time.
            </p>
          </div>

          <div className="bg-surface border border-surface-border/80 rounded-xl p-5 hover:border-brand-500/40 transition-colors">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-4">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-semibold text-white">4. Human-in-the-Loop Review</h3>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              Seamless triage interface for AML investigators to confirm fraud, flag false positives, and append structured notes.
            </p>
          </div>

          <div className="bg-surface border border-surface-border/80 rounded-xl p-5 hover:border-brand-500/40 transition-colors">
            <div className="w-10 h-10 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center mb-4">
              <Layers className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-semibold text-white">5. Adaptive Risk Monitoring</h3>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              Continuous sensitivity calibration to balance false-positive suppression with early mule ring detection.
            </p>
          </div>

          <div className="bg-surface border border-surface-border/80 rounded-xl p-5 hover:border-brand-500/40 transition-colors">
            <div className="w-10 h-10 rounded-lg bg-cyan-500/10 text-cyan-400 flex items-center justify-center mb-4">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-semibold text-white">6. Cross-Account Pattern Detection</h3>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              Detects synchronized fan-out bursts, circular layering loops, and coordinated multi-account siphon schemes.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-surface-border/60 py-6 text-center text-xs text-slate-500">
        Sentinel AI Platform • Phase 1 Foundation Scaffold • 48-Hour Hackathon
      </footer>
    </div>
  );
};
