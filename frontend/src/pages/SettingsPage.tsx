import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import { Settings, Key, Clock, RotateCcw, Check, Sparkles, Cpu, Smartphone } from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [apiKey, setApiKey] = useState('');
  const [apiHost, setApiHost] = useState(() => localStorage.getItem('ai_radar_api_host') || '');
  const [intervalMin, setIntervalMin] = useState(10);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const { data: appSettings, isLoading } = useQuery({
    queryKey: ['settings'],
    queryFn: api.getSettings,
  });

  useEffect(() => {
    if (appSettings) {
      setIntervalMin(appSettings.scan_interval_minutes);
    }
  }, [appSettings]);

  const updateMutation = useMutation({
    mutationFn: api.updateSettings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
    },
  });

  const resetMutation = useMutation({
    mutationFn: api.resetAffinities,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      queryClient.invalidateQueries({ queryKey: ['radar-stats'] });
      queryClient.invalidateQueries({ queryKey: ['stories'] });
      alert('Personalization topic affinities reset to baseline.');
    },
  });

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    if (apiHost) {
      localStorage.setItem('ai_radar_api_host', apiHost.trim());
    } else {
      localStorage.removeItem('ai_radar_api_host');
    }
    updateMutation.mutate({
      scan_interval_minutes: Number(intervalMin),
      gemini_api_key: apiKey ? apiKey : undefined,
    });
  };

  return (
    <div className="w-full flex flex-col flex-1 pb-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-extrabold font-sans text-slate-900 dark:text-white flex items-center gap-2">
            <Settings className="w-5 h-5 text-brand-rose" />
            <span>Preferences & Settings</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-brand-mutedDark font-medium mt-0.5">
            Varun Foundry • Autonomous AI Radar
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="py-20 text-center text-xs text-slate-500 dark:text-brand-mutedDark font-medium">
          <div className="w-7 h-7 border-2 border-brand-rose border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          Loading configuration...
        </div>
      ) : (
        <form onSubmit={handleSaveSettings} className="space-y-3.5 text-xs">
          {/* Pipeline Scan Interval */}
          <div className="p-4 rounded-3xl bg-white dark:bg-[#131926] border border-slate-200/90 dark:border-white/[0.08] shadow-sm">
            <div className="flex items-center space-x-2 text-slate-900 dark:text-white font-bold mb-1">
              <Clock className="w-4 h-4 text-brand-rose" />
              <span>Background Scan Interval</span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-brand-mutedDark mb-3 font-normal">
              Cadence for discovering fresh first-party blogs and releases.
            </p>
            <div className="flex items-center space-x-4">
              <input
                type="range"
                min="3"
                max="60"
                step="1"
                value={intervalMin}
                onChange={(e) => setIntervalMin(Number(e.target.value))}
                className="flex-1 accent-brand-rose bg-slate-200 dark:bg-white/10 h-2 rounded-lg cursor-pointer"
              />
              <span className="px-3.5 py-1.5 rounded-full bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-brand-rose font-mono font-bold min-w-[70px] text-center">
                {intervalMin} min
              </span>
            </div>
          </div>

          {/* Gemini AI Intelligence Key */}
          <div className="p-4 rounded-3xl bg-white dark:bg-[#131926] border border-slate-200/90 dark:border-white/[0.08] shadow-sm">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center space-x-2 text-slate-900 dark:text-white font-bold">
                <Key className="w-4 h-4 text-brand-rose" />
                <span>Google Gemini API Key</span>
              </div>
              <span
                className={`text-[10px] px-2.5 py-0.5 rounded-full border font-bold ${
                  appSettings?.gemini_configured
                    ? 'bg-emerald-50 dark:bg-brand-rose/10 border-emerald-200 dark:border-brand-rose/30 text-emerald-700 dark:text-brand-rose'
                    : 'bg-amber-50 dark:bg-brand-amber/10 border-amber-200 dark:border-brand-amber/30 text-amber-700 dark:text-brand-amber'
                }`}
              >
                {appSettings?.gemini_configured ? 'Active' : 'Heuristics'}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-brand-mutedDark mb-3 font-normal">
              Synthesizes 3-sentence briefings and computes 11-category classification after collection.
            </p>
            <input
              type="password"
              placeholder={appSettings?.gemini_configured ? '••••••••••••••••••••••••••••••' : 'Paste API Key'}
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-brand-rose font-mono shadow-sm"
            />
          </div>

          {/* Mobile App API Host */}
          <div className="p-4 rounded-3xl bg-white dark:bg-[#131926] border border-slate-200/90 dark:border-white/[0.08] shadow-sm">
            <div className="flex items-center space-x-2 text-slate-900 dark:text-white font-bold mb-1">
              <Smartphone className="w-4 h-4 text-brand-rose" />
              <span>Mobile App Backend Server</span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-brand-mutedDark mb-3 font-normal">
              For native iOS / Android APK. Enter your computer's local network IP or production URL (e.g. http://192.168.1.100:8000). Leave empty for web default.
            </p>
            <input
              type="text"
              placeholder="e.g. http://192.168.1.100:8000"
              value={apiHost}
              onChange={(e) => setApiHost(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-brand-rose font-mono shadow-sm"
            />
          </div>

          {/* Learned Topic Affinities */}
          <div className="p-4 rounded-3xl bg-white dark:bg-[#131926] border border-slate-200/90 dark:border-white/[0.08] shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2 text-slate-900 dark:text-white font-bold">
                <Sparkles className="w-4 h-4 text-brand-rose" />
                <span>Learned Topic Interests</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (confirm('Reset your learned recommendations to baseline?')) {
                    resetMutation.mutate();
                  }
                }}
                className="flex items-center space-x-1 text-[10px] text-slate-500 hover:text-red-500 transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset</span>
              </button>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-brand-mutedDark mb-3 font-normal">
              Tuned by your swipes: Right (+1.5), Save (+3.0), Read Source (+2.0), Left (-0.5).
            </p>

            {appSettings?.top_interested_topics && Object.keys(appSettings.top_interested_topics).length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {Object.entries(appSettings.top_interested_topics).map(([topic, weight]) => (
                  <div
                    key={topic}
                    className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center space-x-1.5 ${
                      weight > 0
                        ? 'bg-rose-50 dark:bg-brand-rose/10 border border-rose-200 dark:border-brand-rose/30 text-rose-700 dark:text-brand-rose'
                        : 'bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 text-red-600 dark:text-red-400'
                    }`}
                  >
                    <span>{topic}</span>
                    <span className="font-mono font-bold">{weight > 0 ? `+${weight}` : weight}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[11px] text-slate-400 dark:text-brand-mutedDark italic">
                No swipes recorded yet. Swipe cards on RADAR to train your profile.
              </p>
            )}
          </div>

          {/* System & Architecture Info */}
          <div className="p-4 rounded-3xl bg-white dark:bg-[#131926] border border-slate-200/90 dark:border-white/[0.08] space-y-2 shadow-sm">
            <div className="flex items-center space-x-2 text-slate-900 dark:text-white font-bold mb-1">
              <Cpu className="w-4 h-4 text-brand-rose" />
              <span>Engine Details</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100 dark:border-white/5 text-slate-500 dark:text-brand-mutedDark">
              <span>Database</span>
              <span className="text-slate-900 dark:text-white font-mono font-semibold">SQLite WAL Mode</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100 dark:border-white/5 text-slate-500 dark:text-brand-mutedDark">
              <span>Deduplication</span>
              <span className="text-slate-900 dark:text-white font-mono font-semibold">RapidFuzz Entity & Token Set</span>
            </div>
            <div className="flex justify-between py-1 text-slate-500 dark:text-brand-mutedDark">
              <span>Ranking</span>
              <span className="text-slate-900 dark:text-white font-mono font-semibold">40% Imp + 30% User + 20% Rec + 10% Nov</span>
            </div>
          </div>

          {/* Submit button */}
          <button
            type="submit"
            disabled={updateMutation.isPending}
            className="w-full py-3.5 rounded-full bg-gradient-to-r from-brand-rose to-brand-coral hover:from-brand-roseHover hover:to-brand-rose text-white font-extrabold text-xs transition-all flex items-center justify-center space-x-2 shadow-dating-match active:scale-95 cursor-pointer"
          >
            {saveSuccess ? (
              <>
                <Check className="w-4 h-4" />
                <span>Preferences Saved</span>
              </>
            ) : (
              <span>Save Preferences</span>
            )}
          </button>
        </form>
      )}
    </div>
  );
};
