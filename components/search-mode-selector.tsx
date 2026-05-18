'use client'

import { useEffect, useState } from 'react'
import {
  Search,
  Brain,
  Sparkles,
  ImageIcon
} from 'lucide-react'

import { cn } from '@/lib/utils'

type SearchMode = 'quick' | 'adaptive' | 'research' | 'image'

const modes = [
  {
    id: 'quick' as SearchMode,
    icon: Search
  },
  {
    id: 'adaptive' as SearchMode,
    icon: Brain
  },
  {
    id: 'research' as SearchMode,
    icon: Sparkles
  },
  {
    id: 'image' as SearchMode,
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
    <div className="flex items-center gap-1 rounded-full border border-border/60 bg-background/80 p-1 backdrop-blur-xl">
      {modes.map(mode => {
        const Icon = mode.icon

        const active = selectedMode === mode.id

        return (
          <button
            key={mode.id}
            type="button"
            onClick={() => handleModeChange(mode.id)}
            className={cn(
              'relative flex h-8 w-8 items-center justify-center rounded-full transition-all duration-300',
              active
                ? 'bg-gradient-to-br from-violet-500 to-amber-400 text-white shadow-lg shadow-violet-500/20'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
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
