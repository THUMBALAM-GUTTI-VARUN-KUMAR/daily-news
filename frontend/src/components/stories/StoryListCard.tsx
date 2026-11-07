import React from 'react';
import type { Story } from '../../types';
import { Bookmark, ExternalLink, Sparkles, Zap, ArrowRight, CheckCircle2 } from 'lucide-react';

interface StoryListCardProps {
  story: Story;
  onTap: (story: Story) => void;
  onToggleSave: (story: Story) => void;
  onOpenSource: (story: Story) => void;
}

export const StoryListCard: React.FC<StoryListCardProps> = ({
  story,
  onTap,
  onToggleSave,
  onOpenSource,
}) => {
  const signalMatch = Math.round((story.importance_score || 0.5) * 100);

  return (
    <div
      onClick={() => onTap(story)}
      className="w-full bg-white dark:bg-[#131926] rounded-3xl p-4 border border-slate-200/90 dark:border-white/[0.08] hover:border-brand-rose/40 transition-all cursor-pointer group mb-3 shadow-[0_4px_20px_rgba(15,23,42,0.04)] dark:shadow-[0_4px_20px_rgba(0,0,0,0.3)]"
    >
      {/* Top category & match badge */}
      <div className="flex items-center justify-between text-[11px] mb-2 font-mono">
        <div className="flex items-center space-x-1.5">
          <span className="px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-white/[0.06] border border-slate-200 dark:border-white/10 text-slate-700 dark:text-white/90 font-bold text-[10px]">
            {story.category}
          </span>
          {story.is_breaking && (
            <span className="px-2 py-0.5 rounded-full bg-amber-50 dark:bg-brand-amber/15 text-amber-700 dark:text-brand-amber border border-amber-200 dark:border-brand-amber/30 text-[10px] font-bold flex items-center gap-1">
              <Zap className="w-2.5 h-2.5 fill-amber-500" /> Breaking
            </span>
          )}
        </div>

        <div className="flex items-center space-x-1 text-brand-rose font-bold text-xs">
          <Sparkles className="w-3 h-3 text-brand-rose" />
          <span>{signalMatch}% Match</span>
        </div>
      </div>

      {/* Source */}
      <div className="flex items-center space-x-1 text-xs text-slate-500 dark:text-brand-mutedDark mb-1">
        <span className="text-slate-800 dark:text-white/80 font-bold">{story.source_name || 'Curated'}</span>
        <CheckCircle2 className="w-3 h-3 text-brand-emerald" />
      </div>

      {/* Headline */}
      <h3 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white group-hover:text-brand-rose transition-colors leading-snug line-clamp-2">
        {story.headline || story.title}
      </h3>

      {/* Summary */}
      <p className="text-xs text-slate-600 dark:text-white/75 mt-1.5 line-clamp-2 leading-relaxed">
        {story.summary}
      </p>

      {/* Why it matters teaser */}
      <div className="mt-2.5 p-2 rounded-xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200/80 dark:border-white/[0.06] flex items-start space-x-1.5">
        <Sparkles className="w-3 h-3 text-brand-rose flex-shrink-0 mt-0.5" />
        <p className="text-[11px] text-slate-800 dark:text-white/90 font-medium line-clamp-1">
          {story.why_it_matters}
        </p>
      </div>

      {/* Footer controls */}
      <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-100 dark:border-white/[0.05] text-[11px]">
        <div className="flex items-center space-x-1.5 font-mono text-slate-500 dark:text-brand-mutedDark text-[10px]">
          <span>{story.read_time_min || 2} min read</span>
          {story.computed_rank !== undefined && (
            <span>• Rank: {Math.round(story.computed_rank * 100)}</span>
          )}
        </div>

        <div className="flex items-center space-x-1.5">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleSave(story);
            }}
            className={`p-1.5 rounded-full border transition-colors cursor-pointer ${
              story.is_saved
                ? 'bg-brand-rose/15 border-brand-rose text-brand-rose'
                : 'bg-slate-100 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-600 dark:text-brand-mutedDark hover:text-slate-900 dark:hover:text-white'
            }`}
            title="Save"
          >
            <Bookmark className={`w-3.5 h-3.5 ${story.is_saved ? 'fill-brand-rose' : ''}`} />
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              onOpenSource(story);
            }}
            className="p-1.5 rounded-full bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-600 dark:text-brand-mutedDark hover:text-brand-blue transition-colors cursor-pointer"
            title="Read Source"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </button>

          <span className="text-brand-rose text-xs font-bold pl-1 flex items-center">
            View <ArrowRight className="w-3 h-3 ml-0.5" />
          </span>
        </div>
      </div>
    </div>
  );
};
