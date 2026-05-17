'use client';

import React from 'react';
import { Zap, Brain, Search, ImageIcon } from 'lucide-react';

const modes = [
  { id: 'quick', label: 'Speed Insight', icon: Zap },
  { id: 'adaptive', label: 'Deep Research', icon: Brain },
  { id: 'analyzing', label: 'Analyzing', icon: Search },
  { id: 'image', label: 'Image Generation', icon: ImageIcon },
];

export default function SearchModeSelector() {
  const [searchMode, setSearchMode] = React.useState('quick');

  return (
    <div className="flex items-center gap-1 bg-zinc-900/90 border border-zinc-700 rounded-2xl p-1 shadow-lg">
      {modes.map((mode) => {
        const Icon = mode.icon;
        const isActive = searchMode === mode.id;

        return (
          <button
            key={mode.id}
            onClick={() => setSearchMode(mode.id)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 whitespace-nowrap ${
              isActive 
                ? 'bg-white text-black shadow-md' 
                : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
            }`}
          >
            <Icon className="w-4 h-4" />
            <span>{mode.label}</span>
          </button>
        );
      })}
    </div>
  );
}
