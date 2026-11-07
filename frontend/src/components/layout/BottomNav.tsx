import React from 'react';
import { NavLink } from 'react-router-dom';
import { Flame, Compass, Bookmark, Rss, Settings, Layers } from 'lucide-react';

const NAV_ITEMS = [
  { path: '/', label: 'Radar', icon: Layers },
  { path: '/for-you', label: 'For You', icon: Compass },
  { path: '/trending', label: 'Trending', icon: Flame },
  { path: '/saved', label: 'Saved', icon: Bookmark },
  { path: '/sources', label: 'Feeds', icon: Rss },
  { path: '/settings', label: 'Config', icon: Settings },
];

export const BottomNav: React.FC = () => {
  return (
    <nav 
      className="fixed left-0 right-0 z-40 px-2 sm:px-3 pointer-events-none"
      style={{
        bottom: 'max(10px, calc(env(safe-area-inset-bottom, 0px) + 8px))',
      }}
    >
      <div className="max-w-md mx-auto glass-surface rounded-full px-1.5 py-1 border border-slate-200/90 dark:border-white/10 shadow-[0_12px_35px_rgba(15,23,42,0.08)] dark:shadow-[0_12px_35px_rgba(0,0,0,0.6)] flex items-center justify-around pointer-events-auto">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center py-1 px-2 sm:px-2.5 rounded-full transition-all duration-200 min-w-0 ${
                  isActive
                    ? 'bg-gradient-to-r from-brand-rose/15 to-brand-coral/15 text-brand-rose font-extrabold shadow-sm'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon className={`w-3.5 h-3.5 sm:w-4 sm:h-4 transition-transform duration-200 ${isActive ? 'scale-110 text-brand-rose' : ''}`} />
                  <span className="text-[9px] font-semibold tracking-tight mt-0.5 truncate">
                    {item.label}
                  </span>
                </>
              )}
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
};
