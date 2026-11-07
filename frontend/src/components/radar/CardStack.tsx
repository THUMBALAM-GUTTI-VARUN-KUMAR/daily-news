import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import type { Story } from '../../types';
import { RadarCard } from './RadarCard';
import { X, Heart, Bookmark, ExternalLink, Info, RefreshCw, Sparkles } from 'lucide-react';

interface CardStackProps {
  stories: Story[];
  onSwipeRight: (story: Story) => void;
  onSwipeLeft: (story: Story) => void;
  onTap: (story: Story) => void;
  onToggleSave: (story: Story) => void;
  onOpenSource: (story: Story) => void;
  onReload: () => void;
  isLoading: boolean;
}

export const CardStack: React.FC<CardStackProps> = ({
  stories,
  onSwipeRight,
  onSwipeLeft,
  onTap,
  onToggleSave,
  onOpenSource,
  onReload,
  isLoading,
}) => {
  const currentStory = stories[0];

  if (isLoading) {
    return (
      <div className="w-full h-[420px] sm:h-[450px] rounded-4xl bg-white dark:bg-[#131926] border border-slate-200/90 dark:border-white/[0.08] flex flex-col items-center justify-center p-6 text-center shadow-dating-card">
        <div className="relative w-14 h-14 mb-3.5">
          <div className="absolute inset-0 rounded-full border-2 border-brand-rose/20 border-t-brand-rose animate-spin" />
          <div className="absolute inset-2 rounded-full bg-brand-rose/10 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-brand-rose animate-pulse" />
          </div>
        </div>
        <p className="font-sans text-base font-bold text-slate-900 dark:text-white tracking-tight">
          Matching You with AI Breakthroughs...
        </p>
        <p className="text-xs text-slate-500 dark:text-slate-400 font-normal mt-1 max-w-xs leading-relaxed">
          Screening 13+ verified first-party feeds and computing personalized compatibility vectors.
        </p>
      </div>
    );
  }

  if (!stories || stories.length === 0) {
    return (
      <div className="w-full h-[420px] sm:h-[450px] rounded-4xl bg-white dark:bg-[#131926] border border-slate-200/90 dark:border-white/[0.08] flex flex-col items-center justify-center p-6 text-center shadow-dating-card">
        <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-brand-rose to-brand-coral flex items-center justify-center mb-3.5 shadow-dating-match">
          <Sparkles className="w-7 h-7 text-white fill-white" />
        </div>
        <h3 className="font-sans text-lg font-black text-slate-900 dark:text-white tracking-tight">
          You're All Caught Up!
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xs leading-relaxed">
          You've reviewed all fresh discoveries. The autonomous radar scans every 10 minutes for new releases.
        </p>
        <button
          onClick={onReload}
          className="mt-4 flex items-center space-x-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-brand-rose to-brand-coral text-white font-bold text-xs transition-all active:scale-95 shadow-dating-match cursor-pointer"
        >
          <RefreshCw className="w-4 h-4 stroke-[2.5]" />
          <span>Reload Radar Deck</span>
        </button>
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col items-center">
      {/* 3D Stack Deck Container */}
      <div className="relative w-full h-[420px] sm:h-[445px]">
        <AnimatePresence>
          {stories.slice(0, 3).map((story, index) => {
            const isFront = index === 0;
            return (
              <motion.div
                key={story.id}
                initial={{ scale: 0.94 - index * 0.05, y: index * 10, opacity: 0 }}
                animate={{
                  scale: 1 - index * 0.04,
                  y: index * 8,
                  opacity: 1 - index * 0.18,
                  zIndex: 30 - index,
                }}
                exit={{
                  x: 320,
                  opacity: 0,
                  transition: { duration: 0.22 },
                }}
                transition={{ type: 'spring', damping: 26, stiffness: 260 }}
                className="absolute inset-0"
              >
                <RadarCard
                  story={story}
                  isFront={isFront}
                  onSwipeRight={onSwipeRight}
                  onSwipeLeft={onSwipeLeft}
                  onTap={onTap}
                  onToggleSave={onToggleSave}
                  onOpenSource={onOpenSource}
                />
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Schmooze-style Unified Floating Action Dock */}
      {currentStory && (
        <div className="mt-3.5 px-4 py-2 rounded-full bg-white dark:bg-[#131926] border border-slate-200/90 dark:border-white/10 shadow-[0_10px_30px_-5px_rgba(15,23,42,0.1)] flex items-center justify-between gap-3">
          {/* Dislike / Pass Button */}
          <button
            onClick={() => onSwipeLeft(currentStory)}
            className="w-11 h-11 rounded-full bg-slate-100 dark:bg-white/5 hover:bg-red-50 dark:hover:bg-red-950/30 text-slate-500 hover:text-red-500 flex items-center justify-center transition-all hover:scale-110 active:scale-95 cursor-pointer shadow-sm"
            title="Pass (Swipe Left)"
          >
            <X className="w-5 h-5 stroke-[2.5]" />
          </button>

          {/* Bookmark Button */}
          <button
            onClick={() => onToggleSave(currentStory)}
            className={`w-10 h-10 rounded-full flex items-center justify-center transition-all hover:scale-110 active:scale-95 cursor-pointer shadow-sm ${
              currentStory.is_saved
                ? 'bg-brand-rose/15 text-brand-rose border border-brand-rose/30'
                : 'bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
            title="Save / Bookmark"
          >
            <Bookmark className={`w-4 h-4 ${currentStory.is_saved ? 'fill-brand-rose' : ''}`} />
          </button>

          {/* Details / Info Button */}
          <button
            onClick={() => onTap(currentStory)}
            className="w-10 h-10 rounded-full bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white flex items-center justify-center transition-all hover:scale-110 active:scale-95 cursor-pointer shadow-sm"
            title="Full Story Details"
          >
            <Info className="w-4 h-4" />
          </button>

          {/* Direct Source Link Button */}
          <button
            onClick={() => onOpenSource(currentStory)}
            className="w-10 h-10 rounded-full bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-slate-400 hover:text-brand-blue flex items-center justify-center transition-all hover:scale-110 active:scale-95 cursor-pointer shadow-sm"
            title="Open Original Source"
          >
            <ExternalLink className="w-4 h-4" />
          </button>

          {/* Match / Interested Button */}
          <button
            onClick={() => onSwipeRight(currentStory)}
            className="w-12 h-12 rounded-full bg-gradient-to-tr from-brand-rose to-brand-coral hover:from-brand-roseHover hover:to-brand-rose text-white flex items-center justify-center shadow-dating-match hover:scale-110 active:scale-95 transition-all cursor-pointer"
            title="Interested (Swipe Right)"
          >
            <Heart className="w-5 h-5 fill-white" />
          </button>
        </div>
      )}
    </div>
  );
};
