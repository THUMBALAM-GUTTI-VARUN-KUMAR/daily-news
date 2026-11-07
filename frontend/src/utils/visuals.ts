// Schmooze-inspired High-Aesthetic Visual Themes
// Vibrant, warm, light & dark compatible editorial backdrops

export interface VisualTheme {
  gradient: string;
  darkGradient: string;
  accent: string;
  tagColor: string;
  badge: string;
  emoji: string;
}

export function getStoryVisualTheme(category: string, company?: string): VisualTheme {
  const comp = (company || '').toLowerCase();

  if (comp.includes('openai')) {
    return {
      gradient: 'from-emerald-50 via-teal-100/50 to-white dark:from-emerald-950/40 dark:via-teal-900/30 dark:to-[#131926]',
      darkGradient: 'from-emerald-950/40 via-teal-900/30 dark:to-[#131926]',
      accent: '#10a37f',
      tagColor: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20',
      badge: 'OpenAI Frontier',
      emoji: '🟢',
    };
  }
  if (comp.includes('anthropic') || comp.includes('claude')) {
    return {
      gradient: 'from-amber-50 via-orange-100/50 to-white dark:from-amber-950/40 dark:via-orange-900/30 dark:to-[#131926]',
      darkGradient: 'from-amber-950/40 via-orange-900/30 dark:to-[#131926]',
      accent: '#d97706',
      tagColor: 'bg-amber-500/10 text-amber-800 dark:text-amber-400 border-amber-500/20',
      badge: 'Anthropic Claude',
      emoji: '🟠',
    };
  }
  if (comp.includes('deepmind') || comp.includes('google')) {
    return {
      gradient: 'from-sky-50 via-blue-100/50 to-white dark:from-sky-950/40 dark:via-blue-900/30 dark:to-[#131926]',
      darkGradient: 'from-sky-950/40 via-blue-900/30 dark:to-[#131926]',
      accent: '#0284c7',
      tagColor: 'bg-sky-500/10 text-sky-800 dark:text-sky-400 border-sky-500/20',
      badge: 'Google DeepMind',
      emoji: '🔵',
    };
  }
  if (comp.includes('meta')) {
    return {
      gradient: 'from-blue-50 via-indigo-100/50 to-white dark:from-blue-950/40 dark:via-indigo-900/30 dark:to-[#131926]',
      darkGradient: 'from-blue-950/40 via-indigo-900/30 dark:to-[#131926]',
      accent: '#4f46e5',
      tagColor: 'bg-indigo-500/10 text-indigo-800 dark:text-indigo-400 border-indigo-500/20',
      badge: 'Meta Llama Lab',
      emoji: '🟣',
    };
  }
  if (comp.includes('mistral')) {
    return {
      gradient: 'from-orange-50 via-amber-100/50 to-white dark:from-orange-950/40 dark:via-amber-900/30 dark:to-[#131926]',
      darkGradient: 'from-orange-950/40 via-amber-900/30 dark:to-[#131926]',
      accent: '#ea580c',
      tagColor: 'bg-orange-500/10 text-orange-800 dark:text-orange-400 border-orange-500/20',
      badge: 'Mistral Open',
      emoji: '🔥',
    };
  }

  // Categories
  switch (category) {
    case 'AI Agents':
      return {
        gradient: 'from-purple-50 via-violet-100/50 to-white dark:from-purple-950/40 dark:via-violet-900/30 dark:to-[#131926]',
        darkGradient: 'from-purple-950/40 via-violet-900/30 dark:to-[#131926]',
        accent: '#7c3aed',
        tagColor: 'bg-purple-500/10 text-purple-800 dark:text-purple-400 border-purple-500/20',
        badge: 'Agentic Systems',
        emoji: '⚡',
      };
    case 'Research & Papers':
      return {
        gradient: 'from-rose-50 via-pink-100/50 to-white dark:from-rose-950/40 dark:via-pink-900/30 dark:to-[#131926]',
        darkGradient: 'from-rose-950/40 via-pink-900/30 dark:to-[#131926]',
        accent: '#e11d48',
        tagColor: 'bg-rose-500/10 text-rose-800 dark:text-rose-400 border-rose-500/20',
        badge: 'arXiv Breakthrough',
        emoji: '🔬',
      };
    case 'Open-Source Releases':
      return {
        gradient: 'from-teal-50 via-emerald-100/50 to-white dark:from-teal-950/40 dark:via-emerald-900/30 dark:to-[#131926]',
        darkGradient: 'from-teal-950/40 dark:via-emerald-900/30 dark:to-[#131926]',
        accent: '#0d9488',
        tagColor: 'bg-teal-500/10 text-teal-800 dark:text-teal-400 border-teal-500/20',
        badge: 'Open Weights',
        emoji: '📦',
      };
    case 'Infrastructure & Chips':
      return {
        gradient: 'from-amber-50 via-yellow-100/50 to-white dark:from-amber-950/40 dark:via-yellow-900/30 dark:to-[#131926]',
        darkGradient: 'from-amber-950/40 via-yellow-900/30 dark:to-[#131926]',
        accent: '#d97706',
        tagColor: 'bg-amber-500/10 text-amber-800 dark:text-amber-400 border-amber-500/20',
        badge: 'Silicon & Compute',
        emoji: '⚡',
      };
    case 'Developer Tools':
      return {
        gradient: 'from-cyan-50 via-sky-100/50 to-white dark:from-cyan-950/40 dark:via-sky-900/30 dark:to-[#131926]',
        darkGradient: 'from-cyan-950/40 dark:via-sky-900/30 dark:to-[#131926]',
        accent: '#0891b2',
        tagColor: 'bg-cyan-500/10 text-cyan-800 dark:text-cyan-400 border-cyan-500/20',
        badge: 'Developer Tooling',
        emoji: '🛠️',
      };
    default:
      return {
        gradient: 'from-rose-50 via-orange-100/40 to-white dark:from-rose-950/40 dark:via-orange-900/30 dark:to-[#131926]',
        darkGradient: 'from-rose-950/40 via-orange-900/30 dark:to-[#131926]',
        accent: '#FF3366',
        tagColor: 'bg-rose-500/10 text-rose-800 dark:text-rose-400 border-rose-500/20',
        badge: 'AI Radar Match',
        emoji: '✨',
      };
  }
}
