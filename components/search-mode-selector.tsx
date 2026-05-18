'use client'

import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'

type SearchMode = 'quick' | 'adaptive' | 'research' | 'image'

const modes: {
  id: SearchMode
  label?: string
  icon?: React.ReactNode
}[] = [
  {
    id: 'quick',
    label: 'Search'
  },
  {
    id: 'adaptive',
    label: 'Reason'
  },
  {
    id: 'research',
    label: 'Research'
  },
  {
    id: 'image',
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="15"
        height="15"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <circle cx="9" cy="9" r="2" />
        <path d="m21 15-3.5-3.5L5 21" />
      </svg>
    )
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
    <div className="flex items-center bg-background border border-border rounded-full p-1 gap-1">
      {modes.map(mode => {
        const active = selectedMode === mode.id

        return (
          <button
            key={mode.id}
            type="button"
            onClick={() => handleModeChange(mode.id)}
            className={cn(
              'relative flex items-center justify-center rounded-full transition-all duration-200 text-sm font-medium',
              'h-9 px-4',
              active
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted'
            )}
          >
            <div className="flex items-center gap-2">
              {mode.icon}

              {mode.label && (
                <span className="whitespace-nowrap">
                  {mode.label}
                </span>
              )}
            </div>
          </button>
        )
      })}
    </div>
  )
}

export default SearchModeSelector
