import type { Story, SourceItem, RadarStats } from '../types';
import { DEFAULT_STORIES, DEFAULT_SOURCES, DEFAULT_STATS } from '../data/seedData';
import { storage } from '../utils/storage';

class LocalRadarEngine {
  private stories: Story[] = [];
  private sources: SourceItem[] = [];
  private savedIds: Set<number> = new Set();
  private swipedIds: Set<number> = new Set();
  private affinities: Record<string, number> = {};
  private initialized = false;

  public async init() {
    if (this.initialized) return;

    // Load saved IDs
    const savedStr = await storage.get('ai_radar_saved_ids');
    if (savedStr) {
      try {
        const arr = JSON.parse(savedStr);
        this.savedIds = new Set(arr);
      } catch {
        this.savedIds = new Set();
      }
    }

    // Load swiped IDs
    const swipedStr = await storage.get('ai_radar_swiped_ids');
    if (swipedStr) {
      try {
        const arr = JSON.parse(swipedStr);
        this.swipedIds = new Set(arr);
      } catch {
        this.swipedIds = new Set();
      }
    }

    // Load topic affinities
    const affStr = await storage.get('ai_radar_topic_affinities');
    if (affStr) {
      try {
        this.affinities = JSON.parse(affStr);
      } catch {
        this.affinities = { ...DEFAULT_STATS.topic_weights };
      }
    } else {
      this.affinities = { ...DEFAULT_STATS.topic_weights };
    }

    // Load sources
    const srcStr = await storage.get('ai_radar_sources');
    if (srcStr) {
      try {
        this.sources = JSON.parse(srcStr);
      } catch {
        this.sources = [...DEFAULT_SOURCES];
      }
    } else {
      this.sources = [...DEFAULT_SOURCES];
    }

    // Load cached stories
    const stStr = await storage.get('ai_radar_cached_stories');
    if (stStr) {
      try {
        const parsed = JSON.parse(stStr);
        this.stories = Array.isArray(parsed) && parsed.length > 0 ? parsed : [...DEFAULT_STORIES];
      } catch {
        this.stories = [...DEFAULT_STORIES];
      }
    } else {
      this.stories = [...DEFAULT_STORIES];
    }

    // Mark is_saved state
    this.stories = this.stories.map((s) => ({
      ...s,
      is_saved: this.savedIds.has(s.id),
    }));

    this.initialized = true;
  }

  public async getRadarFeed(limit = 20): Promise<Story[]> {
    await this.init();
    
    // Filter un-swiped stories first
    let unswiped = this.stories.filter((s) => !this.swipedIds.has(s.id));
    
    // If all stories were swiped, wrap around or reshuffle so deck is never dead
    if (unswiped.length === 0) {
      this.swipedIds.clear();
      await storage.set('ai_radar_swiped_ids', JSON.stringify([]));
      unswiped = [...this.stories];
    }

    // Score stories by user affinity
    const scored = unswiped.map((story) => {
      let score = story.importance_score * 10;
      if (this.affinities[story.category]) {
        score += this.affinities[story.category] * 2;
      }
      for (const topic of story.topics || []) {
        if (this.affinities[topic]) {
          score += this.affinities[topic] * 1.5;
        }
      }
      const matchPct = Math.min(99, Math.max(78, Math.round(score / 1.3)));
      return {
        ...story,
        computed_rank: score,
        novelty_score: matchPct,
        is_saved: this.savedIds.has(story.id),
      };
    });

    // Sort by computed score
    scored.sort((a, b) => (b.computed_rank || 0) - (a.computed_rank || 0));
    return scored.slice(0, limit);
  }

