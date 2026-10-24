import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Bell,
  ShieldCheck,
  Network,
  ClipboardList,
  Activity,
  LogOut,
  SlidersHorizontal,
} from 'lucide-react';

const navigationItems = [
  { name: 'Dashboard', path: '/app', icon: LayoutDashboard, exact: true },
  { name: 'Risk Alerts', path: '/app/alerts', icon: Bell },
  { name: 'Behavioral Insights', path: '/app/behavioral', icon: Activity },
  { name: 'Relationship Graph', path: '/app/network', icon: Network },
  { name: 'Investigations', path: '/app/investigations', icon: ClipboardList },
  { name: 'Risk Monitoring', path: '/app/monitoring', icon: SlidersHorizontal },
];

export const Sidebar: React.FC = () => {
  return (
    <aside className="w-64 bg-surface border-r border-surface-border flex flex-col h-screen select-none">
      {/* Brand Logo & Name */}
      <div className="h-16 flex items-center gap-3 px-6 border-b border-surface-border/80">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-brand-600 to-blue-400 flex items-center justify-center text-white shadow-md shadow-brand-500/20">
          <ShieldCheck className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="font-bold text-sm tracking-wide text-white uppercase flex items-center gap-1.5">
            SENTINEL <span className="text-[10px] bg-brand-500/20 text-brand-400 border border-brand-500/30 px-1 rounded font-mono">AI</span>
          </h1>
          <p className="text-[10px] text-slate-400">Financial Fraud Intelligence</p>
        </div>
      </div>

      {/* Nav List */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <div className="px-3 pb-2 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
          Detection & Response
        </div>
        {navigationItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.exact}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-brand-600/15 text-brand-400 border border-brand-500/30 font-semibold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-surface-elevated/60'
              }`
            }
          >
            <item.icon className="w-4 h-4" />
            <span>{item.name}</span>
          </NavLink>
        ))}
      </nav>

      {/* Investigator / Bottom Footer */}
      <div className="p-4 border-t border-surface-border/80 bg-surface/50">
        <div className="flex items-center justify-between text-xs text-slate-400">
          <div>
            <p className="font-medium text-slate-200">Investigator Unit</p>
            <p className="text-[11px] text-slate-500">Tier-2 AML Desk</p>
          </div>
          <NavLink to="/login" title="Sign out" className="p-1.5 hover:text-rose-400 hover:bg-surface-elevated rounded transition-colors">
            <LogOut className="w-4 h-4" />
          </NavLink>
        </div>
      </div>
    </aside>
  );
};
