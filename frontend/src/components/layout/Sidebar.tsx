import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Bell,
  Network,
  ClipboardList,
  Activity,
  LogOut,
  SlidersHorizontal,
  DollarSign,
  Settings,
  ChevronRight,
  Plus
} from 'lucide-react';

const generalItems = [
  { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard, exact: true },
  { name: 'Risk Alerts', path: '/alerts', icon: Bell },
  { name: 'Transactions', path: '/transactions', icon: DollarSign },
  { name: 'Investigations', path: '/investigations', icon: ClipboardList },
];

const intelligenceItems = [
  { name: 'Relationship Graph', path: '/network', icon: Network },
  { name: 'Behavioral Insights', path: '/behavioral', icon: Activity },
  { name: 'Risk Monitoring', path: '/monitoring', icon: SlidersHorizontal },
  { name: 'Platform Settings', path: '/settings', icon: Settings },
];

const typologyItems = [
  { name: 'Rapid ACH Fanout', count: '4 mules', dotColor: 'bg-amber-500' },
  { name: 'Mule Ring Clusters', count: '18 accounts', dotColor: 'bg-rose-500' },
  { name: 'Layered Shells', count: '6 entities', dotColor: 'bg-blue-500' },
];

export const Sidebar: React.FC = () => {
  const navigate = useNavigate();

  return (
    <aside className="w-64 bg-white border-r border-neutral-100 flex flex-col h-screen select-none z-30 shrink-0">
      {/* Brand & Action Header */}
      <div className="p-6 pb-4">
        <NavLink to="/" className="inline-flex items-center gap-2.5 mb-6 group">
          <div className="w-7 h-7 rounded-lg bg-neutral-900 flex items-center justify-center text-white font-bold text-xs">
            S
          </div>
          <div className="font-bold text-base tracking-widest text-neutral-900">
            SENTINEL
          </div>
        </NavLink>

        {/* Primary Action Button (Matches Reference 'Create new plan' pill) */}
        <button
          onClick={() => navigate('/transactions')}
          className="w-full flex items-center justify-center gap-2 bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-semibold py-3 px-4 rounded-full shadow-sm transition-all active:scale-[0.98]"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Simulate Transaction</span>
        </button>
      </div>

      {/* Nav List */}
      <nav className="flex-1 px-4 space-y-6 overflow-y-auto">
        {/* General Section */}
        <div>
          <div className="px-3 pb-2 text-[11px] font-semibold text-neutral-400 tracking-wider">
            General
          </div>
          <div className="space-y-1">
            {generalItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.exact}
                className={({ isActive }) =>
                  `flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-neutral-100 text-neutral-900 font-semibold'
                      : 'text-neutral-500 hover:text-neutral-900 hover:bg-neutral-50'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <div className="flex items-center gap-3">
                      <item.icon className={`w-4 h-4 ${isActive ? 'text-neutral-900' : 'text-neutral-400'}`} />
                      <span>{item.name}</span>
                    </div>
                    {isActive && <ChevronRight className="w-3.5 h-3.5 text-neutral-400" />}
                  </>
                )}
              </NavLink>
            ))}
          </div>
        </div>

        {/* Intelligence Section */}
        <div>
          <div className="px-3 pb-2 text-[11px] font-semibold text-neutral-400 tracking-wider">
            Intelligence
          </div>
          <div className="space-y-1">
            {intelligenceItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-neutral-100 text-neutral-900 font-semibold'
                      : 'text-neutral-500 hover:text-neutral-900 hover:bg-neutral-50'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <div className="flex items-center gap-3">
                      <item.icon className={`w-4 h-4 ${isActive ? 'text-neutral-900' : 'text-neutral-400'}`} />
                      <span>{item.name}</span>
                    </div>
                    {isActive && <ChevronRight className="w-3.5 h-3.5 text-neutral-400" />}
                  </>
                )}
              </NavLink>
            ))}
          </div>
        </div>

        {/* Active Typologies (Matches Reference 'Your investment plans' section with bullet dots) */}
        <div>
          <div className="px-3 pb-2 text-[11px] font-semibold text-neutral-400 tracking-wider">
            Active Typologies
          </div>
          <div className="space-y-1.5 px-3">
            {typologyItems.map((typ) => (
              <NavLink
                to="/network"
                key={typ.name}
                className="flex items-center justify-between text-xs text-neutral-600 hover:text-neutral-900 py-1 transition-colors group"
              >
                <div className="flex items-center gap-2">
                  <span className={`w-1.5 h-1.5 rounded-full ${typ.dotColor}`} />
                  <span className="font-normal">{typ.name}</span>
                </div>
                <span className="text-[10px] text-neutral-400 group-hover:text-neutral-600">{typ.count}</span>
              </NavLink>
            ))}
          </div>
        </div>
      </nav>

      {/* Footer / Investigator Profile */}
      <div className="p-4 border-t border-neutral-100 m-2">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-neutral-100 border border-neutral-200 flex items-center justify-center font-bold text-neutral-700 text-xs">
              AM
            </div>
            <div>
              <p className="font-semibold text-neutral-900 leading-tight">Alex Mercer</p>
              <p className="text-[10px] text-neutral-400">Tier-2 AML Desk</p>
            </div>
          </div>
          <NavLink
            to="/login"
            title="Sign out"
            className="p-1.5 text-neutral-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </NavLink>
        </div>
      </div>
    </aside>
  );
};
