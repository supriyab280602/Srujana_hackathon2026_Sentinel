/**
 * SENTINEL LANDING PAGE — REPLAY (LAPA.NINJA/POST/REPLAY-3) FAITHFUL RECREATION
 * Master reference: https://www.replay.ai/ & https://www.lapa.ninja/post/replay-3/
 * Featuring:
 * - Editorial Serif typography (Newsreader font) + Monospace technical metadata
 * - Paper cream texture (#fcfcfc) with dashed border grid lines
 * - 3D Perspective Wireframe Data Plane in Hero
 * - Multi-colored process color strip (#499df8, #54702f, #7e7e7e, #eae058)
 * - Big Serif stat counters ("Millions" / "Billions")
 * - 3D Beveled Isometric Frame ("Historical operating data") with interactive offset tiles
 * - Deep woven blue equalizer section with animated volume/account tiers
 * - Pitch-black 4-step accordion with progress loaders & 3D floating isometric card stack
 * - PII De-identification & Temporal Isolation ledger simulation with sliding tabs
 * - "Where your data gets protected" cards with triangular corner notches
 * - Cross-shaped technical blueprint diagram with coordinate drafting callouts
 * - Layered document CTA card with code snippet & process breadcrumbs
 * - Black footer with monumental giant watermarked "SENTINEL" serif wordmark
 */

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldCheck,
  ArrowRight,
  Fingerprint,
  Activity,
  Network,
  RotateCcw,
  Clock,
  Menu,
  X,
  Cpu,
  FileText,
  CheckCircle2
} from 'lucide-react';