  public async recordInteraction(
    storyId: number,
    type: 'interested' | 'skip' | 'save' | 'source_open' | 'tap_detail'
  ): Promise<{ success: boolean; updated_topics: string[] }> {
    await this.init();
    
    if (type === 'interested' || type === 'skip') {
      this.swipedIds.add(storyId);
      await storage.set('ai_radar_swiped_ids', JSON.stringify(Array.from(this.swipedIds)));
    }

    const story = this.stories.find((s) => s.id === storyId);
    const updated: string[] = [];

    if (story) {
      const delta = type === 'save' ? 3.0 : type === 'interested' ? 1.5 : type === 'source_open' ? 2.0 : -0.5;
      
      const topicsToUpdate = [story.category, ...(story.topics || []), ...(story.companies || [])];
      for (const t of topicsToUpdate) {
        if (!t) continue;
        const current = this.affinities[t] || 0;
        this.affinities[t] = Math.max(-5, Math.min(50, Math.round((current + delta) * 10) / 10));
        updated.push(t);
      }
      await storage.set('ai_radar_topic_affinities', JSON.stringify(this.affinities));
    }

    return { success: true, updated_topics: updated };
  }

  public async toggleSaveStory(storyId: number): Promise<{ success: boolean; is_saved: boolean }> {
    await this.init();
    let isSaved = false;

    if (this.savedIds.has(storyId)) {
      this.savedIds.delete(storyId);
      isSaved = false;
    } else {
      this.savedIds.add(storyId);
      isSaved = true;
      // Record positive affinity
      await this.recordInteraction(storyId, 'save');
    }

    await storage.set('ai_radar_saved_ids', JSON.stringify(Array.from(this.savedIds)));

    this.stories = this.stories.map((s) => (s.id === storyId ? { ...s, is_saved: isSaved } : s));
    return { success: true, is_saved: isSaved };
  }

  public async getStories(
    tab: 'for_you' | 'trending' | 'saved' | 'all' = 'for_you',
    category?: string,
    search?: string,
    limit = 30
  ): Promise<Story[]> {
    await this.init();

    let list = this.stories.map((s) => ({
      ...s,
      is_saved: this.savedIds.has(s.id),
    }));

    if (tab === 'saved') {
      list = list.filter((s) => this.savedIds.has(s.id));
    } else if (tab === 'trending') {
      list.sort((a, b) => b.importance_score - a.importance_score);
    } else if (tab === 'for_you') {
      list.sort((a, b) => {
        const scoreA = (this.affinities[a.category] || 0) + a.importance_score * 2;
        const scoreB = (this.affinities[b.category] || 0) + b.importance_score * 2;
        return scoreB - scoreA;
      });
    }

    if (category && category !== 'All') {
      list = list.filter((s) => s.category.toLowerCase() === category.toLowerCase());
    }

    if (search && search.trim()) {
      const q = search.toLowerCase().trim();
      list = list.filter(
        (s) =>
          s.title.toLowerCase().includes(q) ||
          s.summary.toLowerCase().includes(q) ||
          (s.topics && s.topics.some((t) => t.toLowerCase().includes(q))) ||
          (s.companies && s.companies.some((c) => c.toLowerCase().includes(q)))
      );
    }

    return list.slice(0, limit);
  }

  public async getStoryDetail(storyId: number): Promise<Story> {
    await this.init();
    const story = this.stories.find((s) => s.id === storyId) || this.stories[0];
    return {
      ...story,
      is_saved: this.savedIds.has(story.id),
    };
  }

  public async getSources(): Promise<SourceItem[]> {
    await this.init();
    return [...this.sources];
  }

  public async updateSource(id: number, data: Partial<SourceItem>): Promise<SourceItem> {
    await this.init();
    const idx = this.sources.findIndex((s) => s.id === id);
    if (idx !== -1) {
      this.sources[idx] = { ...this.sources[idx], ...data };
      await storage.set('ai_radar_sources', JSON.stringify(this.sources));
      return this.sources[idx];
    }
    return this.sources[0];
  }

  public async getRadarStats(): Promise<RadarStats> {
    await this.init();
    const activeSources = this.sources.filter((s) => s.is_active).length;
    return {
      ...DEFAULT_STATS,
      sources_count: this.sources.length,
      active_sources_count: activeSources,
      stories_discovered_today: this.stories.length,
      topic_weights: this.affinities,
      swipes_today: this.swipedIds.size,
    };
  }

  public async updateStoriesFromNetwork(newStories: Story[]) {
    if (!newStories || newStories.length === 0) return;
    await this.init();
    this.stories = newStories;
    await storage.set('ai_radar_cached_stories', JSON.stringify(newStories));
  }
}

export const localRadar = new LocalRadarEngine();
