import React from 'react';
import type { RadarStats } from '../../types';

interface RadarHUDProps {
  stats?: RadarStats;
  isLoading?: boolean;
}

export const RadarHUD: React.FC<RadarHUDProps> = ({ stats }) => {
  const formatTimeAgo = (dateStr?: string | null) => {
    if (!dateStr) return 'Just now';
    try {
      const date = new Date(dateStr);
      const diffSec = Math.floor((Date.now() - date.getTime()) / 1000);
      if (diffSec < 60) return `${diffSec}s ago`;
      if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
      return `${Math.floor(diffSec / 3600)}h ago`;
    } catch {
      return 'Recently';
    }
  };

  return (
    <div className="w-full relative bg-white dark:bg-[#131926] rounded-full px-3.5 py-1.5 mb-2.5 border border-slate-200/90 dark:border-white/[0.08] shadow-sm flex items-center justify-between">
      {/* Left: Active Radar Status Indicator */}
      <div className="flex items-center space-x-2">
        <div className="relative flex h-2.5 w-2.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-rose opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-brand-rose"></span>
        </div>

        <div className="flex items-center space-x-1.5">
          <span className="text-[11px] font-black text-slate-900 dark:text-white tracking-wider uppercase">
            Radar Active
          </span>
          <span className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold">
            • {stats?.active_sources_count ?? 13} Feeds
          </span>
        </div>
      </div>

      {/* Right: Compatibility Precision & Recency */}
      <div className="flex items-center space-x-2 text-[10px]">
        <div className="flex items-center space-x-1 px-2 py-0.5 rounded-full bg-brand-rose/10 border border-brand-rose/25 text-brand-rose font-bold">
          <span>⚡</span>
          <span>High Signal</span>
        </div>
        <span className="text-slate-400 dark:text-slate-500 hidden xs:inline font-medium">
          {formatTimeAgo(stats?.last_scan_time)}
        </span>
      </div>
    </div>
  );
};
