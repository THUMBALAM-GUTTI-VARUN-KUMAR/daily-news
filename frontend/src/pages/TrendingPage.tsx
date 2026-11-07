import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../services/api';
import type { Story } from '../types';
import { StoryListCard } from '../components/stories/StoryListCard';
import { StoryDetailModal } from '../components/stories/StoryDetailModal';
import { Flame, TrendingUp } from 'lucide-react';

export const TrendingPage: React.FC = () => {
  const [selectedStory, setSelectedStory] = useState<Story | null>(null);

  const { data: stories = [], isLoading, refetch } = useQuery({
    queryKey: ['stories', 'trending'],
    queryFn: () => api.getStories('trending'),
  });

  const handleToggleSave = async (story: Story) => {
    await api.toggleSaveStory(story.id);
    refetch();
    if (selectedStory && selectedStory.id === story.id) {
      setSelectedStory({ ...selectedStory, is_saved: !selectedStory.is_saved });
    }
  };

  return (
    <div className="w-full flex flex-col flex-1">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-extrabold font-sans text-slate-900 dark:text-white flex items-center gap-2">
            <Flame className="w-5 h-5 text-brand-amber" />
            <span>Popular & Trending</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-brand-mutedDark font-medium mt-0.5">
            Breakthrough models, releases & high-velocity ecosystem news
          </p>
        </div>
      </div>

      {/* Feed */}
      {isLoading ? (
        <div className="py-20 text-center text-xs text-slate-500 dark:text-brand-mutedDark font-medium">
          <div className="w-7 h-7 border-2 border-brand-amber border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          Filtering high-velocity discoveries...
        </div>
      ) : stories.length === 0 ? (
        <div className="py-16 text-center bg-white dark:bg-[#131926] rounded-3xl p-6 border border-slate-200/90 dark:border-white/[0.08] my-auto shadow-sm">
          <TrendingUp className="w-8 h-8 text-slate-400 dark:text-brand-mutedDark mx-auto mb-2 opacity-60" />
          <p className="text-sm font-bold text-slate-800 dark:text-white">No trending stories yet</p>
          <p className="text-xs text-slate-500 dark:text-brand-mutedDark mt-1">Run a scan to pull latest developments.</p>
        </div>
      ) : (
        <div className="flex flex-col">
          {stories.map((story) => (
            <StoryListCard
              key={story.id}
              story={story}
              onTap={setSelectedStory}
              onToggleSave={handleToggleSave}
              onOpenSource={(s) => {
                api.recordInteraction(s.id, 'source_open');
                window.open(s.original_url, '_blank', 'noopener,noreferrer');
              }}
            />
          ))}
        </div>
      )}

      {/* Story Detail Sheet */}
      <StoryDetailModal
        story={selectedStory}
        isOpen={!!selectedStory}
        onClose={() => setSelectedStory(null)}
        onToggleSave={(id) => {
          const s = stories.find((item) => item.id === id) || selectedStory;
          if (s) handleToggleSave(s);
        }}
        onOpenSource={(id, url) => {
          api.recordInteraction(id, 'source_open');
          window.open(url, '_blank', 'noopener,noreferrer');
        }}
      />
    </div>
  );
};
