'use client'

import { useEffect, useState } from 'react'
import {
  Search,
  Brain,
  Sparkles,
  ImageIcon
} from 'lucide-react'

import { cn } from '@/lib/utils'

export type SearchMode =
  | 'quick'
  | 'adaptive'
  | 'research'
  | 'image'

const modes = [
  {
    id: 'quick' as SearchMode,
    label: 'Search',
    icon: Search
  },
  {
    id: 'adaptive' as SearchMode,
    label: 'Adaptive',
    icon: Brain
  },
  {
    id: 'research' as SearchMode,
    label: 'Research',
    icon: Sparkles
  },
  {
    id: 'image' as SearchMode,
    label: 'Image',
    icon: ImageIcon
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
    <div className="flex items-center gap-1 rounded-full border border-border/50 bg-background/80 p-1 backdrop-blur-xl shadow-sm">
      {modes.map(mode => {
        const Icon = mode.icon

        const active = selectedMode === mode.id

        return (
          <button
            key={mode.id}
            type="button"
            onClick={() => handleModeChange(mode.id)}
            className={cn(
              'relative flex items-center gap-2 rounded-full px-3 py-2 text-sm transition-all duration-300',
              active
                ? 'bg-gradient-to-r from-violet-500 to-amber-400 text-white shadow-lg'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            )}
          >
            <Icon className="h-4 w-4" />

            <span className="hidden md:block">
              {mode.label}
            </span>
          </button>
        )
      })}
    </div>
  )
}

export default SearchModeSelector
