import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Bell,
  Network,
  ClipboardList,
  Activity,
  SlidersHorizontal,
  ArrowLeftRight,
  Settings,
  ChevronRight,
  Shield,
  PlusCircle
} from 'lucide-react';

const primaryNavItems = [
  { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard, exact: true },
  { name: 'Risk Alerts', path: '/alerts', icon: Bell, badge: '3' },
  { name: 'Transactions', path: '/transactions', icon: ArrowLeftRight },
  { name: 'Investigations', path: '/investigations', icon: ClipboardList, badge: '2' },
];

const intelligenceNavItems = [
  { name: 'Relationship Graph', path: '/network', icon: Network },
  { name: 'Behavioral Insights', path: '/behavioral', icon: Activity },
  { name: 'Risk Monitoring', path: '/monitoring', icon: SlidersHorizontal },
  { name: 'Platform Settings', path: '/settings', icon: Settings },
];

const activeTypologies = [
  { name: 'Rapid ACH Fanout', count: '4 mules', dotClass: 'bg-amber-500' },
  { name: 'Mule Ring Clusters', count: '18 accts', dotClass: 'bg-rose-500' },
  { name: 'Layered Crypto Shells', count: '6 entities', dotClass: 'bg-blue-500' },
];

export const Sidebar: React.FC = () => {
  const navigate = useNavigate();

  return (
    <aside className="w-60 bg-surface border-r border-surface-border flex flex-col h-screen select-none z-30 shrink-0">
      {/* Brand & Workspace Identity */}
      <div className="p-4 border-b border-surface-border">
        <NavLink to="/" className="flex items-center gap-2.5 group">
          <div className="w-7 h-7 rounded-md bg-brand-950 flex items-center justify-center text-white shadow-xs">
            <Shield className="w-3.5 h-3.5 text-blue-400" />
          </div>
          <div>
            <div className="font-bold text-xs tracking-wider text-ink flex items-center gap-1.5">
              <span>SENTINEL</span>
              <span className="text-[9px] font-semibold text-brand-600 bg-brand-50 px-1 py-0.2 rounded border border-brand-200">
                PRO
              </span>
            </div>
            <div className="text-[10px] text-ink-muted">Financial Crime Intel</div>
          </div>
        </NavLink>

        {/* Quick Simulation CTA */}
        <button
          onClick={() => navigate('/transactions')}
          className="mt-3 w-full flex items-center justify-center gap-1.5 bg-brand-950 hover:bg-slate-800 text-white text-xs font-medium py-1.5 px-3 rounded-lg shadow-xs transition-colors"
        >
          <PlusCircle className="w-3.5 h-3.5 text-blue-400" />
          <span>Simulate Transaction</span>
        </button>
      </div>

      {/* Navigation Groups */}
      <nav className="flex-1 px-3 py-3 space-y-5 overflow-y-auto">
        {/* Core Operations */}
        <div>
          <div className="px-2 pb-1.5 text-[10px] font-bold text-ink-muted uppercase tracking-wider">
            Surveillance & Triage
          </div>
          <div className="space-y-0.5">
            {primaryNavItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.exact}
                className={({ isActive }) =>
                  `flex items-center justify-between px-2.5 py-2 rounded-lg text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-surface-elevated text-brand-700 font-semibold border border-surface-border shadow-xs'
                      : 'text-ink-secondary hover:text-ink hover:bg-surface-elevated'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <div className="flex items-center gap-2.5">
                      <item.icon className={`w-4 h-4 ${isActive ? 'text-brand-700' : 'text-ink-muted'}`} />
                      <span>{item.name}</span>
                    </div>
                    {item.badge && (
                      <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono font-semibold ${
                        isActive ? 'bg-brand-100 text-brand-800' : 'bg-surface-elevated text-ink-secondary'
                      }`}>
                        {item.badge}
                      </span>
                    )}
                  </>
                )}
              </NavLink>
            ))}
          </div>
        </div>

        {/* Intelligence & Analytics */}
        <div>
          <div className="px-2 pb-1.5 text-[10px] font-bold text-ink-muted uppercase tracking-wider">
            Intelligence & Graph
          </div>
          <div className="space-y-0.5">
            {intelligenceNavItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center justify-between px-2.5 py-2 rounded-lg text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-surface-elevated text-brand-700 font-semibold border border-surface-border shadow-xs'
                      : 'text-ink-secondary hover:text-ink hover:bg-surface-elevated'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <div className="flex items-center gap-2.5">
                      <item.icon className={`w-4 h-4 ${isActive ? 'text-brand-700' : 'text-ink-muted'}`} />
                      <span>{item.name}</span>
                    </div>
                    {isActive && <ChevronRight className="w-3 h-3 text-brand-600" />}
                  </>
                )}
              </NavLink>
            ))}
          </div>
        </div>

        {/* Active Typology Clusters */}
        <div className="pt-2 border-t border-surface-border">
          <div className="px-2 pb-1.5 text-[10px] font-bold text-ink-muted uppercase tracking-wider flex items-center justify-between">
            <span>Flagged Typologies</span>
            <span className="text-[9px] text-ink-muted">Live</span>
          </div>
          <div className="space-y-1">
            {activeTypologies.map((t) => (
              <div
                key={t.name}
                onClick={() => navigate('/network')}
                className="flex items-center justify-between px-2.5 py-1.5 rounded-md text-[11px] text-ink-secondary hover:bg-surface-elevated cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-2 truncate">
                  <span className={`w-1.5 h-1.5 rounded-full ${t.dotClass}`} />
                  <span className="truncate">{t.name}</span>
                </div>
                <span className="text-[10px] text-ink-muted font-mono">{t.count}</span>
              </div>
            ))}
          </div>
        </div>
      </nav>

      {/* Footer Info / Regulatory Compliance */}
      <div className="p-3 border-t border-surface-border bg-surface-subtle">
        <div className="flex items-center justify-between text-[10px] text-ink-muted">
          <span>Rule Engine v2.4</span>
          <span className="font-mono text-emerald-600 font-semibold">99.8% Uptime</span>
        </div>
      </div>
    </aside>
  );
};
