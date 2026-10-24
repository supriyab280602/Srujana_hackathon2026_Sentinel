import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { UserPlus, AlertCircle, ArrowRight } from 'lucide-react';
import { Button } from '../../components/ui/Button';

export const SignupPage: React.FC = () => {
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    navigate('/app');
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-surface border border-surface-border rounded-2xl p-8 shadow-xl">
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-12 h-12 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 mb-3">
            <UserPlus className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight">Register Investigator</h2>
          <p className="text-xs text-slate-400 mt-1">Enroll in Sentinel AML &amp; Fraud Surveillance Desk</p>
        </div>

        <div className="flex items-start gap-2.5 p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs mb-6">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold">Registration Scaffold:</span> Investigator role verification is currently local. Identity provider connection to be linked in subsequent sprint.
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Full Name</label>
            <input
              type="text"
              placeholder="e.g. Alex Mercer"
              className="w-full bg-surface-elevated border border-surface-border rounded-lg px-3.5 py-2 text-sm text-slate-100 focus:outline-none focus:border-brand-500"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Investigator Work Email</label>
            <input
              type="email"
              placeholder="alex.mercer@bankcompliance.com"
              className="w-full bg-surface-elevated border border-surface-border rounded-lg px-3.5 py-2 text-sm text-slate-100 focus:outline-none focus:border-brand-500"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Assigned Department</label>
            <select className="w-full bg-surface-elevated border border-surface-border rounded-lg px-3.5 py-2 text-sm text-slate-100 focus:outline-none focus:border-brand-500">
              <option>Tier-2 Financial Crimes Unit</option>
              <option>Cross-Border Mule Investigation</option>
              <option>High-Risk Merchant Underwriting</option>
            </select>
          </div>

          <Button type="submit" className="w-full mt-2" variant="primary">
            <span>Register &amp; Launch Console</span>
            <ArrowRight className="w-4 h-4" />
          </Button>
        </form>

        <div className="mt-6 pt-5 border-t border-surface-border/60 text-center text-xs text-slate-400">
          Already registered?{' '}
          <Link to="/login" className="text-brand-400 hover:text-brand-300 font-medium">
            Sign in
          </Link>
          <div className="mt-3">
            <Link to="/" className="text-slate-500 hover:text-slate-300">
              ← Return to Landing Page
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
