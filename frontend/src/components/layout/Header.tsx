import React, { useEffect, useState } from 'react';
import { apiService } from '../../services/api';
import { Search, Bell, ChevronDown, DollarSign, TrendingUp } from 'lucide-react';

export const Header: React.FC = () => {
  const [, setBackendOnline] = useState(true);

  useEffect(() => {
    let mounted = true;
    apiService.getHealth()
      .then((res) => {
        if (mounted) setBackendOnline(res.status === 'ok');
      })
      .catch(() => {
        if (mounted) setBackendOnline(false);
      });
    return () => { mounted = false; };
  }, []);

  return (
    <header className="h-20 bg-white border-b border-neutral-100 px-8 flex items-center justify-between sticky top-0 z-20">
      {/* Top Left Stats (Matches Reference: £58 356 Value / £5 326 Growth) */}
      <div className="flex items-center gap-8">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-neutral-100 flex items-center justify-center text-neutral-700">
            <DollarSign className="w-4 h-4" />
          </div>
          <div>
            <div className="font-bold text-sm text-neutral-900 leading-tight">$485,200</div>
            <div className="text-[11px] font-medium text-neutral-400">Suspicious Volume</div>
          </div>
        </div>

        <div className="hidden md:flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-neutral-100 flex items-center justify-center text-neutral-700">
            <TrendingUp className="w-4 h-4" />
          </div>
          <div>
            <div className="font-bold text-sm text-neutral-900 leading-tight">+14 Spikes</div>
            <div className="text-[11px] font-medium text-neutral-400">Risk Growth</div>
          </div>
        </div>
      </div>

      {/* Center Search Pill (Matches Reference: Search ETFs... pill) */}
      <div className="relative w-72 lg:w-96">
        <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-4 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          placeholder="Search accounts, txns, alerts..."
          className="w-full bg-[#f4f5f7] border-0 rounded-full pl-10 pr-4 py-2 text-xs text-neutral-800 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-300 transition-all"
        />
      </div>

      {/* Right User & Notification Controls */}
      <div className="flex items-center gap-4">
        {/* Notification Bell */}
        <button
          className="relative w-9 h-9 rounded-full bg-[#f4f5f7] hover:bg-neutral-200/80 flex items-center justify-center text-neutral-600 transition-colors"
          title="Notifications"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-rose-500 rounded-full" />
        </button>

        {/* User Profile Pill (Matches Reference: Annette Black / Investor pill) */}
        <div className="flex items-center gap-3 pl-2 py-1 pr-1.5 cursor-pointer rounded-full hover:bg-neutral-50 transition-colors">
          <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-amber-200 to-amber-100 border border-amber-300 flex items-center justify-center font-bold text-amber-800 text-xs shadow-xs">
            AB
          </div>
          <div className="text-left hidden sm:block">
            <div className="font-semibold text-xs text-neutral-900 leading-tight">Alex Mercer</div>
            <div className="text-[10px] text-neutral-400">AML Investigator</div>
          </div>
          <ChevronDown className="w-3.5 h-3.5 text-neutral-400" />
        </div>
      </div>
    </header>
  );
};
