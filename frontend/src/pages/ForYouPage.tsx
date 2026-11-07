import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../services/api';
import type { Story } from '../types';
import { StoryListCard } from '../components/stories/StoryListCard';
import { StoryDetailModal } from '../components/stories/StoryDetailModal';
import { Search, Compass } from 'lucide-react';

const CATEGORIES = [
  'All',
  'AI Models',
  'AI Agents',
  'Research & Papers',
  'Open-Source Releases',
  'Developer Tools',
  'Infrastructure & Chips',
];

export const ForYouPage: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedStory, setSelectedStory] = useState<Story | null>(null);

  const { data: stories = [], isLoading, refetch } = useQuery({
    queryKey: ['stories', 'for_you', selectedCategory, searchTerm],
    queryFn: () =>
      api.getStories(
        'for_you',
        selectedCategory === 'All' ? undefined : selectedCategory,
        searchTerm || undefined
      ),
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
      {/* Title */}
      <div className="flex items-center justify-between mb-3">
        <div>
          <h1 className="text-xl font-extrabold font-sans text-slate-900 dark:text-white flex items-center gap-2">
            <Compass className="w-5 h-5 text-brand-rose" />
            <span>Recommended for You</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-brand-mutedDark font-medium mt-0.5">
            Personalized based on your swipe interactions & topic affinities
          </p>
        </div>
      </div>

      {/* Rounded Search Bar */}
      <div className="relative mb-3">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search models, agents, papers..."
          className="w-full pl-10 pr-4 py-2.5 rounded-full bg-white dark:bg-white/[0.04] border border-slate-200/90 dark:border-white/[0.08] focus:border-brand-rose text-xs font-medium text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none transition-colors shadow-sm"
        />
      </div>

      {/* Pill Category Switcher */}
      <div className="flex items-center space-x-1.5 overflow-x-auto pb-2 mb-3 scrollbar-none">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              selectedCategory === cat
                ? 'bg-gradient-to-r from-brand-rose to-brand-coral text-white font-bold shadow-dating-match'
                : 'bg-white dark:bg-white/[0.04] border border-slate-200/90 dark:border-white/[0.08] text-slate-600 dark:text-brand-mutedDark hover:text-slate-900 dark:hover:text-white shadow-sm'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Stories Feed */}
      {isLoading ? (
        <div className="py-20 text-center text-xs text-slate-500 dark:text-brand-mutedDark font-medium">
          <div className="w-7 h-7 border-2 border-brand-rose border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          Finding your best AI matches...
        </div>
      ) : stories.length === 0 ? (
        <div className="py-16 text-center text-slate-500 dark:text-brand-mutedDark">
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">No stories found in this category.</p>
          <p className="text-xs mt-1">Try another category or trigger a manual scan.</p>
        </div>
      ) : (
        <div className="flex flex-col space-y-1">
          {stories.map((story) => (
            <StoryListCard
              key={story.id}
              story={story}
              onTap={(s) => setSelectedStory(s)}
              onToggleSave={handleToggleSave}
              onOpenSource={(s) => window.open(s.original_url, '_blank')}
            />
          ))}
        </div>
      )}

      {/* Modal */}
      <StoryDetailModal
        story={selectedStory}
        isOpen={!!selectedStory}
        onClose={() => setSelectedStory(null)}
        onToggleSave={(id) => {
          const s = stories.find((item) => item.id === id) || selectedStory;
          if (s) handleToggleSave(s);
        }}
        onOpenSource={(_, url) => window.open(url, '_blank')}
      />
    </div>
  );
};
