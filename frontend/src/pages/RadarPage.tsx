import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import type { Story } from '../types';
import { RadarHUD } from '../components/radar/RadarHUD';
import { CardStack } from '../components/radar/CardStack';
import { StoryDetailModal } from '../components/stories/StoryDetailModal';
import { triggerHaptic } from '../utils/native';

export const RadarPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [selectedStory, setSelectedStory] = useState<Story | null>(null);

  // Queries
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['radar-stats'],
    queryFn: api.getRadarStats,
    refetchInterval: 15000,
  });

  const { data: stories = [], isLoading: feedLoading, refetch } = useQuery({
    queryKey: ['radar-feed'],
    queryFn: () => api.getRadarFeed(25),
  });

  // Interaction mutation
  const interactMutation = useMutation({
    mutationFn: ({ storyId, type }: { storyId: number; type: any }) =>
      api.recordInteraction(storyId, type),
    onSuccess: () => {
      // Invalidate stats to reflect updated topic affinities
      queryClient.invalidateQueries({ queryKey: ['radar-stats'] });
    },
  });

  const handleSwipeRight = (story: Story) => {
    triggerHaptic('medium');
    // Optimistically remove from local view
    queryClient.setQueryData(['radar-feed'], (old: Story[] = []) =>
      old.filter((s) => s.id !== story.id)
    );
    interactMutation.mutate({ storyId: story.id, type: 'interested' });
  };

  const handleSwipeLeft = (story: Story) => {
    triggerHaptic('light');
    queryClient.setQueryData(['radar-feed'], (old: Story[] = []) =>
      old.filter((s) => s.id !== story.id)
    );
    interactMutation.mutate({ storyId: story.id, type: 'skip' });
  };

  const handleToggleSave = async (story: Story) => {
    triggerHaptic('success');
    await api.toggleSaveStory(story.id);
    queryClient.setQueryData(['radar-feed'], (old: Story[] = []) =>
      old.map((s) => (s.id === story.id ? { ...s, is_saved: !s.is_saved } : s))
    );
    if (selectedStory && selectedStory.id === story.id) {
      setSelectedStory({ ...selectedStory, is_saved: !selectedStory.is_saved });
    }
  };

  const handleOpenSource = (story: Story) => {
    triggerHaptic('light');
    interactMutation.mutate({ storyId: story.id, type: 'source_open' });
    window.open(story.original_url, '_blank', 'noopener,noreferrer');
  };

  const handleTap = (story: Story) => {
    triggerHaptic('light');
    setSelectedStory(story);
    interactMutation.mutate({ storyId: story.id, type: 'tap_detail' });
  };

  return (
    <div className="flex flex-col flex-1 items-center w-full">
      {/* Live Animated Radar HUD */}
      <RadarHUD stats={stats} isLoading={statsLoading} />

      {/* Stacked Gestures Card Engine */}
      <div className="w-full flex-1 flex flex-col justify-center">
        <CardStack
          stories={stories}
          onSwipeRight={handleSwipeRight}
          onSwipeLeft={handleSwipeLeft}
          onTap={handleTap}
          onToggleSave={handleToggleSave}
          onOpenSource={handleOpenSource}
          onReload={() => refetch()}
          isLoading={feedLoading}
        />
      </div>

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
          interactMutation.mutate({ storyId: id, type: 'source_open' });
          window.open(url, '_blank', 'noopener,noreferrer');
        }}
      />
    </div>
  );
};
