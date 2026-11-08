/**
 * Formats ISO or SQLite date strings into human-readable relative time badges.
 */
export function isToday(dateStr?: string | null): boolean {
  if (!dateStr) return false;
  try {
    const d = new Date(dateStr.replace(' ', 'T'));
    if (isNaN(d.getTime())) return false;
    const now = new Date();
    return (
      d.getDate() === now.getDate() &&
      d.getMonth() === now.getMonth() &&
      d.getFullYear() === now.getFullYear()
    );
  } catch {
    return false;
  }
}

export function formatStoryTime(dateStr?: string | null): { text: string; isToday: boolean } {
  if (!dateStr) return { text: 'Today', isToday: true };
  try {
    const normalized = dateStr.includes('T') ? dateStr : dateStr.replace(' ', 'T') + 'Z';
    const d = new Date(normalized);
    if (isNaN(d.getTime())) return { text: 'Today', isToday: true };

    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMin < 2) return { text: 'Just now', isToday: true };
    if (diffMin < 60) return { text: `${diffMin}m ago`, isToday: true };
    if (diffHours < 24) return { text: `Today • ${diffHours}h ago`, isToday: true };
    if (diffDays === 1) return { text: 'Yesterday', isToday: false };
    if (diffDays < 7) return { text: `${diffDays}d ago`, isToday: false };

    return {
      text: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      isToday: false,
    };
  } catch {
    return { text: 'Today', isToday: true };
  }
}
