import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ExternalLink, Bookmark, Sparkles, Building2, Cpu, Zap, CheckCircle2 } from 'lucide-react';
import type { Story } from '../../types';

interface StoryDetailModalProps {
  story: Story | null;
  isOpen: boolean;
  onClose: () => void;
  onToggleSave: (storyId: number) => void;
  onOpenSource: (storyId: number, url: string) => void;
}

export const StoryDetailModal: React.FC<StoryDetailModalProps> = ({
  story,
  isOpen,
  onClose,
  onToggleSave,
  onOpenSource,
}) => {
  if (!story) return null;

  const signalMatch = Math.round((story.importance_score || 0.5) * 100);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 dark:bg-black/80 backdrop-blur-md">
          {/* Backdrop click */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ y: '100%', opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            className="relative w-full max-w-md max-h-[88vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl bg-white dark:bg-[#0E1422] border border-slate-200/90 dark:border-white/10 p-5 shadow-2xl z-10 flex flex-col"
          >
            {/* Grab handle for mobile */}
            <div className="w-12 h-1.5 bg-slate-300 dark:bg-white/20 rounded-full mx-auto mb-4 sm:hidden" />

            {/* Header info */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="px-3 py-1 rounded-full bg-brand-rose/10 text-brand-rose border border-brand-rose/25 text-xs font-bold">
                  {story.category}
                </span>
                {story.is_breaking && (
                  <span className="px-2 py-0.5 rounded-full bg-brand-amber/10 text-brand-amber border border-brand-amber/30 text-xs font-bold flex items-center gap-1">
                    <Zap className="w-3 h-3 fill-brand-amber" /> Breaking
                  </span>
                )}
              </div>

              <button
                onClick={onClose}
                className="p-1.5 rounded-full bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Source & Verified Status */}
            <div className="flex items-center space-x-1.5 text-xs text-slate-500 dark:text-slate-400 font-medium mt-3">
              <span className="text-slate-900 dark:text-white font-bold">{story.source_name || 'Verified Source'}</span>
              <CheckCircle2 className="w-3.5 h-3.5 text-brand-emerald fill-brand-emerald/20" />
              <span>•</span>
              <span className="text-brand-rose font-bold">{signalMatch}% Compatibility Match</span>
            </div>

            {/* Headline */}
            <h2 className="text-xl font-extrabold font-sans text-slate-900 dark:text-white mt-2 leading-snug tracking-tight">
              {story.headline || story.title}
            </h2>

            {/* Match Telemetry Bars */}
            <div className="grid grid-cols-3 gap-2 my-4 p-3 rounded-2xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200/80 dark:border-white/[0.06] text-center font-mono">
              <div>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-semibold">Signal</span>
                <p className="text-sm font-extrabold text-brand-rose mt-0.5">
                  {signalMatch}%
                </p>
              </div>
              <div className="border-x border-slate-200 dark:border-white/5">
                <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-semibold">Novelty</span>
                <p className="text-sm font-extrabold text-slate-800 dark:text-white mt-0.5">
                  {Math.round((story.novelty_score || 0.5) * 100)}%
                </p>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-semibold">Depth</span>
                <p className="text-sm font-extrabold text-slate-800 dark:text-white mt-0.5">
                  {Math.round((story.technical_score || 0.5) * 100)}%
                </p>
              </div>
            </div>

            {/* Why it matters callout */}
            <div className="p-4 rounded-2xl bg-gradient-to-br from-brand-rose/10 via-brand-coral/5 to-transparent border border-brand-rose/25 mb-4 shadow-sm">
              <div className="flex items-center space-x-1.5 text-brand-rose text-xs font-bold mb-1">
                <Sparkles className="w-4 h-4 text-brand-rose fill-brand-rose/20" />
                <span className="tracking-wide uppercase font-extrabold">Why Varun Should Care</span>
              </div>
              <p className="text-sm text-slate-900 dark:text-white/95 font-medium leading-relaxed">
                {story.why_it_matters}
              </p>
            </div>

            {/* Executive Synthesis Summary */}
            <div className="mb-4">
              <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 font-mono">
                Executive Synthesis
              </h4>
              <p className="text-sm text-slate-700 dark:text-slate-200 leading-relaxed bg-slate-50 dark:bg-white/[0.02] p-3.5 rounded-2xl border border-slate-200/80 dark:border-white/[0.05]">
                {story.summary}
              </p>
            </div>

            {/* Entities & Technologies */}
            <div className="space-y-3 mb-6">
              {story.companies && story.companies.length > 0 && (
                <div>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1 font-mono font-semibold mb-1.5">
                    <Building2 className="w-3.5 h-3.5 text-brand-rose" /> Key Companies
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {story.companies.map((c, i) => (
                      <span
                        key={i}
                        className="px-2.5 py-1 rounded-full bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs font-semibold text-slate-800 dark:text-white/90"
                      >
                        {c}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {story.technologies && story.technologies.length > 0 && (
                <div>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1 font-mono font-semibold mb-1.5">
                    <Cpu className="w-3.5 h-3.5 text-brand-blue" /> Technologies
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {story.technologies.map((t, i) => (
                      <span
                        key={i}
                        className="px-2.5 py-1 rounded-full bg-sky-50 dark:bg-brand-blue/10 border border-sky-200 dark:border-brand-blue/20 text-xs font-semibold text-sky-700 dark:text-brand-blue"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-3 mt-auto pt-4 border-t border-slate-200 dark:border-white/10">
              <button
                onClick={() => onToggleSave(story.id)}
                className={`flex-1 py-3 rounded-2xl font-bold text-xs flex items-center justify-center space-x-2 border transition-all cursor-pointer ${
                  story.is_saved
                    ? 'bg-brand-rose/15 border-brand-rose text-brand-rose shadow-dating-glow'
                    : 'bg-slate-100 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-800 dark:text-white hover:bg-slate-200 dark:hover:bg-white/10'
                }`}
              >
                <Bookmark className={`w-4 h-4 ${story.is_saved ? 'fill-brand-rose' : ''}`} />
                <span>{story.is_saved ? 'Saved in Matches' : 'Save Story'}</span>
              </button>

              <button
                onClick={() => onOpenSource(story.id, story.original_url)}
                className="flex-1 py-3 rounded-2xl bg-gradient-to-r from-brand-rose to-brand-coral hover:from-brand-roseHover hover:to-brand-rose text-white font-bold text-xs flex items-center justify-center space-x-2 transition-all shadow-dating-match cursor-pointer"
              >
                <span>Read Full Source</span>
                <ExternalLink className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
