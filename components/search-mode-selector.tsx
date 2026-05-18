'use client'

import { useEffect, useState } from 'react'
import {
  Search,
  Brain,
  Sparkles,
  ImageIcon,
  ScanSearch
} from 'lucide-react'

import { cn } from '@/lib/utils'

type SearchMode =
  | 'quick'
  | 'adaptive'
  | 'research'
  | 'image'
  | 'analyze'

const modes = [
  {
    id: 'quick' as SearchMode,
    icon: Search,
    label: 'Search'
  },
  {
    id: 'adaptive' as SearchMode,
    icon: Brain,
    label: 'Adaptive'
  },
  {
    id: 'research' as SearchMode,
    icon: Sparkles,
    label: 'Research'
  },
  {
    id: 'analyze' as SearchMode,
    icon: ScanSearch,
    label: 'Analyze'
  },
  {
    id: 'image' as SearchMode,
    icon: ImageIcon,
    label: 'Image'
  }
]

export function SearchModeSelector() {
  const [selectedMode, setSelectedMode] =
    useState<SearchMode>('quick')

  useEffect(() => {
    const savedMode = document.cookie
      .split('; ')
      .find(row => row.startsWith('searchMode='))
      ?.split('=')[1] as SearchMode | undefined

    if (savedMode) {
      setSelectedMode(savedMode)
    }
  }, [])

  const handleModeChange = (mode: SearchMode) => {
    setSelectedMode(mode)

    document.cookie = `searchMode=${mode}; path=/; max-age=31536000`
  }

  return (
    <div className="flex items-center gap-1 rounded-2xl border border-border/60 bg-background/80 p-1 backdrop-blur-xl shadow-sm dark:bg-black/40">
      {modes.map(mode => {
        const Icon = mode.icon

        const active = selectedMode === mode.id

        return (
          <button
            key={mode.id}
            type="button"
            onClick={() => handleModeChange(mode.id)}
            title={mode.label}
            className={cn(
              'relative flex h-9 w-9 items-center justify-center rounded-xl transition-all duration-300',
              active
                ? 'bg-gradient-to-br from-violet-500 via-fuchsia-500 to-amber-400 text-white shadow-lg shadow-violet-500/30 scale-105'
                : 'text-muted-foreground hover:bg-muted/70 hover:text-foreground'
            )}
          >
            <Icon className="h-4 w-4" />
          </button>
        )
      })}
    </div>
  )
}

export default SearchModeSelector
