'use client';

import { useSearchStore } from '@/lib/store/search-store';
import { SearchMode } from '@/lib/types/search';
import { Zap, Brain, Search, ImageIcon } from 'lucide-react';

const modes = [
  { id: 'quick' as SearchMode, label: 'Speed Insight', icon: Zap },
  { id: 'adaptive' as SearchMode, label: 'Deep Research', icon: Brain },
  { id: 'analyzing' as SearchMode, label: 'Analyzing', icon: Search },
  { id: 'image' as SearchMode, label: 'Image Generation', icon: ImageIcon },
];

export default function SearchModeSelector() {
  const { searchMode, setSearchMode } = useSearchStore();

  return (
    <div className="flex items-center gap-1 bg-zinc-900 border border-zinc-800 rounded-xl p-1">
      {modes.map((mode) => {
        const Icon = mode.icon;
        const isActive = searchMode === mode.id;

        return (
          <button
            key={mode.id}
            onClick={() => setSearchMode(mode.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              isActive 
                ? 'bg-white text-black shadow' 
                : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
            }`}
          >
            <Icon className="w-4 h-4" />
            {mode.label}
          </button>
        );
      })}
    </div>
  );
}
