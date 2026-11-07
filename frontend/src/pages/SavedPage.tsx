import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../services/api';
import type { Story } from '../types';
import { StoryListCard } from '../components/stories/StoryListCard';
import { StoryDetailModal } from '../components/stories/StoryDetailModal';
import { Bookmark, Search, Inbox } from 'lucide-react';

export const SavedPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedStory, setSelectedStory] = useState<Story | null>(null);

  const { data: stories = [], isLoading, refetch } = useQuery({
    queryKey: ['stories', 'saved', searchTerm],
    queryFn: () => api.getStories('saved', undefined, searchTerm || undefined),
  });

  const handleToggleSave = async (story: Story) => {
    await api.toggleSaveStory(story.id);
    refetch();
    if (selectedStory && selectedStory.id === story.id) {
      setSelectedStory(null);
    }
  };

  return (
    <div className="w-full flex flex-col flex-1">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div>
          <h1 className="text-xl font-extrabold font-sans text-slate-900 dark:text-white flex items-center gap-2">
            <Bookmark className="w-5 h-5 text-brand-rose fill-brand-rose" />
            <span>Saved Matches</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-brand-mutedDark font-medium mt-0.5">
            Your bookmarked briefings, models and research papers
          </p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative mb-3">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Filter saved items..."
          className="w-full pl-10 pr-4 py-2.5 rounded-full bg-white dark:bg-white/[0.04] border border-slate-200/90 dark:border-white/[0.08] focus:border-brand-rose text-xs font-medium text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none transition-colors shadow-sm"
        />
      </div>

      {/* Feed */}
      {isLoading ? (
        <div className="py-20 text-center text-xs text-slate-500 dark:text-brand-mutedDark font-medium">
          <div className="w-7 h-7 border-2 border-brand-rose border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          Loading saved stories...
        </div>
      ) : stories.length === 0 ? (
        <div className="py-16 text-center bg-white dark:bg-[#131926] rounded-3xl p-6 border border-slate-200/90 dark:border-white/[0.08] my-auto shadow-sm">
          <Inbox className="w-10 h-10 text-slate-400 dark:text-brand-mutedDark mx-auto mb-2 opacity-50 stroke-[1.5]" />
          <h3 className="text-sm font-bold text-slate-800 dark:text-white">No Saved Matches</h3>
          <p className="text-xs text-slate-500 dark:text-brand-mutedDark mt-1 max-w-xs mx-auto">
            Tap the bookmark button on any radar card to save it for your collection.
          </p>
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
