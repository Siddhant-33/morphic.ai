'use client'

import { useEffect, useState } from 'react'
import {
  Search,
  Brain,
  Sparkles,
  ImageIcon,
  Microscope
} from 'lucide-react'

import { cn } from '@/lib/utils'

type SearchMode =
  | 'quick'
  | 'adaptive'
  | 'research'
  | 'image'
  | 'deep-research'

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
    label: 'Analyze',
    icon: Sparkles
  },
  {
    id: 'image' as SearchMode,
    label: 'Image',
    icon: ImageIcon
  },
  {
    id: 'deep-research' as SearchMode,
    label: 'Deep',
    icon: Microscope
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
    <div className="flex items-center gap-1 rounded-full border border-zinc-800 bg-black/90 p-1 shadow-2xl backdrop-blur-xl">
      {modes.map(mode => {
        const Icon = mode.icon

        const active = selectedMode === mode.id

        return (
          <button
            key={mode.id}
            type="button"
            title={mode.label}
            onClick={() => handleModeChange(mode.id)}
            className={cn(
              'relative flex h-10 w-10 items-center justify-center rounded-full transition-all duration-300',
              active
                ? 'bg-orange-500 text-black shadow-lg shadow-orange-500/30'
                : 'text-zinc-400 hover:bg-zinc-900 hover:text-white'
            )}
          >
            <Icon className="h-4 w-4 shrink-0" />
          </button>
        )
      })}
    </div>
  )
}

export default SearchModeSelector
