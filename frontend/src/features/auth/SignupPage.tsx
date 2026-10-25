import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Shield, ArrowRight, Building, Mail, User, ChevronDown, ShieldAlert, Lock } from 'lucide-react';

export const SignupPage: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      navigate('/dashboard');
    }, 500);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 relative">
      <div className="relative z-10 w-full max-w-sm">
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center mb-6">
          <Link to="/" className="inline-flex items-center gap-2 mb-3 group">
            <div className="w-8 h-8 rounded-lg bg-brand-950 flex items-center justify-center text-white shadow-xs">
              <Shield className="w-4 h-4 text-blue-400" />
            </div>
            <div className="font-bold text-base tracking-widest text-ink">
              SENTINEL
            </div>
          </Link>

          <h1 className="text-xl font-bold text-ink tracking-tight">Request Investigator Access</h1>
          <p className="text-xs text-ink-muted mt-0.5">
            Enroll in the Sentinel AML &amp; Fraud Surveillance Desk
          </p>
        </div>

        {/* Card */}
        <div className="bg-surface border border-surface-border rounded-xl p-6 shadow-xs">
          {/* Dev Notice */}
          <div className="flex items-start gap-2 p-3 rounded-lg bg-brand-50 border border-brand-200 text-brand-900 text-xs mb-4">
            <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5 text-brand-600" />
            <div className="text-[11px] leading-relaxed">
              <span className="font-bold">EVALUATION ENVIRONMENT:</span> Registration automated for hackathon adjudication. Submitting grants immediate access to the surveillance workspace.
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
            <div>
              <label className="block text-[11px] font-semibold text-ink-secondary mb-1">
                <span className="flex items-center gap-1.5"><User className="w-3.5 h-3.5 text-ink-muted" /> Full Name</span>
              </label>
              <input
                type="text"
                defaultValue="Alex Mercer"
                placeholder="e.g. Alex Mercer"
                className="w-full bg-surface-elevated border border-surface-border rounded-lg px-3 py-2 text-xs text-ink placeholder:text-ink-muted focus:outline-none focus:ring-1 focus:ring-brand-500 font-sans"
                required
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-ink-secondary mb-1">
                <span className="flex items-center gap-1.5"><Mail className="w-3.5 h-3.5 text-ink-muted" /> Investigator Work Email</span>
              </label>
              <input
                type="email"
                defaultValue="alex.mercer@bankcompliance.in"
                placeholder="alex.mercer@bankcompliance.in"
                className="w-full bg-surface-elevated border border-surface-border rounded-lg px-3 py-2 text-xs text-ink placeholder:text-ink-muted focus:outline-none focus:ring-1 focus:ring-brand-500 font-sans"
                required
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-ink-secondary mb-1">
                <span className="flex items-center gap-1.5"><Building className="w-3.5 h-3.5 text-ink-muted" /> Assigned Department</span>
              </label>
              <div className="relative">
                <select className="w-full appearance-none bg-surface-elevated border border-surface-border rounded-lg px-3 py-2 text-xs text-ink focus:outline-none focus:ring-1 focus:ring-brand-500 font-sans pr-8 cursor-pointer">
                  <option>Tier-2 Financial Crimes Unit (FCU)</option>
                  <option>Cross-Border Mule Investigation</option>
                  <option>High-Risk Merchant Underwriting</option>
                  <option>AML Compliance &amp; FIU-IND Reporting</option>
                  <option>Executive Risk Oversight</option>
                </select>
                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-ink-muted pointer-events-none" />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-2 px-4 rounded-lg bg-brand-950 hover:bg-slate-800 text-white font-semibold text-xs transition-colors shadow-xs flex items-center justify-center gap-1.5"
            >
              {loading ? (
                <>
                  <svg className="animate-spin w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  <span>Provisioning Account...</span>
                </>
              ) : (
                <>
                  <span>Create Investigator Account</span>
                  <ArrowRight className="w-3.5 h-3.5 text-blue-400" />
                </>
              )}
            </button>
          </form>

          <div className="mt-4 pt-3 border-t border-surface-border space-y-2 text-center text-xs">
            <div className="text-[11px] text-ink-muted">
              Already have an account?{' '}
              <Link to="/login" className="text-brand-600 hover:underline font-semibold">
                Sign In
              </Link>
            </div>
            <Link to="/" className="block text-ink-muted hover:text-ink transition-colors font-medium text-[11px]">
              ← Return to Landing Page
            </Link>
          </div>
        </div>

        {/* Security Compliance Footer */}
        <div className="mt-4 text-center text-[10px] text-ink-muted flex items-center justify-center gap-1.5">
          <Lock className="w-3 h-3 text-ink-muted" />
          <span>FIPS 140-2 Encrypted Session · FIU-IND / RBI AML Guidelines</span>
        </div>
      </div>
    </div>
  );
};

