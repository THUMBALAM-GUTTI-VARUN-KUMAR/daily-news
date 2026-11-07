import React, { useState, useEffect } from 'react';
import { Sparkles, RefreshCw, Sun, Moon } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../services/api';

export const Header: React.FC = () => {
  const queryClient = useQueryClient();
  const [isDark, setIsDark] = useState<boolean>(() => {
    return localStorage.getItem('ai_radar_theme') === 'dark';
  });

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('ai_radar_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('ai_radar_theme', 'light');
    }
  }, [isDark]);

  const toggleTheme = () => {
    setIsDark(!isDark);
  };

  const scanMutation = useMutation({
    mutationFn: api.triggerScan,
    onSuccess: () => {
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ['radar-feed'] });
        queryClient.invalidateQueries({ queryKey: ['radar-stats'] });
        queryClient.invalidateQueries({ queryKey: ['stories'] });
      }, 1500);
    },
  });

  return (
    <header 
      className="sticky top-0 z-40 w-full glass-surface border-b border-slate-200/80 dark:border-white/[0.06] px-4 pb-2.5 transition-colors"
      style={{
        paddingTop: 'max(14px, calc(env(safe-area-inset-top, 0px) + 8px))',
      }}
    >
      <div className="max-w-md mx-auto flex items-center justify-between">
        {/* Brand Profile Pill */}
        <div className="flex items-center space-x-2.5">
          <div className="relative flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-tr from-brand-rose to-brand-coral shadow-dating-match">
            <Sparkles className="w-4 h-4 text-white fill-white" />
            <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-rose opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-rose"></span>
            </span>
          </div>
          <div>
            <div className="flex items-center space-x-1.5">
              <span className="text-sm font-extrabold tracking-tight text-slate-900 dark:text-white">
                AI RADAR
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-brand-rose/10 text-brand-rose font-bold">
                Daily AI
              </span>
            </div>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
              Varun Foundry
            </p>
          </div>
        </div>

        {/* Right Controls: Theme Toggle + Scan Button */}
        <div className="flex items-center space-x-2">
          <button
            onClick={toggleTheme}
            className="p-2 rounded-full bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
            title={isDark ? 'Switch to Attractive White Mode' : 'Switch to Dark Mode'}
          >
            {isDark ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
          </button>

          <button
            onClick={() => scanMutation.mutate()}
            disabled={scanMutation.isPending}
            className="flex items-center space-x-1.5 text-xs font-semibold px-3.5 py-1.5 rounded-full bg-gradient-to-r from-brand-rose to-brand-coral text-white hover:from-brand-roseHover hover:to-brand-rose transition-all active:scale-95 shadow-dating-match cursor-pointer"
          >
            <RefreshCw className={`w-3 h-3 text-white ${scanMutation.isPending ? 'animate-spin' : ''}`} />
            <span>{scanMutation.isPending ? 'Scanning...' : 'Scan'}</span>
          </button>
        </div>
      </div>
    </header>
  );
};
