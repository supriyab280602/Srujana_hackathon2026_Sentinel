import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Zap, Building, Mail, User, ChevronDown } from 'lucide-react';

export const SignupPage: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      navigate('/dashboard');
    }, 800);
  };

  return (
    <div className="min-h-screen bg-[#fafbfe] flex flex-col items-center justify-center p-6 relative">
      <div className="relative z-10 w-full max-w-md">
        {/* Logo */}
        <div className="flex flex-col items-center text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2.5 mb-4 group">
            <div className="w-8 h-8 rounded-lg bg-neutral-900 flex items-center justify-center text-white font-bold text-sm shadow-xs">
              S
            </div>
            <div className="font-bold text-xl tracking-widest text-neutral-900">
              SENTINEL
            </div>
          </Link>

          <h1 className="text-2xl sm:text-3xl font-bold text-neutral-900 tracking-tight">Request Investigator Access</h1>
          <p className="text-xs text-neutral-500 mt-1">
            Enroll in the Sentinel AML &amp; Fraud Surveillance Desk
          </p>
        </div>

        <div className="bg-white border border-neutral-100 rounded-3xl p-8 shadow-sm">
          {/* Dev Notice */}
          <div className="flex items-start gap-2.5 p-4 rounded-2xl bg-[#f0f5ff] border border-blue-100 text-blue-900 text-xs mb-6">
            <Zap className="w-4 h-4 shrink-0 mt-0.5 text-blue-600" />
            <div>
              <span className="font-bold">DEV ENVIRONMENT ACTIVE:</span>{' '}
              Registration scaffolded. Submitting grants immediate live console access.
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block text-xs font-medium text-neutral-600 mb-1.5">
                <span className="flex items-center gap-1.5"><User className="w-3.5 h-3.5 text-neutral-400" /> Full Name</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Alex Mercer"
                className="w-full bg-[#f4f5f7] border-0 rounded-2xl px-4 py-3 text-xs text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-300 transition-all"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-600 mb-1.5">
                <span className="flex items-center gap-1.5"><Mail className="w-3.5 h-3.5 text-neutral-400" /> Investigator Work Email</span>
              </label>
              <input
                type="email"
                placeholder="alex.mercer@bankcompliance.com"
                className="w-full bg-[#f4f5f7] border-0 rounded-2xl px-4 py-3 text-xs text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-300 transition-all"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-600 mb-1.5">
                <span className="flex items-center gap-1.5"><Building className="w-3.5 h-3.5 text-neutral-400" /> Assigned Department</span>
              </label>
              <div className="relative">
                <select className="w-full appearance-none bg-[#f4f5f7] border-0 rounded-2xl px-4 py-3 text-xs text-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-300 transition-all pr-10 cursor-pointer">
                  <option>Tier-2 Financial Crimes Unit</option>
                  <option>Cross-Border Mule Investigation</option>
                  <option>High-Risk Merchant Underwriting</option>
                  <option>AML Compliance &amp; Regulatory Affairs</option>
                  <option>Executive Risk Oversight</option>
                </select>
                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none" />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-full bg-neutral-900 hover:bg-neutral-800 text-white font-semibold text-xs tracking-wide shadow-xs transition-all disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <svg className="animate-spin w-4 h-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  <span>Provisioning Account...</span>
                </>
              ) : (
                <>
                  <span>Create Investigator Account</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-neutral-100 space-y-3 text-center text-xs">
            <div className="text-neutral-500">
              Already have an account?{' '}
              <Link to="/login" className="text-blue-600 hover:underline font-semibold">
                Sign In
              </Link>
            </div>
            <Link to="/" className="block text-neutral-400 hover:text-neutral-800 transition-colors font-medium text-[11px]">
              ← Return to Landing Page
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
