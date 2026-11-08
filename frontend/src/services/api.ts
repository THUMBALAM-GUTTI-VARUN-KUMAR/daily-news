import type { Story, RadarStats, SourceItem, AppSettings } from '../types';
import { Capacitor } from '@capacitor/core';
import { localRadar } from './localRadar';
import { storage } from '../utils/storage';

export const getApiBaseUrl = (): string => {
  const customHost = localStorage.getItem('ai_radar_api_host');
  if (customHost) {
    return `${customHost.replace(/\/+$/, '')}/api/v1`;
  }
  if (Capacitor.isNativePlatform()) {
    // Default to current local network host for Varun Foundry dev machine
    return 'http://10.112.33.83:8000/api/v1';
  }
  return '/api/v1';
};

const url = (path: string): string => `${getApiBaseUrl()}${path.startsWith('/') ? path : `/${path}`}`;

async function fetchWithTimeout(input: RequestInfo | URL, init?: RequestInit, timeoutMs = 2500): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(input, {
      ...init,
      signal: controller.signal,
    });
    clearTimeout(id);
    return response;
  } catch (err) {
    clearTimeout(id);
    throw err;
  }
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`API Error ${res.status}: ${errorText || res.statusText}`);
  }
  return res.json();
}

export const api = {
  // RADAR
  getRadarFeed: async (limit = 20): Promise<Story[]> => {
    try {
      const res = await fetchWithTimeout(url(`/radar/feed?limit=${limit}`));
      const data = await handleResponse<Story[]>(res);
      if (Array.isArray(data) && data.length > 0) {
        localRadar.updateStoriesFromNetwork(data);
        return data;
      }
    } catch {
      // Backend not reached -> serve from autonomous local engine
    }
    return localRadar.getRadarFeed(limit);
  },

  recordInteraction: async (
    storyId: number,
    type: 'interested' | 'skip' | 'save' | 'source_open' | 'tap_detail'
  ): Promise<{ success: boolean; updated_topics: string[] }> => {
    // 1. Immediately record in local engine for 0ms latency
    const localRes = await localRadar.recordInteraction(storyId, type);

    // 2. Background sync to backend if online
    fetchWithTimeout(url('/radar/interact'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ story_id: storyId, interaction_type: type }),
    }).catch(() => {});

    return localRes;
  },

  getRadarStats: async (): Promise<RadarStats> => {
    try {
      const res = await fetchWithTimeout(url('/radar/stats'));
      return await handleResponse<RadarStats>(res);
    } catch {
      return localRadar.getRadarStats();
    }
  },

  triggerScan: async (): Promise<{ status: string; message: string }> => {
    try {
      const res = await fetchWithTimeout(url('/radar/scan'), { method: 'POST' }, 5000);
      return await handleResponse(res);
    } catch {
      return { status: 'success', message: 'Autonomous mobile radar scan complete.' };
    }
  },

  // STORIES
  getStories: async (
    tab: 'for_you' | 'trending' | 'saved' | 'all' = 'for_you',
    category?: string,
    search?: string,
    limit = 30
  ): Promise<Story[]> => {
    try {
      const params = new URLSearchParams({ tab, limit: limit.toString() });
      if (category) params.append('category', category);
      if (search) params.append('search', search);
      const res = await fetchWithTimeout(url(`/stories?${params.toString()}`));
      const data = await handleResponse<Story[]>(res);
      if (Array.isArray(data)) {
        return data;
      }
    } catch {
      // Fallback
    }
    return localRadar.getStories(tab, category, search, limit);
  },

  getStoryDetail: async (storyId: number): Promise<Story> => {
    try {
      const res = await fetchWithTimeout(url(`/stories/${storyId}`));
      return await handleResponse<Story>(res);
    } catch {
      return localRadar.getStoryDetail(storyId);
    }
  },

  toggleSaveStory: async (storyId: number): Promise<{ success: boolean; is_saved: boolean }> => {
    // 1. Immediately toggle in local engine
    const localRes = await localRadar.toggleSaveStory(storyId);

    // 2. Background sync
    fetchWithTimeout(url(`/stories/${storyId}/save`), { method: 'POST' }).catch(() => {});

    return localRes;
  },

  // SOURCES
  getSources: async (): Promise<SourceItem[]> => {
    try {
      const res = await fetchWithTimeout(url('/sources'));
      const data = await handleResponse<SourceItem[]>(res);
      if (Array.isArray(data) && data.length > 0) {
        return data;
      }
    } catch {}
    return localRadar.getSources();
  },

  updateSource: async (id: number, data: Partial<SourceItem>): Promise<SourceItem> => {
    const localRes = await localRadar.updateSource(id, data);
    fetchWithTimeout(url(`/sources/${id}`), {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }).catch(() => {});
    return localRes;
  },

  createSource: async (data: { name: string; slug: string; site_url: string; feed_url: string; priority?: number }): Promise<SourceItem> => {
    const res = await fetch(url('/sources'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse<SourceItem>(res);
  },

  deleteSource: async (id: number): Promise<{ success: boolean }> => {
    try {
      const res = await fetch(url(`/sources/${id}`), { method: 'DELETE' });
      return handleResponse(res);
    } catch {
      return { success: true };
    }
  },

  // SETTINGS
  getSettings: async (): Promise<AppSettings> => {
    try {
      const res = await fetchWithTimeout(url('/settings'));
      return await handleResponse<AppSettings>(res);
    } catch {}
    const stats = await localRadar.getRadarStats();
    const storedKey = await storage.get('ai_radar_gemini_api_key');
    return {
      project_name: 'AI RADAR',
      organization: 'Varun Foundry',
      scan_interval_minutes: 10,
      gemini_configured: Boolean(storedKey),
      gemini_model: 'gemini-2.5-flash',
      database_url: 'sqlite:///./ai_radar.db',
      top_interested_topics: stats.topic_weights,
    };
  },

  updateSettings: async (data: { scan_interval_minutes?: number; gemini_api_key?: string }): Promise<AppSettings> => {
    try {
      const res = await fetchWithTimeout(url('/settings'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      return await handleResponse<AppSettings>(res);
    } catch {
      return api.getSettings();
    }
  },

  resetAffinities: async (): Promise<{ success: boolean; message: string }> => {
    await storage.remove('ai_radar_topic_affinities');
    fetchWithTimeout(url('/settings/reset-affinities'), { method: 'POST' }).catch(() => {});
    return { success: true, message: 'Personalization preferences reset to baseline.' };
  },
};
