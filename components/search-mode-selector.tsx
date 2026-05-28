'use client'

import { useEffect, useState } from 'react'
import {
  Search,
  Brain,
  Microscope,
  ImageIcon
} from 'lucide-react'

import { cn } from '@/lib/utils'

type SearchMode =
  | 'quick'
  | 'adaptive'
  | 'deep'
  | 'image'

const modes = [
  {
    id: 'quick' as SearchMode,
    icon: Search,
    placeholder: 'Search on Morphic...',
    glow:
      'shadow-[0_0_18px_rgba(255,140,0,0.55)] text-orange-400'
  },

  {
    id: 'adaptive' as SearchMode,
    icon: Brain,
    placeholder: 'Adaptive thinking enabled...',
    glow:
      'shadow-[0_0_18px_rgba(168,85,247,0.55)] text-violet-400'
  },

  {
    id: 'deep' as SearchMode,
    icon: Microscope,
    placeholder: 'Deep Research mode enabled...',
    glow:
      'shadow-[0_0_18px_rgba(59,130,246,0.55)] text-cyan-400'
  },

  {
    id: 'image' as SearchMode,
    icon: ImageIcon,
    placeholder: 'Generate an image of...',
    glow:
      'shadow-[0_0_18px_rgba(236,72,153,0.55)] text-pink-400'
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

    updatePlaceholder(savedMode || 'quick')
  }, [])

  const updatePlaceholder = (mode: SearchMode) => {
    const input = document.querySelector(
      'textarea'
    ) as HTMLTextAreaElement | null

    const selected = modes.find(m => m.id === mode)

    if (input && selected) {
      input.placeholder = selected.placeholder
    }
  }

  const handleModeChange = (mode: SearchMode) => {
    setSelectedMode(mode)

    document.cookie = `searchMode=${mode}; path=/; max-age=31536000`

    updatePlaceholder(mode)
  }

  return (
    <div className="flex items-center gap-1 rounded-full border border-white/10 bg-black/90 p-1 backdrop-blur-xl">
      {modes.map(mode => {
        const Icon = mode.icon

        const active = selectedMode === mode.id

        return (
          <button
            key={mode.id}
            type="button"
            onClick={() => handleModeChange(mode.id)}
            className={cn(
              'relative flex h-10 w-10 items-center justify-center rounded-full transition-all duration-300',
              active
                ? `bg-zinc-900 ${mode.glow} scale-105`
                : 'text-zinc-500 hover:text-white hover:bg-zinc-900/70'
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
