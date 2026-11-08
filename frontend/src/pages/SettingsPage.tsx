import React, { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import { storage } from '../utils/storage';
import { 
  Settings, 
  Key, 
  Clock, 
  RotateCcw, 
  Check, 
  Cpu, 
  Smartphone, 
  Eye, 
  EyeOff, 
  CheckCircle2, 
  AlertCircle,
  Zap,
  ShieldCheck
} from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [apiKey, setApiKey] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [apiHost, setApiHost] = useState('');
  const [intervalMin, setIntervalMin] = useState(10);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'synced' | 'local_only' | null>(null);
  
  // Key verification states
  const [isTestingKey, setIsTestingKey] = useState(false);
  const [testResult, setTestResult] = useState<{ valid: boolean; message: string } | null>(null);
  const [autoSavedBadge, setAutoSavedBadge] = useState(false);

  const { data: appSettings, isLoading } = useQuery({
    queryKey: ['settings'],
    queryFn: api.getSettings,
    retry: 1,
  });

  // Load persistently stored key and host from native SharedPreferences / localStorage
  useEffect(() => {
    storage.get('ai_radar_gemini_api_key').then((storedKey) => {
      if (storedKey) {
        setApiKey(storedKey);
      }
    });

    storage.get('ai_radar_api_host').then((storedHost) => {
      if (storedHost) {
        setApiHost(storedHost);
      }
    });
  }, []);

  useEffect(() => {
    if (appSettings) {
      setIntervalMin(appSettings.scan_interval_minutes);
    }
  }, [appSettings]);

  // Instant Auto-Save on every keystroke
  const handleApiKeyChange = (val: string) => {
    setApiKey(val);
    setTestResult(null);
    const trimmed = val.trim();
    if (trimmed) {
      storage.set('ai_radar_gemini_api_key', trimmed);
    } else {
      storage.remove('ai_radar_gemini_api_key');
    }
    setAutoSavedBadge(true);
    setTimeout(() => setAutoSavedBadge(false), 2000);
  };

  const handleApiKeyBlur = () => {
    const trimmed = apiKey.trim();
    if (trimmed) {
      storage.set('ai_radar_gemini_api_key', trimmed);
      // Background sync to backend if online
      api.updateSettings({ gemini_api_key: trimmed }).catch(() => {});
    }
  };

  const handleApiHostChange = (val: string) => {
    setApiHost(val);
    const trimmed = val.trim();
    if (trimmed) {
      storage.set('ai_radar_api_host', trimmed);
    } else {
      storage.remove('ai_radar_api_host');
    }
  };

  const handleTestKey = async () => {
    const keyToTest = apiKey.trim();
    if (!keyToTest) {
      setTestResult({ valid: false, message: 'Please enter an API key first.' });
      return;
    }
    setIsTestingKey(true);
    setTestResult(null);
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(keyToTest)}`
      );
      if (res.ok) {
        setTestResult({ valid: true, message: 'Google Gemini API key verified successfully! Saved to device.' });
        // Guarantee key is saved
        await storage.set('ai_radar_gemini_api_key', keyToTest);
        api.updateSettings({ gemini_api_key: keyToTest }).catch(() => {});
        queryClient.invalidateQueries({ queryKey: ['settings'] });
      } else {
        const data = await res.json().catch(() => ({}));
        const errDetail = data?.error?.message || `HTTP ${res.status} error`;
        setTestResult({ valid: false, message: `Key verification failed: ${errDetail}` });
      }
    } catch (err: any) {
      setTestResult({ valid: false, message: `Network error verifying key: ${err?.message || 'Check connection'}` });
    } finally {
      setIsTestingKey(false);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveStatus(null);

    const trimmedKey = apiKey.trim();
    const trimmedHost = apiHost.trim();

    // 1. Immediately store in native Android SharedPreferences + localStorage
    if (trimmedKey) {
      await storage.set('ai_radar_gemini_api_key', trimmedKey);
    } else {
      await storage.remove('ai_radar_gemini_api_key');
    }

    if (trimmedHost) {
      await storage.set('ai_radar_api_host', trimmedHost);
    } else {
      await storage.remove('ai_radar_api_host');
    }

    // 2. Also sync to backend if reachable
    try {
      await api.updateSettings({
        scan_interval_minutes: Number(intervalMin),
        gemini_api_key: trimmedKey || undefined,
      });
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      setSaveStatus('synced');
    } catch (err) {
      console.warn('Backend sync warning (persisted locally on device):', err);
      // Even if backend is currently unreachable, the key is 100% saved locally on device!
      setSaveStatus('local_only');
    } finally {
      setIsSaving(false);
      setTimeout(() => setSaveStatus(null), 4000);
    }
  };

  const handleClearKey = async () => {
    setApiKey('');
    setTestResult(null);
    await storage.remove('ai_radar_gemini_api_key');
    try {
      await api.updateSettings({ gemini_api_key: '' });
      queryClient.invalidateQueries({ queryKey: ['settings'] });
    } catch {
      // ignore
    }
  };

  const isConfigured = Boolean(apiKey.trim() || appSettings?.gemini_configured);

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

      {/* Save Success Banner */}
      {saveStatus === 'synced' && (
        <div className="mb-4 p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 flex items-center space-x-2.5 text-emerald-800 dark:text-emerald-200 animate-in fade-in slide-in-from-top duration-300">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <p className="text-xs font-semibold">
            API key & settings saved locally and synced with Varun Foundry backend!
          </p>
        </div>
      )}

      {saveStatus === 'local_only' && (
        <div className="mb-4 p-3.5 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/60 flex items-center space-x-2.5 text-blue-800 dark:text-blue-200 animate-in fade-in slide-in-from-top duration-300">
          <ShieldCheck className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
          <p className="text-xs font-semibold">
            API key saved securely on your device! Ready for mobile scanning.
          </p>
        </div>
      )}

      {isLoading && !apiKey ? (
        <div className="py-20 text-center text-xs text-slate-500 dark:text-brand-mutedDark font-medium">
          <div className="w-7 h-7 border-2 border-brand-rose border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          Loading configuration...
        </div>
      ) : (
        <form onSubmit={handleSaveSettings} className="space-y-3.5 text-xs">
          {/* Gemini AI Intelligence Key */}
          <div className="p-4 rounded-3xl bg-white dark:bg-[#131926] border border-slate-200/90 dark:border-white/[0.08] shadow-sm">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center space-x-2 text-slate-900 dark:text-white font-bold">
                <Key className="w-4 h-4 text-brand-rose" />
                <span>Google Gemini API Key</span>
              </div>
              <span
                className={`text-[10px] px-2.5 py-0.5 rounded-full border font-bold flex items-center gap-1 ${
                  isConfigured
                    ? 'bg-emerald-50 dark:bg-brand-rose/10 border-emerald-200 dark:border-brand-rose/30 text-emerald-700 dark:text-brand-rose'
                    : 'bg-amber-50 dark:bg-brand-amber/10 border-amber-200 dark:border-brand-amber/30 text-amber-700 dark:text-brand-amber'
                }`}
              >
                {isConfigured ? (
                  <>
                    <Check className="w-3 h-3 text-emerald-600" />
                    <span>Stored & Active</span>
                  </>
                ) : (
                  'Heuristics Mode'
                )}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-brand-mutedDark mb-3 font-normal">
              Stored persistently in native device memory and database for autonomous classification and 3-sentence briefings.
            </p>
            
            {/* Input with Show/Hide toggle and Clear */}
            <div className="relative mb-2.5">
              <input
                type={showApiKey ? 'text' : 'password'}
                placeholder={isConfigured ? 'Paste your Gemini API key (starts with AIzaSy...)' : 'Paste API Key (starts with AIzaSy...)'}
                value={apiKey}
                onChange={(e) => handleApiKeyChange(e.target.value)}
                onBlur={handleApiKeyBlur}
                className="w-full pl-3.5 pr-20 py-2.5 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-brand-rose font-mono shadow-sm"
              />
              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center space-x-1">
                {apiKey && (
                  <button
                    type="button"
                    onClick={handleClearKey}
                    className="p-1 rounded-md text-slate-400 hover:text-red-500 transition-colors"
                    title="Clear key"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setShowApiKey(!showApiKey)}
                  className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white transition-colors cursor-pointer"
                  title={showApiKey ? 'Hide Key' : 'Show Key'}
                >
                  {showApiKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            {/* Test Connection Button */}
            <div className="flex items-center justify-between pt-1">
              <button
                type="button"
                onClick={handleTestKey}
                disabled={isTestingKey || !apiKey.trim()}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-full bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/15 text-slate-700 dark:text-slate-200 text-[11px] font-semibold transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
              >
                {isTestingKey ? (
                  <>
                    <div className="w-3 h-3 border-2 border-brand-rose border-t-transparent rounded-full animate-spin" />
                    <span>Verifying...</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-3 h-3 text-brand-rose" />
                    <span>Test API Key</span>
                  </>
                )}
              </button>

              <span className={`text-[10px] font-medium transition-all ${autoSavedBadge ? 'text-emerald-600 dark:text-emerald-400 font-bold scale-105' : 'text-slate-400'}`}>
                {autoSavedBadge ? '✓ Auto-Saved' : 'Auto-saved on device'}
              </span>
            </div>

            {/* Test Result Message */}
            {testResult && (
              <div
                className={`mt-2.5 p-2.5 rounded-xl text-[11px] flex items-center space-x-2 ${
                  testResult.valid
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-800/50'
                    : 'bg-red-50 dark:bg-red-950/40 text-red-800 dark:text-red-200 border border-red-200 dark:border-red-800/50'
                }`}
              >
                {testResult.valid ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                ) : (
                  <AlertCircle className="w-3.5 h-3.5 text-red-600 shrink-0" />
                )}
                <span>{testResult.message}</span>
              </div>
            )}
          </div>

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

          {/* Mobile App API Host */}
          <div className="p-4 rounded-3xl bg-white dark:bg-[#131926] border border-slate-200/90 dark:border-white/[0.08] shadow-sm">
            <div className="flex items-center space-x-2 text-slate-900 dark:text-white font-bold mb-1">
              <Smartphone className="w-4 h-4 text-brand-rose" />
              <span>Mobile App Backend Server</span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-brand-mutedDark mb-3 font-normal">
              For native Android APK. Defaults to your workstation <code className="font-mono text-brand-rose">http://10.112.33.83:8000</code>.
            </p>
            <input
              type="text"
              placeholder="e.g. http://10.112.33.83:8000"
              value={apiHost}
              onChange={(e) => handleApiHostChange(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-brand-rose font-mono shadow-sm"
            />
          </div>

          {/* System & Architecture Info */}
          <div className="p-4 rounded-3xl bg-white dark:bg-[#131926] border border-slate-200/90 dark:border-white/[0.08] space-y-2 shadow-sm">
            <div className="flex items-center space-x-2 text-slate-900 dark:text-white font-bold mb-1">
              <Cpu className="w-4 h-4 text-brand-rose" />
              <span>System & Hardware Architecture</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200/80 dark:border-white/5">
                <span className="text-slate-400 dark:text-brand-mutedDark block text-[9px] uppercase font-bold tracking-wider">
                  Organization
                </span>
                <span className="font-semibold text-slate-900 dark:text-white">
                  {appSettings?.organization || 'Varun Foundry'}
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200/80 dark:border-white/5">
                <span className="text-slate-400 dark:text-brand-mutedDark block text-[9px] uppercase font-bold tracking-wider">
                  AI Model
                </span>
                <span className="font-semibold text-slate-900 dark:text-white">
                  {appSettings?.gemini_model || 'gemini-2.5-flash'}
                </span>
              </div>
            </div>
          </div>

          {/* Save Action Button */}
          <button
            type="submit"
            disabled={isSaving}
            className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-brand-rose to-brand-coral hover:from-brand-roseHover hover:to-brand-rose text-white font-bold text-sm shadow-dating-match active:scale-98 transition-all flex items-center justify-center space-x-2 cursor-pointer"
          >
            {isSaving ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : saveStatus ? (
              <>
                <Check className="w-4 h-4 stroke-[3]" />
                <span>Saved Successfully!</span>
              </>
            ) : (
              <span>Save Configuration</span>
            )}
          </button>
        </form>
      )}
    </div>
  );
};

export default SettingsPage;
