import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import type { SourceItem } from '../types';
import { Rss, Plus, AlertCircle, Trash2, ExternalLink } from 'lucide-react';

export const SourcesPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [showAddModal, setShowAddModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newUrl, setNewUrl] = useState('');
  const [newFeedUrl, setNewFeedUrl] = useState('');

  const { data: sources = [], isLoading } = useQuery({
    queryKey: ['sources'],
    queryFn: api.getSources,
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, is_active }: { id: number; is_active: boolean }) =>
      api.updateSource(id, { is_active }),
    onMutate: async ({ id, is_active }) => {
      // Optimistic update for instant 0ms toggle animation
      await queryClient.cancelQueries({ queryKey: ['sources'] });
      const previousSources = queryClient.getQueryData<SourceItem[]>(['sources']);
      queryClient.setQueryData<SourceItem[]>(['sources'], (old = []) =>
        old.map((s) => (s.id === id ? { ...s, is_active } : s))
      );
      return { previousSources };
    },
    onError: (_err, _variables, context) => {
      if (context?.previousSources) {
        queryClient.setQueryData(['sources'], context.previousSources);
      }
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['sources'] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.deleteSource(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['sources'] }),
  });

  const addMutation = useMutation({
    mutationFn: api.createSource,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sources'] });
      setShowAddModal(false);
      setNewName('');
      setNewUrl('');
      setNewFeedUrl('');
    },
  });

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName || !newFeedUrl) return;
    const slug = newName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    addMutation.mutate({
      name: newName,
      slug,
      site_url: newUrl || newFeedUrl,
      feed_url: newFeedUrl,
      priority: 0.8,
    });
  };

  return (
    <div className="w-full flex flex-col flex-1">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-extrabold font-sans text-slate-900 dark:text-white flex items-center gap-2">
            <Rss className="w-5 h-5 text-brand-rose" />
            <span>Discovery Feeds</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-brand-mutedDark font-medium mt-0.5">
            13 Verified first-party blogs, research feeds & release channels
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-brand-rose to-brand-coral text-white text-xs font-bold hover:from-brand-roseHover hover:to-brand-rose transition-all shadow-dating-match cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
          <span>Add Feed</span>
        </button>
      </div>

      {/* Sources List */}
      {isLoading ? (
        <div className="py-20 text-center text-xs text-slate-500 dark:text-brand-mutedDark font-medium">
          <div className="w-7 h-7 border-2 border-brand-rose border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          Connecting to feed sources...
        </div>
      ) : (
        <div className="flex flex-col space-y-2.5">
          {sources.map((src) => (
            <div
              key={src.id}
              className={`p-3.5 rounded-3xl bg-white dark:bg-[#131926] border transition-all shadow-sm ${
                src.is_active
                  ? 'border-slate-200/90 dark:border-white/[0.08]'
                  : 'opacity-70 bg-slate-50 dark:bg-black/40 border-slate-200 dark:border-white/[0.04]'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex-1 min-w-0 pr-2">
                  <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                    <h3 className="text-sm font-extrabold text-slate-900 dark:text-white truncate">
                      {src.name}
                    </h3>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-brand-mutedDark uppercase font-mono font-bold">
                      {src.source_type}
                    </span>
                    <span className="text-[10px] text-brand-rose font-mono font-extrabold">
                      p{src.priority}
                    </span>
                  </div>

                  <div className="flex items-center space-x-2.5 text-[11px] text-slate-500 dark:text-brand-mutedDark font-medium mt-1">
                    <span>{src.stories_count || 0} stories</span>
                    <span>•</span>
                    <span className={src.last_status === 'error' ? 'text-red-500 flex items-center gap-1 font-semibold' : 'text-slate-600 dark:text-white/70'}>
                      {src.last_status === 'error' && <AlertCircle className="w-3 h-3 text-red-500" />}
                      {src.last_status === 'idle' ? 'Ready' : src.last_status}
                    </span>
                    <a
                      href={src.site_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-brand-rose hover:underline flex items-center gap-0.5 font-medium"
                    >
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>

                {/* Tactile ON / OFF Controls */}
                <div className="flex items-center space-x-2.5 flex-shrink-0">
                  {/* Status Badge Pill */}
                  <span
                    className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border transition-all ${
                      src.is_active
                        ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border-emerald-300 dark:border-emerald-700 shadow-sm'
                        : 'bg-slate-100 dark:bg-white/10 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-white/10'
                    }`}
                  >
                    {src.is_active ? 'ON' : 'OFF'}
                  </span>

                  {/* iOS-Style Toggle Switch */}
                  <button
                    type="button"
                    role="switch"
                    aria-checked={src.is_active}
                    onClick={() =>
                      toggleMutation.mutate({ id: src.id, is_active: !src.is_active })
                    }
                    className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-brand-rose/50 shadow-inner ${
                      src.is_active
                        ? 'bg-gradient-to-r from-emerald-500 to-teal-500'
                        : 'bg-slate-300 dark:bg-slate-700'
                    }`}
                    title={src.is_active ? 'Click to Pause Feed' : 'Click to Enable Feed'}
                  >
                    <span
                      aria-hidden="true"
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                        src.is_active ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>

                  {/* Delete Feed Button */}
                  <button
                    onClick={() => {
                      if (confirm(`Remove feed source "${src.name}"?`)) {
                        deleteMutation.mutate(src.id);
                      }
                    }}
                    className="p-1.5 rounded-full text-slate-400 hover:text-red-500 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors cursor-pointer"
                    title="Delete source"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Feed Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-3xl p-5 border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0E1422] shadow-2xl">
            <h2 className="text-base font-extrabold text-slate-900 dark:text-white mb-3">
              Add Discovery Feed
            </h2>
            <form onSubmit={handleAddSubmit} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-600 dark:text-brand-mutedDark font-semibold mb-1 block">Feed Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. OpenAI Research"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white focus:outline-none focus:border-brand-rose"
                />
              </div>

              <div>
                <label className="text-slate-600 dark:text-brand-mutedDark font-semibold mb-1 block">RSS / Atom Feed URL</label>
                <input
                  type="url"
                  required
                  placeholder="https://example.com/feed.xml"
                  value={newFeedUrl}
                  onChange={(e) => setNewFeedUrl(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white focus:outline-none focus:border-brand-rose"
                />
              </div>

              <div>
                <label className="text-slate-600 dark:text-brand-mutedDark font-semibold mb-1 block">Website URL (Optional)</label>
                <input
                  type="url"
                  placeholder="https://example.com"
                  value={newUrl}
                  onChange={(e) => setNewUrl(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white focus:outline-none focus:border-brand-rose"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-2.5 rounded-full border border-slate-200 dark:border-white/10 text-slate-600 dark:text-brand-mutedDark hover:text-slate-900 dark:hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addMutation.isPending}
                  className="flex-1 py-2.5 rounded-full bg-gradient-to-r from-brand-rose to-brand-coral text-white font-bold hover:from-brand-roseHover hover:to-brand-rose shadow-dating-match"
                >
                  {addMutation.isPending ? 'Adding...' : 'Add Source'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
