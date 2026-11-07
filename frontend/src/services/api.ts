import type { Story, RadarStats, SourceItem, AppSettings } from '../types';
import { Capacitor } from '@capacitor/core';

export const getApiBaseUrl = (): string => {
  const customHost = localStorage.getItem('ai_radar_api_host');
  if (customHost) {
    return `${customHost.replace(/\/+$/, '')}/api/v1`;
  }
  if (Capacitor.isNativePlatform()) {
    // Default for Android Emulator is 10.0.2.2, for device user can set custom host in Settings
    return 'http://10.0.2.2:8000/api/v1';
  }
  return '/api/v1';
};

const BASE_URL = getApiBaseUrl();

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
    const res = await fetch(`${BASE_URL}/radar/feed?limit=${limit}`);
    return handleResponse<Story[]>(res);
  },

  recordInteraction: async (
    storyId: number,
    type: 'interested' | 'skip' | 'save' | 'source_open' | 'tap_detail'
  ): Promise<{ success: boolean; updated_topics: string[] }> => {
    const res = await fetch(`${BASE_URL}/radar/interact`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ story_id: storyId, interaction_type: type }),
    });
    return handleResponse(res);
  },

  getRadarStats: async (): Promise<RadarStats> => {
    const res = await fetch(`${BASE_URL}/radar/stats`);
    return handleResponse<RadarStats>(res);
  },

  triggerScan: async (): Promise<{ status: string; message: string }> => {
    const res = await fetch(`${BASE_URL}/radar/scan`, { method: 'POST' });
    return handleResponse(res);
  },

  // STORIES
  getStories: async (
    tab: 'for_you' | 'trending' | 'saved' | 'all' = 'for_you',
    category?: string,
    search?: string,
    limit = 30
  ): Promise<Story[]> => {
    const params = new URLSearchParams({ tab, limit: limit.toString() });
    if (category) params.append('category', category);
    if (search) params.append('search', search);
    const res = await fetch(`${BASE_URL}/stories?${params.toString()}`);
    return handleResponse<Story[]>(res);
  },

  getStoryDetail: async (storyId: number): Promise<Story> => {
    const res = await fetch(`${BASE_URL}/stories/${storyId}`);
    return handleResponse<Story>(res);
  },

  toggleSaveStory: async (storyId: number): Promise<{ success: boolean; is_saved: boolean }> => {
    const res = await fetch(`${BASE_URL}/stories/${storyId}/save`, { method: 'POST' });
    return handleResponse(res);
  },

  // SOURCES
  getSources: async (): Promise<SourceItem[]> => {
    const res = await fetch(`${BASE_URL}/sources`);
    return handleResponse<SourceItem[]>(res);
  },

  updateSource: async (id: number, data: Partial<SourceItem>): Promise<SourceItem> => {
    const res = await fetch(`${BASE_URL}/sources/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse<SourceItem>(res);
  },

  createSource: async (data: { name: string; slug: string; site_url: string; feed_url: string; priority?: number }): Promise<SourceItem> => {
    const res = await fetch(`${BASE_URL}/sources`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse<SourceItem>(res);
  },

  deleteSource: async (id: number): Promise<{ success: boolean }> => {
    const res = await fetch(`${BASE_URL}/sources/${id}`, { method: 'DELETE' });
    return handleResponse(res);
  },

  // SETTINGS
  getSettings: async (): Promise<AppSettings> => {
    const res = await fetch(`${BASE_URL}/settings`);
    return handleResponse<AppSettings>(res);
  },

  updateSettings: async (data: { scan_interval_minutes?: number; gemini_api_key?: string }): Promise<AppSettings> => {
    const res = await fetch(`${BASE_URL}/settings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse<AppSettings>(res);
  },

  resetAffinities: async (): Promise<{ success: boolean; message: string }> => {
    const res = await fetch(`${BASE_URL}/settings/reset-affinities`, { method: 'POST' });
    return handleResponse(res);
  },
};
