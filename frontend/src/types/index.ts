export interface Story {
  id: number;
  source_id?: number | null;
  source_name?: string | null;
  canonical_url: string;
  original_url: string;
  title: string;
  normalized_title?: string | null;
  headline: string;
  summary: string;
  why_it_matters: string;
  raw_content?: string | null;
  image_url?: string | null;
  read_time_min: number;
  category: string;
  sub_category?: string | null;
  companies: string[];
  technologies: string[];
  topics: string[];
  importance_score: number;
  novelty_score: number;
  technical_score: number;
  interaction_score?: number;
  is_breaking: boolean;
  is_ai_related: boolean;
  published_at: string;
  discovered_at: string;
  is_saved: boolean;
  is_viewed: boolean;
  computed_rank?: number;
}

export interface RadarStats {
  radar_active: boolean;
  sources_count: number;
  active_sources_count: number;
  last_scan_time?: string | null;
  last_scan_status: string;
  stories_discovered_today: number;
  duplicates_blocked_today: number;
  important_stories_count: number;
  signal_accuracy_pct: number;
  topic_weights: Record<string, number>;
  swipes_today: number;
}

export interface SourceItem {
  id: number;
  name: string;
  slug: string;
  site_url: string;
  feed_url: string;
  source_type: string;
  category_hint?: string | null;
  priority: number;
  is_active: boolean;
  last_fetched_at?: string | null;
  last_status: string;
  failure_count: number;
  stories_count?: number;
  created_at?: string | null;
}

export interface AppSettings {
  project_name: string;
  organization: string;
  scan_interval_minutes: number;
  gemini_configured: boolean;
  gemini_model: string;
  database_url: string;
  top_interested_topics: Record<string, number>;
}