export const LandingPage: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Equalizer tier state in Deep Woven Blue section
  const [selectedTier, setSelectedTier] = useState<0 | 1 | 2>(1);

  // 4-step accordion state in Pitch Black section
  const [activeStep, setActiveStep] = useState<number>(0);
  const [isAccordionPlaying, setIsAccordionPlaying] = useState<boolean>(true);

  // De-identification tabs
  const [deIdTab, setDeIdTab] = useState<'pii' | 'pipeline' | 'policy'>('pii');

  // Auto-advance the 4-step accordion in the black section
  useEffect(() => {
    let timer: any;
    if (isAccordionPlaying) {
      timer = setInterval(() => {
        setActiveStep((prev) => (prev >= 3 ? 0 : prev + 1));
      }, 4000);
    }
    return () => clearInterval(timer);
  }, [isAccordionPlaying]);

  // 3D Beveled Tiles Data
  const telemetryTiles = [
    { title: 'Wire transfers & ACH', icon: ArrowRight, tag: 'PAYMENTS' },
    { title: 'Account Baselines', icon: Fingerprint, tag: 'BEHAVIOR' },
    { title: 'Mule Ring Clusters', icon: Network, tag: 'TOPOLOGY' },
    { title: 'Circadian Hours', icon: Clock, tag: 'TEMPORAL' },
    { title: 'Case Dossiers', icon: FileText, tag: 'TRIAGE' },
    { title: 'Device Telemetry', icon: Cpu, tag: 'BIOMETRIC' },
    { title: 'Directed Loops', icon: RotateCcw, tag: 'NETWORKX' },
    { title: 'Velocity Bursts', icon: Activity, tag: 'VELOCITY' }
  ];

  // 4 Steps Data for Black Section
  const steps = [
    {
      label: 'BASELINE',
      title: 'Synthesize Account Normatives',
      desc: 'Sentinel ingests spending velocity, circadian hour probability heatmaps, and typical counterparties to establish normative behavioral baselines without user friction.',
      badge: 'Zero-Lookahead Profile',
      metric: 'Normative Baselines'
    },
    {
      label: 'TOPOLOGY',
      title: 'Map Multi-Hop Entity Loops',
      desc: 'Topological entity resolution identifies circular laundering cycles, high-velocity fan-out bursts, and mule siphon funnels across multi-hop entity pathways in real-time.',
      badge: 'NetworkX Resolution',
      metric: '4-Hop Cluster Detection'
    },
    {
      label: 'REPLAY',
      title: 'Zero-Lookahead Temporal Replay',
      desc: 'Compliance investigators scrub through chronological transactions with strict temporal gating. Observe the exact timestamp an account breached criminal thresholds.',
      badge: 'Temporal Verification',
      metric: 'Strict Causal Replay'
    },
    {
      label: 'RESOLVE',
      title: '1-Click Triage & SAR Filing',
      desc: 'Pre-formatted regulatory SAR narrative compilation, transparent SHAP factor attributions, and instant compliance dossiers that reduce analyst fatigue by 82%.',
      badge: 'FinCEN Ready',
      metric: '120s Review Cycle'
    }
  ];

  return (
    <div className="min-h-screen bg-[#fcfcfc] text-[#141518] flex flex-col font-sans selection:bg-[#499df8]/20 selection:text-[#133264]">
      {/* =========================================================================
          1. FIXED HEADER (Matching Replay.ai: dashed border, delicate blur, black CTA)
         ========================================================================= */}
      <header className="fixed top-0 left-0 z-50 w-full bg-[#fcfcfc]/95 backdrop-blur-md border-b border-dashed border-[#dedede] transition-all">
        <div className="relative mx-auto flex h-16 w-full max-w-[1560px] items-center justify-between px-6 sm:px-12 lg:px-18">
          {/* Logo in classical Serif */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-lg bg-[#141518] flex items-center justify-center text-white shadow-xs group-hover:scale-105 transition-transform">
              <ShieldCheck className="w-4 h-4 text-[#25fff9]" />
            </div>
            <span className="font-serif text-2xl font-bold tracking-tight text-[#141518]">
              Sentinel
            </span>
            <span className="font-mono text-[9px] uppercase tracking-wider text-[#898989] border border-dashed border-[#d4d4d4] px-1.5 py-0.5 rounded ml-1">
              v1.0
            </span>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-7 text-xs font-mono tracking-wide text-[#777] uppercase">
            <Link to="/behavioral" className="hover:text-[#141518] transition-colors">Behavioral</Link>
            <Link to="/alerts" className="hover:text-[#141518] transition-colors">Risk Scoring</Link>
            <Link to="/network" className="hover:text-[#141518] transition-colors">Graph Replay</Link>
            <Link to="/investigations" className="hover:text-[#141518] transition-colors">Case Studio</Link>
            <Link to="/transactions" className="hover:text-[#141518] transition-colors">Explorer</Link>
          </nav>

          {/* Right Action Button (Replay Signature Black Button with hover weave) */}
          <div className="flex items-center gap-3">
            <Link
              to="/login"
              className="hidden sm:inline-block font-mono text-xs text-[#777] hover:text-[#141518] uppercase tracking-wider mr-2"
            >
              Log in
            </Link>
            <Link
              to="/dashboard"
              className="group relative hidden sm:flex items-center overflow-hidden bg-[#141518] px-5 py-2.5 text-xs text-white uppercase font-mono tracking-wider transition-transform hover:scale-[1.02]"
            >
              {/* Color accents on hover */}
              <div className="pointer-events-none absolute inset-y-0 left-0 w-1 bg-[#499df8] -translate-x-full group-hover:translate-x-0 transition-transform" />
              <div className="pointer-events-none absolute inset-y-0 right-0 w-1 bg-[#54702f] translate-x-full group-hover:translate-x-0 transition-transform" />
              <span className="relative">Launch Studio</span>
            </Link>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-[#444] hover:text-black"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Nav */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-[#fcfcfc] border-b border-dashed border-[#dedede] px-6 py-4 space-y-3 font-mono text-xs uppercase">
            <Link to="/behavioral" onClick={() => setMobileMenuOpen(false)} className="block py-1 text-[#444]">Behavioral Baselines</Link>
            <Link to="/alerts" onClick={() => setMobileMenuOpen(false)} className="block py-1 text-[#444]">Explainable Scoring</Link>
            <Link to="/network" onClick={() => setMobileMenuOpen(false)} className="block py-1 text-[#444]">Relationship Graph</Link>
            <Link to="/investigations" onClick={() => setMobileMenuOpen(false)} className="block py-1 text-[#444]">Case Studio</Link>
            <div className="pt-2 flex flex-col gap-2">
              <Link to="/dashboard" onClick={() => setMobileMenuOpen(false)} className="bg-[#141518] text-white py-2 text-center">Launch Sentinel Studio</Link>
              <Link to="/login" onClick={() => setMobileMenuOpen(false)} className="border border-[#dedede] text-center py-2">Log In</Link>
            </div>
          </div>
        )}
      </header>

      {/* =========================================================================
          2. HERO SECTION (Replay.ai Master: Serif Headline, 3D Tilted Wireframe Plane, Multi-Colored Bar)
         ========================================================================= */}
      <section className="relative overflow-hidden border-b border-dashed border-black/8 bg-[#fcfcfc] pt-28 sm:pt-36 pb-12">
        {/* Vertical Dashed Guide Lines */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 hidden lg:block max-w-[1560px] mx-auto">
          <div className="absolute inset-y-0 left-[72px] border-l border-dashed border-black/8" />
          <div className="absolute inset-y-0 right-[72px] border-r border-dashed border-black/8" />
          <div className="absolute inset-y-0 left-[272px] border-l border-dashed border-black/8" />
          <div className="absolute inset-y-0 right-[272px] border-r border-dashed border-black/8" />
        </div>

        {/* Hero Headline & Subtitle */}
        <div className="relative z-10 max-w-[898px] mx-auto px-6 text-center flex flex-col items-center gap-6">
          <h1 className="font-serif text-[42px] leading-[1.04] tracking-[-1.75px] text-[#141518] sm:text-[56px] lg:text-[72px] lg:tracking-[-2.88px]">
            Protect financial growth with the data intelligence you already have.
          </h1>

          <p className="max-w-[669px] text-[15px] sm:text-base leading-[1.45] tracking-[-0.4px] text-[#727272]">
            Frontier AI surveillance needs ground-truth intelligence on how money actually flows. You're sitting on years of transaction records. Sentinel values your telemetry, strips false alarms with strict zero-lookahead, and keeps you secure.
          </p>

          {/* Central Black Button with Hover Accents */}
          <Link
            to="/dashboard"
            className="group relative flex w-full sm:w-[280px] items-center justify-center overflow-hidden bg-[#141518] px-7 py-4 text-sm font-mono uppercase tracking-wider text-white shadow-lg transition-transform hover:scale-[1.02] active:scale-[0.98]"
          >
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-[#133264] to-[#147dba] opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="pointer-events-none absolute inset-y-0 left-0 w-1.5 bg-[#499df8] -translate-x-full group-hover:translate-x-0 transition-transform duration-200" />
            <div className="pointer-events-none absolute inset-y-0 right-0 w-1.5 bg-[#54702f] translate-x-full group-hover:translate-x-0 transition-transform duration-200" />
            <span className="relative z-10 flex items-center gap-2">
              <span>Launch Studio</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </span>
          </Link>
        </div>

        {/* 3D PERSPECTIVE WIREFRAME DATA PLANE (Signature Replay 3D Illustration) */}
        <div className="relative mt-12 sm:mt-16 w-full max-w-[1280px] mx-auto px-6 overflow-hidden">
          <div
            className="relative w-full mx-auto rounded-2xl border border-dashed border-[#a8a8a8] bg-[#f7f8fa] p-4 sm:p-8 shadow-2xl transition-all"
            style={{
              perspective: '1200px',
              transformStyle: 'preserve-3d'
            }}
          >
            {/* Perspective angled container */}
            <div
              className="relative w-full rounded-xl border border-dashed border-[#c0c4ce] bg-white p-6 transition-transform duration-700"
              style={{
                transform: 'rotateX(28deg) translateY(-10px)',
                boxShadow: '0 25px 50px -12px rgba(19, 50, 100, 0.15)'
              }}
            >
              {/* Top metadata strip in plane */}
              <div className="flex items-center justify-between border-b border-dashed border-[#d4d4d4] pb-3 text-[10px] font-mono text-[#898989] uppercase">
                <span className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#499df8] animate-pulse" />
                  REAL-TIME ZERO-LOOKAHEAD TELEMETRY STREAM
                </span>
                <span>LATENCY: 38MS • REPLAY READY</span>
              </div>

              {/* Transaction rows in 3D perspective */}
              <div className="mt-4 space-y-2 text-xs font-mono">
                <div className="p-3 rounded-lg border border-dashed border-[#499df8]/50 bg-[#eef5fe] flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="px-2 py-0.5 rounded bg-[#499df8] text-white font-bold text-[10px]">CRITICAL 94</span>
                    <span className="font-bold text-[#141518]">TXN-99410</span>
                    <span className="text-[#666] hidden sm:inline">Wire ₹12,50,000 → Unseasoned Mule (ACC-4410)</span>
                  </div>
                  <span className="text-[#499df8] font-bold text-[11px]">FLAGGED LOOP</span>
                </div>

                <div className="p-3 rounded-lg border border-dashed border-[#d4d4d4] bg-[#fafafa] flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="px-2 py-0.5 rounded bg-[#54702f] text-white font-bold text-[10px]">RISK 79</span>
                    <span className="font-bold text-[#141518]">TXN-99388</span>
                    <span className="text-[#666] hidden sm:inline">RTGS ₹9,50,000 → Secondary Siphon (ACC-5128)</span>
                  </div>
                  <span className="text-[#54702f] font-bold text-[11px]">THRESHOLD BREACH</span>
                </div>

                <div className="p-3 rounded-lg border border-dashed border-[#e5e5e5] bg-white flex items-center justify-between opacity-70">
                  <div className="flex items-center gap-3">
                    <span className="px-2 py-0.5 rounded bg-[#7e7e7e] text-white font-bold text-[10px]">NORM 18</span>
                    <span className="font-bold text-[#888]">TXN-99044</span>
                    <span className="text-[#999] hidden sm:inline">UPI / NEFT ₹15,000 (Salary Clearing)</span>
                  </div>
                  <span className="text-[#888] font-bold text-[11px]">CLEARED</span>
                </div>
              </div>
            </div>

            {/* Depth fade blur overlay */}
            <div
              className="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-[#fcfcfc] via-[#fcfcfc]/80 to-transparent"
              aria-hidden="true"
            />
          </div>
        </div>

        {/* PROCESS METADATA BAR (Signature Replay bar) */}
        <div className="relative mt-8 max-w-[1560px] mx-auto px-6 sm:px-12 lg:px-18">
          <div className="grid grid-cols-1 sm:grid-cols-3 items-center border-t border-dashed border-[#d4d4d4] pt-4 pb-4 gap-4 text-[9px] font-mono uppercase tracking-wider text-[#898989]">
            <div className="flex items-center gap-2">
              <span className="text-black font-semibold">process:</span>
              <span>identified</span>
              <span>→</span>
              <span>structured</span>
              <span>→</span>
              <span>verified</span>
              <span>→</span>
              <span className="text-[#499df8] font-bold">protected</span>
            </div>
            <div className="sm:text-center">
              <span className="border border-dashed border-[#d4d4d4] px-2.5 py-1 text-black font-bold">
                SN-2026-001 // Version 1.0
              </span>
            </div>
            <div className="sm:text-right">
              <span>classification: financial risk intelligence / zero-lookahead</span>
            </div>
          </div>

          {/* SIGNATURE MULTI-COLORED SEGMENTED BAR */}
          <div className="flex w-full h-3 sm:h-4 overflow-hidden border border-black/10">
            <div className="h-full bg-[#499df8] relative" style={{ width: '27%' }} />
            <div className="h-full bg-[#54702f] relative" style={{ width: '21%' }} />
            <div className="h-full bg-[#7e7e7e] relative" style={{ width: '30%' }} />
            <div className="h-full bg-[#eae058] relative" style={{ width: '4%' }} />
            <div className="h-full bg-[#499df8] relative" style={{ width: '6%' }} />
            <div className="h-full bg-[#54702f] relative" style={{ width: '23%' }} />
          </div>
        </div>
      </section>

      {/* =========================================================================
          3. BIG STAT COUNTERS SECTION ("Millions" / "Billions")
         ========================================================================= */}
      <section className="relative overflow-hidden border-b border-dashed border-[#d4d4d4] px-6 sm:px-12 lg:px-18 py-10 bg-[#fcfcfc]">
        <div className="relative mx-auto w-full max-w-[1560px] border-x border-dashed border-[#d4d4d4]">
          <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-dashed divide-[#d4d4d4]">
            {/* Stat 1 */}
            <div className="flex flex-col items-start justify-center gap-2 p-8 sm:p-12">
              <p className="font-serif text-[48px] sm:text-[68px] leading-none tracking-[-2px] text-[#2a2a2a]">
                Millions
              </p>
              <p className="font-mono text-xs sm:text-sm tracking-tight text-[#898989] uppercase">
                Tracked across coordinated mule networks
              </p>
            </div>

            {/* Stat 2 */}
            <div className="flex flex-col items-start justify-center gap-2 p-8 sm:p-12">
              <p className="font-serif text-[48px] sm:text-[68px] leading-none tracking-[-2px] text-[#2a2a2a]">
                Billions
              </p>
              <p className="font-mono text-xs sm:text-sm tracking-tight text-[#898989] uppercase">
                Transaction events verified with zero-lookahead
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          4. "YOU ALREADY OWN YOUR STRONGEST DEFENSE" + 3D BEVELED ISOMETRIC FRAME
         ========================================================================= */}
      <section className="relative flex flex-col items-center overflow-hidden bg-[#eaebf1] px-6 sm:px-12 lg:px-18 pt-16 pb-20 border-b border-dashed border-[#d4d4d4]">
        <div className="relative mx-auto w-full max-w-[1560px] border-x border-dashed border-[#d4d4d4] px-4 sm:px-8 py-8">
          {/* Section Header */}
          <div className="mb-14 flex flex-col lg:flex-row items-start justify-between gap-8">
            <h2 className="flex-1 font-serif text-[36px] sm:text-[44px] leading-none tracking-tight text-[#181a1b]">
              You already own your<br />strongest defense line.
            </h2>
            <div className="w-full lg:w-[540px] text-sm sm:text-base leading-relaxed text-[#727272] space-y-4 font-normal">
              <p>
                Rule engines cost endless manual hours. Black-box ML models trigger regulatory fines. Getting true visibility takes quarters you don't have.
              </p>
              <p>
                But there's one thing you already hold. It costs you none of that, and it's the exact record of how transactions flow through your accounts. Historically, traditional fraud tools couldn't replay it without future leakage. Now Sentinel can.
              </p>
            </div>
          </div>

          {/* 3D BEVELED ISOMETRIC FRAME (Replay signature angled card enclosure) */}
          <div className="relative w-full rounded-2xl border border-dashed border-[#a8a8a8] bg-[#f4f5f8] p-4 sm:p-8">
            {/* Top Tag */}
            <div className="mb-6 flex items-center justify-between border-b border-dashed border-[#a8a8a8] pb-3 font-mono text-[9px] uppercase tracking-wider text-black/60">
              <span>Historical Operating Telemetry</span>
              <span>8 Modular Sensor Vectors</span>
            </div>

            {/* Grid of 8 Beveled Interactive Tiles */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {telemetryTiles.map((tile, i) => {
                const IconComponent = tile.icon;
                return (
                  <div
                    key={i}
                    className="group relative cursor-pointer rounded-xl border border-dashed border-[#a8a8a8] bg-white p-5 transition-all duration-300 hover:-translate-x-1.5 hover:-translate-y-1.5 hover:shadow-[8px_8px_0px_0px_rgba(20,21,24,0.15)]"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <span className="font-mono text-[9px] uppercase tracking-wider text-[#898989] bg-[#f0f2f5] px-2 py-0.5 rounded border border-[#e0e2e8]">
                        {tile.tag}
                      </span>
                      <IconComponent className="w-4 h-4 text-[#499df8] group-hover:scale-110 transition-transform" />
                    </div>
                    <p className="font-mono text-xs sm:text-sm font-semibold uppercase text-black">
                      {tile.title}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          5. DEEP WOVEN BLUE SECTION (Replay "What companies your size get paid" -> Equalizer)
         ========================================================================= */}
      <section className="relative flex flex-col overflow-hidden blue-woven-texture px-6 sm:px-12 lg:px-18 py-20 text-white border-b border-dashed border-[#204070]">
        <div className="relative mx-auto flex w-full max-w-[1560px] flex-col gap-12 bg-black/20 rounded-3xl p-6 sm:p-12 border border-white/10 backdrop-blur-sm">
          {/* Top Title & Equalizer Grid */}
          <div className="flex flex-col lg:flex-row items-start justify-between gap-10">
            <div className="flex flex-col gap-5 lg:w-[32%] shrink-0">
              <div className="inline-flex items-center border border-dashed border-white/40 px-2.5 py-1 w-fit">
                <p className="font-mono text-[9px] uppercase tracking-wider text-[#a9b8c8]">
                  Volume Sizing
                </p>
              </div>
              <h2 className="font-serif text-[36px] sm:text-[44px] leading-tight text-[#f1f1f1]">
                What risk teams<br />your size achieve.
              </h2>
              <p className="text-sm text-white/70 leading-relaxed font-normal">
                Select your transaction tier to see how Sentinel's zero-lookahead scoring stops fraud losses and accelerates AML clearance.
              </p>
            </div>

            {/* 3 EQUALIZER TIER COLUMNS */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 flex-1 w-full">
              {/* Tier 1 */}
              <div
                onClick={() => setSelectedTier(0)}
                className={`cursor-pointer rounded-2xl border border-dashed p-6 flex flex-col justify-between transition-all ${
                  selectedTier === 0
                    ? 'border-[#499df8] bg-white/10 shadow-lg'
                    : 'border-white/20 bg-black/10 hover:border-white/40'
                }`}
              >
                <div>
                  <p className="font-serif text-2xl sm:text-3xl font-bold text-[#fafafa]">
                    ₹1 Lakh - ₹10 Lakh
                  </p>
                  <p className="font-mono text-[10px] text-white/60 uppercase mt-1">
                    20 - 50 Accounts
                  </p>
                </div>
                {/* Visual Equalizer Bars */}
                <div className="mt-8 space-y-1.5">
                  <div className="h-4 w-full bg-[#3a5979] rounded-xs" />
                  <div className="h-4 w-3/4 bg-[#3a5979] rounded-xs" />
                </div>
              </div>

              {/* Tier 2 */}
              <div
                onClick={() => setSelectedTier(1)}
                className={`cursor-pointer rounded-2xl border border-dashed p-6 flex flex-col justify-between transition-all ${
                  selectedTier === 1
                    ? 'border-[#1a99aa] bg-white/15 shadow-xl scale-[1.02]'
                    : 'border-white/20 bg-black/10 hover:border-white/40'
                }`}
              >
                <div>
                  <p className="font-serif text-2xl sm:text-3xl font-bold text-[#fafafa]">
                    ₹10 Lakh - ₹1 Crore
                  </p>
                  <p className="font-mono text-[10px] text-teal-300 uppercase mt-1 font-bold">
                    50 - 250 Accounts (Most Common)
                  </p>
                </div>
                {/* Visual Equalizer Bars */}
                <div className="mt-8 space-y-1.5">
                  <div className="h-4 w-full bg-[#1a99aa] rounded-xs" />
                  <div className="h-4 w-5/6 bg-[#1a99aa] rounded-xs" />
                  <div className="h-4 w-full bg-[#1a99aa] rounded-xs" />
                  <div className="h-4 w-2/3 bg-[#1a99aa] rounded-xs" />
                </div>
              </div>

              {/* Tier 3 */}
              <div
                onClick={() => setSelectedTier(2)}
                className={`cursor-pointer rounded-2xl border border-dashed p-6 flex flex-col justify-between transition-all ${
                  selectedTier === 2
                    ? 'border-[#118ecc] bg-white/10 shadow-lg'
                    : 'border-white/20 bg-black/10 hover:border-white/40'
                }`}
              >
                <div>
                  <p className="font-serif text-2xl sm:text-3xl font-bold text-[#fafafa]">
                    ₹1 Crore+ (High-Value)
                  </p>
                  <p className="font-mono text-[10px] text-white/60 uppercase mt-1">
                    250+ High-Velocity Accounts
                  </p>
                </div>
                {/* Visual Equalizer Bars */}
                <div className="mt-8 space-y-1.5">
                  <div className="h-4 w-full bg-[#118ecc] rounded-xs" />
                  <div className="h-4 w-full bg-[#118ecc] rounded-xs" />
                  <div className="h-4 w-4/5 bg-[#118ecc] rounded-xs" />
                  <div className="h-4 w-full bg-[#118ecc] rounded-xs" />
                  <div className="h-4 w-3/5 bg-[#118ecc] rounded-xs" />
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Two Detail Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-8 border-t border-dashed border-white/20">
            <div className="space-y-3">
              <p className="font-serif text-xl text-white">How risk is scored</p>
              <p className="text-sm text-white/80 leading-relaxed font-normal">
                Volume is only a proxy. Velocity variance, counterparty history, time-of-day circadian drift, and multi-hop graph distance all factor into the final auditable score.
              </p>
            </div>
            <div className="space-y-3">
              <p className="font-serif text-xl text-white">How it's structured</p>
              <p className="text-sm text-white/80 leading-relaxed font-normal">
                Scores are calculated inline in under 42ms with full SHAP transparency. And because accounts continuously transact, behavioral baselines continuously calibrate without future leakage.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          6. PITCH BLACK SECTION ("Four steps. 120 seconds to conviction." + 3D Card Stack)
         ========================================================================= */}
      <section className="relative flex justify-center bg-[#0c0c0b] px-6 sm:px-12 lg:px-18 py-20 text-white">
        <div className="mx-auto grid w-full max-w-[1560px] grid-cols-1 lg:grid-cols-2 border border-[#333] rounded-3xl overflow-hidden">
          {/* Left Column: 4 Accordion Steps */}
          <div className="flex flex-col justify-between p-8 sm:p-12 lg:border-r border-[#333]">
            <div className="mb-10">
              <div className="inline-flex border border-dashed border-white/25 px-2.5 py-1 mb-4">
                <p className="font-mono text-[9px] uppercase tracking-wider text-white/60">
                  How it works
                </p>
              </div>
              <h2 className="font-serif text-[36px] sm:text-[44px] leading-tight text-white">
                Four steps.<br />120 seconds to conviction.
              </h2>
            </div>

            {/* Steps Accordion */}
            <div className="space-y-6">
              {steps.map((st, sIdx) => {
                const isActive = activeStep === sIdx;
                return (
                  <div
                    key={sIdx}
                    onClick={() => {
                      setActiveStep(sIdx);
                      setIsAccordionPlaying(false);
                    }}
                    className={`cursor-pointer border-b border-[#383535] pb-5 transition-all ${
                      isActive ? 'opacity-100' : 'opacity-40 hover:opacity-75'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span
                          className={`w-2 h-2 rounded-full transition-colors ${
                            isActive ? 'bg-[#25fff9]' : 'bg-[#cecece]/40'
                          }`}
                        />
                        <span className="font-mono text-xs uppercase tracking-wider text-white font-bold">
                          {st.label}
                        </span>
                      </div>
                      <span className="font-mono text-[10px] text-[#25fff9]">
                        {st.badge}
                      </span>
                    </div>

                    <p className="font-serif text-xl sm:text-2xl text-white">
                      {st.title}
                    </p>

                    {isActive && (
                      <div className="mt-3 text-xs sm:text-sm text-[#898989] leading-relaxed">
                        <p>{st.desc}</p>
                        {/* Animated progress sweep bar */}
                        <div className="relative mt-3 h-0.5 w-full bg-[#262626] overflow-hidden">
                          <div className="h-full bg-[#25fff9] animate-progress-sweep" />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column: 3D Isometric Card Stack Preview */}
          <div className="relative bg-[#141518] p-8 sm:p-12 flex items-center justify-center min-h-[420px]">
            <div className="relative w-full max-w-[440px] aspect-[4/3] rounded-2xl border border-dashed border-[#444] bg-[#0c0c0b] p-6 shadow-2xl flex flex-col justify-between">
              {/* Header inside card */}
              <div className="flex items-center justify-between border-b border-dashed border-[#333] pb-3 text-[10px] font-mono text-[#898989] uppercase">
                <span className="flex items-center gap-1.5 text-white font-bold">
                  <Activity className="w-3.5 h-3.5 text-[#25fff9]" />
                  SURVEILLANCE STEP 0{activeStep + 1}
                </span>
                <span className="text-[#25fff9] font-bold">ACTIVE TELEMETRY</span>
              </div>

              {/* Dynamic step visual */}
              <div className="py-6 space-y-3 font-mono text-xs">
                {activeStep === 0 && (
                  <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-2">
                    <span className="text-white font-bold block">Circadian Profile: ACC-7749</span>
                    <p className="text-[11px] text-slate-400">Normative hours: 08:00 - 18:00 UTC</p>
                    <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
                      <div className="h-full bg-[#25fff9]" style={{ width: '85%' }} />
                    </div>
                  </div>
                )}

                {activeStep === 1 && (
                  <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-2">
                    <span className="text-white font-bold block">NetworkX Topology Loop Found</span>
                    <p className="text-[11px] text-slate-400">ACC-7749 → ACC-4410 → ACC-5128 → GATEWAY</p>
                    <span className="inline-block px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 text-[10px] border border-rose-500/40">
                      3-Hop Circular Siphon
                    </span>
                  </div>
                )}

                {activeStep === 2 && (
                  <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-2">
                    <span className="text-white font-bold block">Zero-Lookahead Timeline T+3</span>
                    <p className="text-[11px] text-slate-400">First threshold breach at 14:22:08 UTC</p>
                    <span className="text-[#25fff9] font-bold text-sm block">Risk Score: 94/100</span>
                  </div>
                )}

                {activeStep === 3 && (
                  <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-2">
                    <span className="text-white font-bold block">FinCEN SAR Narrative Compiled</span>
                    <p className="text-[11px] text-slate-400">Evidence exhibits, entity resolution, and SHAP weights bundled.</p>
                    <Link to="/investigations" className="text-[#25fff9] hover:underline text-[11px] font-bold block">
                      Launch Case Dossier →
                    </Link>
                  </div>
                )}
              </div>

              {/* Footer indicator inside card */}
              <div className="flex items-center justify-between pt-3 border-t border-dashed border-[#333] text-[9px] font-mono text-[#898989] uppercase">
                <span>SENTINEL SURVEILLANCE SUITE</span>
                <span>STATUS: VERIFIED</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          7. DATA DE-IDENTIFICATION & TEMPORAL ISOLATION (Replay signature paper section)
         ========================================================================= */}
      <section className="relative flex justify-center overflow-hidden px-6 sm:px-12 lg:px-18 py-20 bg-[#fcfcfc] border-b border-dashed border-[#d4d4d4]">
        <div className="relative mx-auto w-full max-w-[1560px] border-x border-dashed border-[#d4d4d4] px-4 sm:px-8">
          <div className="mb-10">
            <div className="inline-flex border border-dashed border-black/25 px-2 py-1 mb-3">
              <p className="font-mono text-[9px] uppercase tracking-wider text-black/60">
                The Process
              </p>
            </div>
            <h2 className="font-serif text-[36px] sm:text-[44px] leading-tight text-black">
              Data De-Identification &amp; Temporal Isolation
            </h2>
          </div>

          {/* Split Container */}
          <div className="relative rounded-2xl bg-[#eaebf1] border border-dashed border-[#c0c4ce] p-6 sm:p-10 grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            {/* Left Content */}
            <div className="space-y-4">
              <span className="font-mono text-xs uppercase tracking-wider text-black font-semibold">
                {deIdTab === 'pii' && 'PII & Identifiers Coverage'}
                {deIdTab === 'pipeline' && 'Strict Zero-Lookahead Pipeline'}
                {deIdTab === 'policy' && 'Isolated Compliance Architecture'}
              </span>

              <h3 className="font-serif text-2xl sm:text-3xl text-black leading-snug">
                {deIdTab === 'pii' && 'Your transaction telemetry leaves cleaner than an audit record.'}
                {deIdTab === 'pipeline' && 'Mathematically guaranteed zero future-data contamination.'}
                {deIdTab === 'policy' && 'Multi-tenant isolation with air-gapped evidence exhibits.'}
              </h3>

              <p className="text-sm text-[#727272] leading-relaxed font-normal">
                {deIdTab === 'pii' && 'Federal AML standards require surgical precision. We strip 60+ categories of personally identifiable information across payments, PANs, SSNs, and device fingerprints before graph inference.'}
                {deIdTab === 'pipeline' && 'General-purpose fraud engines leak future transactions during training and backtesting. Sentinel guarantees strict causal ordering so risk thresholds match historical reality.'}
                {deIdTab === 'policy' && 'Every institution operates in its own isolated environment. No shared data pools, no risk of cross-organization leakage, and pre-formatted FinCEN SAR exports ready for legal review.'}
              </p>
            </div>

            {/* Right Simulation: PII Redaction Demo */}
            <div className="rounded-xl border border-dashed border-[#a8a8a8] bg-white p-5 font-mono text-xs space-y-3 shadow-md">
              <div className="flex items-center justify-between pb-2 border-b border-dashed border-[#d4d4d4] text-[10px] text-[#898989]">
                <span>STREAM: TXN_INGESTION_PAYLOAD</span>
                <span className="text-emerald-600 font-bold">PII PURGED</span>
              </div>

              <div className="space-y-2 text-[11px] text-[#333]">
                <div className="flex items-center justify-between p-2 rounded bg-[#f7f8fa]">
                  <span>ACCOUNT_OWNER:</span>
                  <span className="bg-[#141518] text-[#25fff9] px-2 py-0.5 rounded text-[10px]">
                    [REDACTED_ENTITY_9941]
                  </span>
                </div>
                <div className="flex items-center justify-between p-2 rounded bg-[#f7f8fa]">
                  <span>PRIMARY_ACCOUNT_NUM:</span>
                  <span className="bg-[#141518] text-[#25fff9] px-2 py-0.5 rounded text-[10px]">
                    **** **** **** 7749
                  </span>
                </div>
                <div className="flex items-center justify-between p-2 rounded bg-[#f7f8fa]">
                  <span>CLIENT_IP_ADDRESS:</span>
                  <span className="bg-[#141518] text-[#25fff9] px-2 py-0.5 rounded text-[10px]">
                    [HASHED_SUBNET_V6]
                  </span>
                </div>
                <div className="flex items-center justify-between p-2 rounded bg-[#f7f8fa]">
                  <span>RISK_SCORE_ATTRIBUTION:</span>
                  <span className="font-bold text-[#499df8]">94 / 100 (HIGH)</span>
                </div>
              </div>
            </div>
          </div>

          {/* 3 Tab Buttons (Replay signature tab bar) */}
          <div className="mt-4 flex w-full border border-dashed border-[#ccc] bg-white">
            <button
              onClick={() => setDeIdTab('pii')}
              className={`flex-1 py-3 text-center font-serif text-sm transition-all ${
                deIdTab === 'pii' ? 'bg-[#141518] text-white font-bold' : 'text-black hover:bg-[#f0f0f0]'
              }`}
            >
              PII Coverage
            </button>
            <button
              onClick={() => setDeIdTab('pipeline')}
              className={`flex-1 py-3 text-center font-serif text-sm transition-all border-l border-dashed border-[#ccc] ${
                deIdTab === 'pipeline' ? 'bg-[#141518] text-white font-bold' : 'text-black hover:bg-[#f0f0f0]'
              }`}
            >
              Our Pipeline
            </button>
            <button
              onClick={() => setDeIdTab('policy')}
              className={`flex-1 py-3 text-center font-serif text-sm transition-all border-l border-dashed border-[#ccc] ${
                deIdTab === 'policy' ? 'bg-[#141518] text-white font-bold' : 'text-black hover:bg-[#f0f0f0]'
              }`}
            >
              Data Policy
            </button>
          </div>
        </div>
      </section>

      {/* =========================================================================
          8. "WHERE YOUR DATA GETS PROTECTED" (2 Wide Cards with Corner Triangles)
         ========================================================================= */}
      <section className="relative flex justify-center overflow-hidden px-6 sm:px-12 lg:px-18 py-16 bg-[#fcfcfc] border-b border-dashed border-[#d4d4d4]">
        <div className="relative mx-auto w-full max-w-[1560px] border-x border-dashed border-[#d4d4d4] px-4 sm:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Card 1 */}
            <div className="relative flex min-h-[220px] flex-col justify-between border border-black/15 bg-[#f9f9f9] p-8 text-black">
              <div
                className="absolute -top-[2px] right-0 size-4 bg-[#141518]"
                style={{ clipPath: 'polygon(100% 0, 0 0, 100% 100%)' }}
              />
              <p className="font-serif text-2xl sm:text-3xl leading-snug">
                Your transaction telemetry is mathematically isolated from future leakage.
              </p>
              <div className="flex items-center gap-2 font-mono text-[10px] text-[#898989] uppercase pt-4 border-t border-dashed border-black/10">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Strict Zero-Lookahead Verified</span>
              </div>
            </div>

            {/* Card 2 */}
            <div className="relative flex min-h-[220px] flex-col justify-between border border-black/15 bg-[#f9f9f9] p-8 text-black">
              <div
                className="absolute -top-[2px] right-0 size-4 bg-[#141518]"
                style={{ clipPath: 'polygon(100% 0, 0 0, 100% 100%)' }}
              />
              <p className="font-serif text-2xl sm:text-3xl leading-snug">
                Models are never trained with future events or unverified ground-truth.
              </p>
              <div className="flex items-center gap-2 font-mono text-[10px] text-[#898989] uppercase pt-4 border-t border-dashed border-black/10">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>FATF &amp; FinCEN Audit Compliance</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          9. "ANY INSTITUTION. ONE REQUIREMENT." (Technical Drafting Blueprint Cross)
         ========================================================================= */}
      <section className="relative flex justify-center overflow-hidden bg-[#eaebf1] px-6 sm:px-12 lg:px-18 py-20 border-b border-dashed border-[#d4d4d4]">
        <div className="relative mx-auto flex w-full max-w-[1560px] flex-col lg:flex-row items-center justify-between gap-12 border-x border-dashed border-[#d4d4d4] px-4 sm:px-8">
          {/* Left Text */}
          <div className="flex max-w-[500px] flex-col items-start gap-5">
            <div className="inline-flex border border-dashed border-black/25 px-2 py-1">
              <p className="font-mono text-[9px] uppercase tracking-wider text-black/60">
                Who it's for
              </p>
            </div>
            <h2 className="font-serif text-[36px] sm:text-[44px] leading-tight text-black">
              Any institution.<br />One requirement.
            </h2>
            <div className="text-sm sm:text-base text-[#727272] leading-relaxed font-normal space-y-3">
              <p>
                We work with financial institutions in every sector. What matters isn't whether you're a global tier-1 bank, an emerging neo-bank, or an instant crypto on-ramp.
              </p>
              <p>
                What matters is whether you have transaction records where amounts, timing, and counterparties reveal coordinated criminal intent.
              </p>
            </div>
          </div>

          {/* Right Blueprint Cross Graphic */}
          <div className="relative w-full max-w-[540px] aspect-square rounded-2xl border border-dashed border-[#a8a8a8] bg-[#e4e6ed] p-6 flex items-center justify-center">
            {/* Center Core */}
            <div className="relative w-36 h-36 rounded-xl border border-dashed border-black bg-[#133264] flex flex-col items-center justify-center text-white shadow-xl">
              <Network className="w-8 h-8 text-[#25fff9] mb-1" />
              <span className="font-mono text-[10px] uppercase font-bold text-center">
                Sentinel Core
              </span>
            </div>

            {/* Orbiting Industry Nodes */}
            <div className="absolute top-4 font-mono text-[11px] font-bold uppercase bg-white px-3 py-1.5 rounded border border-dashed border-black shadow-xs">
              Banking &amp; Lending
            </div>
            <div className="absolute bottom-4 font-mono text-[11px] font-bold uppercase bg-white px-3 py-1.5 rounded border border-dashed border-black shadow-xs">
              Crypto &amp; On-Ramps
            </div>
            <div className="absolute left-4 font-mono text-[11px] font-bold uppercase bg-white px-3 py-1.5 rounded border border-dashed border-black shadow-xs">
              Fintech &amp; Neobanks
            </div>
            <div className="absolute right-4 font-mono text-[11px] font-bold uppercase bg-white px-3 py-1.5 rounded border border-dashed border-black shadow-xs">
              B2C Marketplaces
            </div>

            {/* Technical Drafting Coordinate Lines */}
            <div className="pointer-events-none absolute inset-x-0 top-1/2 h-px border-t border-dashed border-black/20" />
            <div className="pointer-events-none absolute inset-y-0 left-1/2 w-px border-l border-dashed border-black/20" />
          </div>
        </div>
      </section>

      {/* =========================================================================
          10. LAYERED CTA CARD ("Find out what your transaction surveillance is missing")
         ========================================================================= */}
      <section className="relative overflow-hidden bg-[#fcfcfc] px-6 sm:px-12 lg:px-18 py-24 border-b border-dashed border-[#d4d4d4]">
        <div className="relative mx-auto w-full max-w-[960px]">
          {/* Overlapping layered decorative sheets */}
          <div className="absolute inset-0 bg-[#eaebf1] rounded-3xl -rotate-1 border border-dashed border-[#ccc] transform translate-y-2" />
          <div className="absolute inset-0 bg-[#d8e3fa] rounded-3xl rotate-1 border border-dashed border-[#b8c8ea] transform -translate-y-2" />

          {/* Main Card */}
          <div className="relative rounded-3xl border border-[#d4d4d4] bg-[#f4f4f4] p-8 sm:p-14 text-center shadow-2xl space-y-6">
            <h2 className="font-serif text-3xl sm:text-5xl text-black tracking-tight leading-tight">
              Find out what your transaction surveillance is missing
            </h2>

            <p className="max-w-xl mx-auto text-sm sm:text-base text-[#727272] leading-relaxed">
              Experience the power of real-time behavioral fingerprinting, explainable scoring, and interactive graph replay.
            </p>

            <div className="pt-2">
              <Link
                to="/dashboard"
                className="group relative inline-flex items-center justify-center overflow-hidden bg-[#141518] px-8 py-4 text-sm font-mono uppercase tracking-wider text-white shadow-xl hover:scale-[1.02] transition-transform"
              >
                <div className="pointer-events-none absolute inset-y-0 left-0 w-1.5 bg-[#499df8] -translate-x-full group-hover:translate-x-0 transition-transform" />
                <div className="pointer-events-none absolute inset-y-0 right-0 w-1.5 bg-[#54702f] translate-x-full group-hover:translate-x-0 transition-transform" />
                <span className="relative z-10 flex items-center gap-2">
                  <span>Launch Sentinel Studio</span>
                  <ArrowRight className="w-4 h-4" />
                </span>
              </Link>
            </div>

            {/* Inner Technical Footer with Code Snippet & Process */}
            <div className="pt-8 mt-6 border-t border-dashed border-black/10 flex flex-col sm:flex-row items-center justify-between text-[10px] font-mono text-[#898989] uppercase gap-4">
              <div className="text-left space-y-1">
                <p className="text-black font-semibold">process:</p>
                <p>identified → structured → verified → protected</p>
              </div>

              <div className="bg-white border border-[#dedede] p-2 rounded text-left font-mono text-[9px] text-[#444]">
                <code>def evaluate_stream(txn): return model.score(txn)</code>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          11. MINIMALIST BLACK FOOTER WITH GIANT WATERMARKED WORDMARK
         ========================================================================= */}
      <footer className="relative bg-[#080808] px-6 sm:px-12 lg:px-18 pt-16 pb-10 text-white">
        <div className="relative mx-auto w-full max-w-[1560px] space-y-16">
          {/* 4 Column Navigation */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 pt-8 border-t border-dashed border-white/20 text-xs">
            {/* Col 1 */}
            <div className="space-y-3">
              <p className="font-serif text-sm text-white">01 Product</p>
              <ul className="space-y-2 font-mono text-[11px] text-white/60 uppercase">
                <li><Link to="/#overview" className="hover:text-white transition-colors">Overview</Link></li>
                <li><Link to="/behavioral" className="hover:text-white transition-colors">Behavioral Engine</Link></li>
                <li><Link to="/alerts" className="hover:text-white transition-colors">Risk Scoring</Link></li>
                <li><Link to="/network" className="hover:text-white transition-colors">Graph Replay</Link></li>
              </ul>
            </div>

            {/* Col 2 */}
            <div className="space-y-3">
              <p className="font-serif text-sm text-white">02 Platform</p>
              <ul className="space-y-2 font-mono text-[11px] text-white/60 uppercase">
                <li><Link to="/dashboard" className="hover:text-white transition-colors">Command Center</Link></li>
                <li><Link to="/investigations" className="hover:text-white transition-colors">Case Studio</Link></li>
                <li><Link to="/transactions" className="hover:text-white transition-colors">Explorer</Link></li>
                <li><Link to="/monitoring" className="hover:text-white transition-colors">Monitoring</Link></li>
              </ul>
            </div>

            {/* Col 3 */}
            <div className="space-y-3">
              <p className="font-serif text-sm text-white">03 Compliance</p>
              <ul className="space-y-2 font-mono text-[11px] text-white/60 uppercase">
                <li><span className="text-[#25fff9]">FinCEN SAR Ready</span></li>
                <li><span>FATF Recommendation 16</span></li>
                <li><span>SOC-2 Type II Controls</span></li>
                <li><span>Strict Zero-Lookahead</span></li>
              </ul>
            </div>

            {/* Col 4 */}
            <div className="space-y-3">
              <p className="font-serif text-sm text-white">04 Legal</p>
              <ul className="space-y-2 font-mono text-[11px] text-white/60 uppercase">
                <li><Link to="/terms" className="hover:text-white transition-colors">Terms of Use</Link></li>
                <li><Link to="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
                <li><Link to="/login" className="hover:text-white transition-colors">Investigator Sign In</Link></li>
              </ul>
            </div>
          </div>

          {/* MONUMENTAL GIANT WATERMARK SERIF WORDMARK: "SENTINEL" */}
          <div className="relative w-full overflow-hidden select-none py-6 border-t border-dashed border-white/10">
            <h1
              className="w-full text-center font-serif text-[18vw] leading-none tracking-tight text-white/10 font-bold uppercase transition-colors hover:text-white/20"
              style={{
                fontFamily: 'Newsreader, Georgia, serif',
                WebkitTextStroke: '1px rgba(255, 255, 255, 0.15)'
              }}
            >
              SENTINEL
            </h1>
          </div>

          {/* Sub Footer Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between text-[11px] font-mono text-white/40 border-t border-dashed border-white/10 pt-6">
            <p>© 2026 Sentinel Financial Risk Intelligence Platform. All rights reserved.</p>
            <p className="text-[#25fff9]">Strict Zero-Lookahead Engine Active</p>
          </div>
        </div>
      </footer>
    </div>
  );
};
