import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Shield,
  Activity,
  Network,
  ShieldCheck,
  Eye,
  EyeOff,
  ArrowRight,
  Lock,
  ShieldAlert,
  CheckCircle2,
  X,
} from 'lucide-react';

const GoogleIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
    <path
      fill="#4285F4"
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
    />
    <path
      fill="#34A853"
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
    />
    <path
      fill="#FBBC05"
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
    />
    <path
      fill="#EA4335"
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
    />
  </svg>
);

const SsoIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75} aria-hidden="true">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z"
    />
  </svg>
);

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('investigator@sentinel.ai');
  const [password, setPassword] = useState('sentinel-access-2026');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [authMethod, setAuthMethod] = useState<'password' | 'google' | 'sso' | null>(null);
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSubmitted, setForgotSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthMethod('password');
    setLoading(true);
    setTimeout(() => {
      navigate('/dashboard');
    }, 450);
  };

  const handleGoogleSignIn = () => {
    setAuthMethod('google');
    setLoading(true);
    setTimeout(() => {
      navigate('/dashboard');
    }, 500);
  };

  const handleSsoSignIn = () => {
    setAuthMethod('sso');
    setLoading(true);
    setTimeout(() => {
      navigate('/dashboard');
    }, 500);
  };

  const handleForgotSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setForgotSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-[#060A14] flex flex-col lg:flex-row relative overflow-x-hidden selection:bg-brand-500 selection:text-white">
      {/* ── Left Column: Sentinel Brand Panel ────────────────────────────────── */}
      <div className="relative w-full lg:w-[48%] xl:w-[45%] bg-gradient-to-b from-[#0B1224] via-[#070D1B] to-[#040812] border-b lg:border-b-0 lg:border-r border-white/10 p-6 sm:p-10 lg:p-12 xl:p-16 flex flex-col justify-between overflow-hidden">
        {/* Subtle Decorative Network Mesh Lines */}
        <div className="absolute inset-0 pointer-events-none opacity-20">
          <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="grid-pattern" width="48" height="48" patternUnits="userSpaceOnUse">
                <circle cx="2" cy="2" r="1" fill="#3B82F6" />
                <path d="M 48 0 L 0 0 0 48" fill="none" stroke="#1E293B" strokeWidth="0.5" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid-pattern)" />
          </svg>
        </div>

        {/* Ambient Radial Glow */}
        <div className="absolute top-1/4 -left-20 w-80 h-80 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-10 right-0 w-72 h-72 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

        {/* Content Wrapper */}
        <div className="relative z-10 space-y-8 sm:space-y-10 my-auto">
          {/* Logo & Brand Name */}
          <Link to="/" className="inline-flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white shadow-lg shadow-blue-500/20 group-hover:scale-105 transition-transform duration-200">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-lg tracking-widest text-white leading-none">
                SENTINEL
              </span>
              <span className="text-[9px] font-mono tracking-wider text-blue-400 uppercase mt-0.5">
                Financial Crime Intelligence
              </span>
            </div>
          </Link>

          {/* Main Headline & Description */}
          <div className="space-y-3">
            <h1 className="text-2xl sm:text-3xl xl:text-4xl font-extrabold tracking-tight text-white leading-[1.2]">
              Intelligence that protects financial systems.
            </h1>
            <p className="text-xs sm:text-sm text-slate-300/80 leading-relaxed max-w-lg">
              Autonomous transaction surveillance, graph topological mule detection, and explainable AI risk scoring engineered for institutional banking and high-throughput payment rails.
            </p>
          </div>

          {/* Three Compact Capability Highlights */}
          <div className="space-y-4 pt-2">
            <div className="flex items-start gap-3.5 group">
              <div className="w-9 h-9 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center shrink-0 mt-0.5 group-hover:border-blue-500/40 transition-colors">
                <Activity className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-xs sm:text-sm font-semibold text-white tracking-tight">
                  Behavioral Risk Intelligence
                </h2>
                <p className="text-[11px] sm:text-xs text-slate-400 leading-relaxed mt-0.5">
                  Sub-second transaction evaluation and real-time behavioral deviation surveillance across active payment corridors.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3.5 group">
              <div className="w-9 h-9 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0 mt-0.5 group-hover:border-indigo-500/40 transition-colors">
                <Network className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-xs sm:text-sm font-semibold text-white tracking-tight">
                  Transaction Network Analysis
                </h2>
                <p className="text-[11px] sm:text-xs text-slate-400 leading-relaxed mt-0.5">
                  Multi-hop graph topology tracking, circular mule ring detection, and automated fund dissipation mapping.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3.5 group">
              <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5 group-hover:border-emerald-500/40 transition-colors">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-xs sm:text-sm font-semibold text-white tracking-tight">
                  Explainable Fraud Investigation
                </h2>
                <p className="text-[11px] sm:text-xs text-slate-400 leading-relaxed mt-0.5">
                  Deterministic zero-lookahead audit dockets with chronological transaction sequence replay telemetry.
                </p>
              </div>
            </div>
          </div>

          {/* Testimonial / Institutional Trust Card (Desktop & Tablet) */}
          <div className="hidden sm:block p-4 sm:p-4.5 rounded-xl bg-white/[0.04] border border-white/10 backdrop-blur-xs space-y-3">
            <p className="text-xs text-slate-300 italic leading-relaxed">
              &ldquo;Sentinel reduced our structuring false-positive triage time by 78% while surfacing hidden multi-hop mule networks before settlement cutoff.&rdquo;
            </p>
            <div className="flex items-center gap-3 pt-1 border-t border-white/5">
              <div className="w-8 h-8 rounded-full bg-blue-600/30 border border-blue-400/30 flex items-center justify-center text-xs font-bold text-blue-300">
                VM
              </div>
              <div>
                <div className="text-xs font-semibold text-white">Vikram Malhotra</div>
                <div className="text-[11px] text-slate-400">Head of Financial Crime Intelligence · Apex Bank</div>
              </div>
            </div>
          </div>
        </div>

        {/* Security Compliance Footer on Left Panel */}
        <div className="relative z-10 pt-6 mt-6 border-t border-white/5 text-[11px] text-slate-400 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5 text-blue-400" />
            <span>FIPS 140-2 Encrypted Session · SOC2 Type II Certified</span>
          </div>
          <span className="font-mono text-[10px] text-slate-500">v0.1.0-PROD</span>
        </div>
      </div>

      {/* ── Right Column: Clean Light Sign-In Card ───────────────────────────── */}
      <div className="w-full lg:w-[52%] xl:w-[55%] flex flex-col justify-center items-center p-4 sm:p-8 lg:p-12 xl:p-16 relative">
        <div className="w-full max-w-[430px] my-auto">
          {/* Sign In Card */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-2xl shadow-black/40 relative">
            {/* Form Heading */}
            <div className="text-center mb-6">
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                Sign in to Sentinel
              </h2>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Sign in with your enterprise credentials or authorized SSO.
              </p>
            </div>

            {/* Evaluation Access Notice */}
            <div className="flex items-start gap-2.5 p-3 rounded-lg bg-blue-50/90 border border-blue-200 text-blue-950 text-xs mb-5 shadow-2xs">
              <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5 text-blue-600" />
              <div className="text-[11px] leading-relaxed">
                <span className="font-bold text-blue-900">EVALUATION ACCESS:</span> Pre-loaded with demo investigator credentials. Submit to enter surveillance console.
              </div>
            </div>

            {/* Main Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email Field */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email address"
                  className="w-full h-10 bg-white border border-slate-300 rounded-lg px-3.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 transition-all font-sans"
                  required
                />
              </div>

              {/* Password Field */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-slate-700">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setShowForgotModal(true);
                      setForgotSubmitted(false);
                      setForgotEmail(email);
                    }}
                    className="text-xs font-medium text-blue-600 hover:text-blue-700 transition-colors cursor-pointer"
                  >
                    Forgot your password?
                  </button>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="w-full h-10 bg-white border border-slate-300 rounded-lg px-3.5 pr-10 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 transition-all font-mono"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 transition-colors p-1"
                    title={showPassword ? 'Hide password' : 'Show password'}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Primary Sign In Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full h-10 mt-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition-colors shadow-xs hover:shadow flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading && authMethod === 'password' ? (
                  <>
                    <svg className="animate-spin w-4 h-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    <span>Authenticating Session…</span>
                  </>
                ) : (
                  <>
                    <span>Sign in</span>
                    <ArrowRight className="w-4 h-4 text-blue-200" />
                  </>
                )}
              </button>
            </form>

            {/* Divider */}
            <div className="relative my-5">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200" />
              </div>
              <div className="relative flex justify-center text-[10px] uppercase font-semibold">
                <span className="bg-white px-3 text-slate-400 tracking-wider">OR</span>
              </div>
            </div>

            {/* Alternative Authentication Options */}
            <div className="space-y-2.5">
              {/* Google Sign In */}
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={loading}
                className="w-full h-10 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 transition-colors flex items-center justify-center gap-2.5 shadow-2xs hover:border-slate-400 cursor-pointer disabled:opacity-60"
              >
                {loading && authMethod === 'google' ? (
                  <span className="flex items-center gap-2 text-slate-600">
                    <svg className="animate-spin w-3.5 h-3.5 text-blue-600" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Connecting Google Identity…
                  </span>
                ) : (
                  <>
                    <GoogleIcon className="w-4 h-4" />
                    <span>Sign in with Google</span>
                  </>
                )}
              </button>

              {/* SSO Sign In */}
              <button
                type="button"
                onClick={handleSsoSignIn}
                disabled={loading}
                className="w-full h-10 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 transition-colors flex items-center justify-center gap-2.5 shadow-2xs hover:border-slate-400 cursor-pointer disabled:opacity-60"
              >
                {loading && authMethod === 'sso' ? (
                  <span className="flex items-center gap-2 text-slate-600">
                    <svg className="animate-spin w-3.5 h-3.5 text-blue-600" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Redirecting to Enterprise SSO…
                  </span>
                ) : (
                  <>
                    <SsoIcon className="w-4 h-4 text-slate-600" />
                    <span>Sign in with SSO</span>
                  </>
                )}
              </button>
            </div>

            {/* Signup Navigation Link */}
            <div className="mt-6 pt-4 border-t border-slate-100 text-center">
              <p className="text-xs text-slate-500">
                Don&apos;t have an investigator account?{' '}
                <Link to="/signup" className="text-blue-600 font-semibold hover:text-blue-700 hover:underline">
                  Register compliance tier
                </Link>
              </p>
            </div>
          </div>

          {/* Clean Card Footer Links */}
          <div className="mt-5 text-center text-[11px] text-slate-400 flex flex-wrap items-center justify-center gap-x-4 gap-y-1">
            <span>&copy; Copyright 2026 Sentinel AI.</span>
            <button
              type="button"
              onClick={() => alert('Sentinel Financial Crime Intelligence Compliance Policy (SOC-2 Type II / FIPS-140-2 certified).')}
              className="hover:text-slate-300 transition-colors cursor-pointer"
            >
              Privacy Policy
            </button>
            <button
              type="button"
              onClick={() => alert('Sentinel Security Architecture: Hardware Security Module (HSM) session token signing active.')}
              className="hover:text-slate-300 transition-colors cursor-pointer"
            >
              Security
            </button>
          </div>
        </div>
      </div>

      {/* ── Forgot Password Modal ────────────────────────────────────────────── */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 relative">
            <button
              type="button"
              onClick={() => setShowForgotModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors p-1 cursor-pointer"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-bold text-slate-900 tracking-tight mb-1">
              Reset Your Sentinel Password
            </h3>
            <p className="text-xs text-slate-500 mb-4 leading-relaxed">
              Enter your investigator work email address to receive enterprise identity reset instructions or IdP ticket authentication.
            </p>

            {forgotSubmitted ? (
              <div className="space-y-4">
                <div className="p-3.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">Password Reset Dispatched:</span> If an active surveillance account is registered under <b className="font-mono">{forgotEmail}</b>, authentication reset instructions have been forwarded to your enterprise IdP.
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowForgotModal(false)}
                  className="w-full py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs transition-colors cursor-pointer"
                >
                  Return to Sign In
                </button>
              </div>
            ) : (
              <form onSubmit={handleForgotSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Work Email
                  </label>
                  <input
                    type="email"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    placeholder="investigator@sentinel.ai"
                    className="w-full h-10 bg-white border border-slate-300 rounded-lg px-3 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                    required
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowForgotModal(false)}
                    className="flex-1 py-2 rounded-lg border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold text-xs transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition-colors cursor-pointer"
                  >
                    Send Reset Link
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
