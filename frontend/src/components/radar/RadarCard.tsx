import React, { useRef } from 'react';
import { motion, useMotionValue, useTransform } from 'framer-motion';
import type { Story } from '../../types';
import { ArrowRight, Zap, CheckCircle2, Heart, X as XIcon, Building2 } from 'lucide-react';
import { getStoryVisualTheme } from '../../utils/visuals';

interface RadarCardProps {
  story: Story;
  isFront: boolean;
  onSwipeRight: (story: Story) => void;
  onSwipeLeft: (story: Story) => void;
  onTap: (story: Story) => void;
  onToggleSave: (story: Story) => void;
  onOpenSource: (story: Story) => void;
}

export const RadarCard: React.FC<RadarCardProps> = ({
  story,
  isFront,
  onSwipeRight,
  onSwipeLeft,
  onTap,
}) => {
  const isDragging = useRef(false);
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-12, 12]);
  const opacity = useTransform(x, [-200, -100, 0, 100, 200], [0.7, 1, 1, 1, 0.7]);

  // Schmooze-style Swipe Feedback Stamps
  const likeOpacity = useTransform(x, [20, 85], [0, 1]);
  const passOpacity = useTransform(x, [-20, -85], [0, 1]);

  const handleDragStart = () => {
    isDragging.current = true;
  };

  const handleDragEnd = (_: any, info: any) => {
    const threshold = 75;
    if (info.offset.x > threshold) {
      onSwipeRight(story);
    } else if (info.offset.x < -threshold) {
      onSwipeLeft(story);
    }
    setTimeout(() => {
      isDragging.current = false;
    }, 150);
  };

  const handleCardClick = () => {
    if (!isDragging.current && isFront) {
      onTap(story);
    }
  };

  const signalMatch = Math.round((story.importance_score || 0.5) * 100);
  const theme = getStoryVisualTheme(story.category, story.companies?.[0]);

  return (
    <motion.div
      style={{
        x: isFront ? x : 0,
        rotate: isFront ? rotate : 0,
        opacity: isFront ? opacity : 1,
      }}
      drag={isFront ? 'x' : false}
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.65}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      whileTap={{ cursor: 'grabbing' }}
      className={`absolute inset-0 rounded-4xl flex flex-col justify-between bg-white dark:bg-[#131926] border border-slate-200/90 dark:border-white/[0.09] select-none touch-none overflow-hidden transition-shadow ${
        isFront ? 'cursor-grab shadow-dating-card' : 'pointer-events-none'
      }`}
    >
      {/* 1. TOP HERO SECTION (Schmooze-style Visual Header) */}
      <div
        className={`relative h-[140px] sm:h-[150px] w-full bg-gradient-to-b ${theme.gradient} flex flex-col justify-between p-3.5 sm:p-4 overflow-hidden flex-shrink-0 border-b border-slate-100 dark:border-white/5`}
      >
        {/* Swipe Feedback Badges */}
        {isFront && (
          <>
            <motion.div
              style={{ opacity: likeOpacity }}
              className="absolute top-4 left-4 z-30 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-brand-rose to-brand-coral text-white font-black text-xs tracking-wider uppercase rotate-[-10deg] pointer-events-none shadow-dating-match flex items-center gap-1.5 border border-white"
            >
              <Heart className="w-3.5 h-3.5 fill-white" />
              <span>INTERESTED</span>
            </motion.div>
            <motion.div
              style={{ opacity: passOpacity }}
              className="absolute top-4 right-4 z-30 px-3.5 py-1.5 rounded-full bg-slate-900 text-white font-black text-xs tracking-wider uppercase rotate-[10deg] pointer-events-none shadow-md flex items-center gap-1.5 border border-slate-700"
            >
              <XIcon className="w-3.5 h-3.5 stroke-[3]" />
              <span>PASS</span>
            </motion.div>
          </>
        )}

        {/* Top Badges Row: Category + Schmooze Match Pill */}
        <div className="relative z-10 flex items-center justify-between">
          <span className="px-2.5 py-1 rounded-full bg-white/95 dark:bg-black/60 backdrop-blur-md text-[11px] font-bold text-slate-800 dark:text-white shadow-sm border border-slate-200/60 dark:border-white/10 flex items-center gap-1">
            <span>{theme.emoji}</span>
            <span>{story.category}</span>
          </span>

          <div className="flex items-center space-x-1 px-2.5 py-1 rounded-full bg-white/95 dark:bg-black/60 backdrop-blur-md border border-brand-rose/30 text-slate-900 dark:text-white font-extrabold text-xs shadow-sm">
            <span className="text-brand-rose text-xs">🔥</span>
            <span className="bg-gradient-to-r from-brand-rose to-brand-coral bg-clip-text text-transparent font-black">
              {signalMatch}% Match
            </span>
          </div>
        </div>

        {/* Entity Tag / Emblem Pill */}
        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-white/90 dark:bg-black/60 backdrop-blur-md border border-slate-200/60 dark:border-white/10 text-[11px] font-bold text-slate-800 dark:text-white/90 shadow-sm">
            <Building2 className="w-3.5 h-3.5 text-brand-rose" />
            <span className="truncate max-w-[170px]">{story.companies?.[0] || story.source_name || 'AI Frontier'}</span>
            <CheckCircle2 className="w-3.5 h-3.5 text-brand-emerald fill-brand-emerald/20 ml-0.5 flex-shrink-0" />
          </div>

          {story.is_breaking && (
            <span className="px-2 py-0.5 rounded-full bg-brand-rose text-white text-[10px] font-black uppercase tracking-wider flex items-center gap-1 shadow-sm">
              <Zap className="w-2.5 h-2.5 fill-white" /> Breaking
            </span>
          )}
        </div>
      </div>

      {/* 2. CARD CONTENT SECTION */}
      <div
        onClick={handleCardClick}
        className="p-3.5 sm:p-4 pt-2 flex-1 flex flex-col justify-between cursor-pointer"
      >
        <div className="space-y-1">
          {/* Read time and metadata */}
          <div className="flex items-center space-x-1.5 text-[11px] text-slate-500 dark:text-slate-400 font-medium">
            <span className="font-semibold text-slate-700 dark:text-slate-300 truncate max-w-[130px]">{story.source_name || 'Verified Source'}</span>
            <span>•</span>
            <span>{story.read_time_min || 2} min read</span>
          </div>

          {/* Headline (Punchy, bold typography) */}
          <h3 className="text-sm sm:text-base font-black font-sans text-slate-900 dark:text-white hover:text-brand-rose transition-colors leading-snug line-clamp-2 tracking-tight">
            {story.headline || story.title}
          </h3>

          {/* Summary snippet */}
          <p className="text-xs text-slate-600 dark:text-slate-300 font-normal leading-relaxed line-clamp-2">
            {story.summary}
          </p>
        </div>

        {/* Schmooze Signature "Prompt Card": Vibe Check / Why It Matters */}
        <div className="my-2 p-2.5 rounded-2xl bg-gradient-to-r from-amber-500/[0.06] via-orange-500/[0.04] to-transparent dark:from-white/[0.04] dark:to-transparent border border-amber-500/20 dark:border-white/10 hover:border-brand-rose/40 transition-all shadow-sm">
          <div className="flex items-center space-x-1.5 text-brand-rose text-[10px] font-black tracking-wider uppercase mb-0.5">
            <span>💡</span>
            <span>VIBE CHECK: WHY VARUN CARES</span>
          </div>
          <p className="text-xs text-slate-900 dark:text-white/95 font-semibold leading-relaxed line-clamp-2">
            {story.why_it_matters}
          </p>
        </div>

        {/* Tags Row & Tap Cue */}
        <div className="pt-2 border-t border-slate-100 dark:border-white/[0.06] flex items-center justify-between text-[11px]">
          <div className="flex items-center space-x-1.5 overflow-hidden pr-2">
            {story.technologies && story.technologies.length > 0 && (
              <span className="px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 font-bold text-slate-700 dark:text-brand-roseLight truncate max-w-[120px]">
                #{story.technologies[0]}
              </span>
            )}
            {story.topics && story.topics.length > 0 && (
              <span className="px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 font-bold text-slate-600 dark:text-white/70 truncate max-w-[110px] hidden sm:inline">
                #{story.topics[0]}
              </span>
            )}
          </div>

          <span className="text-brand-rose flex items-center font-bold text-xs flex-shrink-0">
            View Briefing <ArrowRight className="w-3 h-3 ml-0.5 stroke-[2.5]" />
          </span>
        </div>
      </div>
    </motion.div>
  );
};
