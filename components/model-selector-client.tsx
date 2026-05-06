'use client'

import { useMemo, useState } from 'react'
import Image from 'next/image'

import { Check, ChevronDown, Zap, Brain, Scale } from 'lucide-react'

import {
  MODEL_SELECTION_COOKIE,
  serializeModelSelectionCookie
} from '@/lib/config/model-selection-cookie'
import { ModelSelectorData } from '@/lib/types/model-selector'
import { Model } from '@/lib/types/models'
import { cn } from '@/lib/utils'
import { setCookie } from '@/lib/utils/cookies'

import { Button } from './ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList
} from './ui/command'
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover'

function modelKey(model: Model): string {
  return `${model.providerId}:${model.id}`
}

const PROVIDER_LOGO_BY_ID: Record<string, string> = {
  openai: '/providers/logos/openai.svg',
  anthropic: '/providers/logos/anthropic.svg',
  google: '/providers/logos/google.svg',
  gateway: '/providers/logos/gateway.svg',
  'openai-compatible': '/providers/logos/openai-compatible.svg',
  ollama: '/providers/logos/ollama.svg',
  groq: '/providers/logos/groq.svg'
}

function ProviderLogo({ providerId }: { providerId: string }) {
  const logoSrc = PROVIDER_LOGO_BY_ID[providerId]
  if (!logoSrc) {
    return <span className="size-4 rounded-full bg-muted-foreground/30" />
  }

  return (
    <Image
      src={logoSrc}
      alt={`${providerId} logo`}
      width={16}
      height={16}
      className="size-4 shrink-0 object-contain"
    />
  )
}

const CATEGORY_ICONS: Record<string, any> = {
  'Fast Tasks': Zap,
  'Complex Tasks': Brain,
  'Balanced': Scale
}

function categorizeModel(model: Model): string {
  const name = model.name?.toLowerCase() || ''
  
  if (
    name.includes('instant') ||
    name.includes('flash') ||
    name.includes('lite') ||
    name.includes('mini') ||
    name.includes('8b') ||
    name.includes('haiku')
  ) {
    return 'Fast Tasks'
  }
  
  if (
    name.includes('gpt-5') ||
    name.includes('gpt-4o') ||
    name.includes('claude') ||
    name.includes('pro') ||
    name.includes('opus') ||
    name.includes('2.5-pro') ||
    name.includes('3-flash')
  ) {
    return 'Complex Tasks'
  }
  
  return 'Balanced'
}

interface ModelSelectorClientProps {
  data: ModelSelectorData
}

export function ModelSelectorClient({ data }: ModelSelectorClientProps) {
  const [open, setOpen] = useState(false)
  const [selectedModelKey, setSelectedModelKey] = useState<string>(
    data.selectedModelKey
  )
  const [viewMode, setViewMode] = useState<'category' | 'provider'>('category')

  const providerEntries = useMemo(
    () =>
      Object.entries(data.modelsByProvider).sort(([providerA], [providerB]) =>
        providerA.localeCompare(providerB)
      ),
    [data.modelsByProvider]
  )

  const categoryEntries = useMemo(() => {
    const allModels = providerEntries.flatMap(([, models]) => models)
    const grouped: Record<string, Model[]> = {}
    
    allModels.forEach(model => {
      const category = categorizeModel(model)
      if (!grouped[category]) {
        grouped[category] = []
      }
      grouped[category].push(model)
    })
    
    return Object.entries(grouped).sort(([a], [b]) => {
      const order = ['Fast Tasks', 'Balanced', 'Complex Tasks']
      return order.indexOf(a) - order.indexOf(b)
    })
  }, [providerEntries])

  const selectableModels = useMemo(
    () => providerEntries.flatMap(([, models]) => models),
    [providerEntries]
  )

  const selectableByKey = useMemo(
    () =>
      Object.fromEntries(
        selectableModels.map(model => [modelKey(model), model])
      ) as Record<string, Model>,
    [selectableModels]
  )

  const selectedModel = selectableByKey[selectedModelKey]

  if (!data.enabled) {
    return null
  }

  if (!data.hasAvailableModels) {
    return (
      <Button
        variant="outline"
        className="text-sm rounded-full shadow-none gap-1 transition-all px-3 py-2 h-auto bg-muted border-none"
        disabled
        title="No enabled models are available"
      >
        <span className="truncate max-w-52 text-xs font-medium">
          No enabled model available
        </span>
      </Button>
    )
  }

  if (!selectedModel) {
    return null
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="text-sm rounded-full shadow-none gap-1 transition-all px-3 py-2 h-auto bg-muted border-none"
        >
          <ProviderLogo providerId={selectedModel.providerId} />
          <span className="truncate max-w-40 text-xs font-medium">
            {selectedModel.name || selectedModel.id}
          </span>
          <ChevronDown
            className={cn(
              'h-3 w-3 ml-0.5 opacity-50 transition-transform duration-200',
              open && 'rotate-180'
            )}
          />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[320px] p-0" align="end" sideOffset={6}>
        <Command>
          <CommandInput placeholder="Search models..." />
          
          <div className="flex gap-1 p-2 border-b">
            <Button
              variant={viewMode === 'category' ? 'secondary' : 'ghost'}
              size="sm"
              className="flex-1 h-7 text-xs"
              onClick={() => setViewMode('category')}
            >
              By Task
            </Button>
            <Button
              variant={viewMode === 'provider' ? 'secondary' : 'ghost'}
              size="sm"
              className="flex-1 h-7 text-xs"
              onClick={() => setViewMode('provider')}
            >
              By Provider
            </Button>
          </div>

          <CommandList>
            <CommandEmpty>No model found.</CommandEmpty>
            
            {viewMode === 'category' ? (
              categoryEntries.map(([category, models]) => {
                const Icon = CATEGORY_ICONS[category] || Scale
                return (
                  <CommandGroup 
                    key={category} 
                    heading={
                      <div className="flex items-center gap-1.5">
                        <Icon className="h-3.5 w-3.5" />
                        <span>{category}</span>
                      </div>
                    }
                  >
                    {models.map(model => {
                      const value = modelKey(model)
                      const isSelected = selectedModelKey === value
                      return (
                        <CommandItem
                          key={value}
                          value={`${value} ${model.name || model.id}`}
                          onSelect={() => {
                            const nextModel = selectableByKey[value]
                            if (!nextModel) return

                            setSelectedModelKey(value)
                            setCookie(
                              MODEL_SELECTION_COOKIE,
                              serializeModelSelectionCookie({
                                providerId: nextModel.providerId,
                                modelId: nextModel.id
                              })
                            )
                            setOpen(false)
                          }}
                          className="cursor-pointer"
                        >
                          <Check
                            className={cn(
                              'h-4 w-4',
                              isSelected ? 'opacity-100' : 'opacity-0'
                            )}
                          />
                          <ProviderLogo providerId={model.providerId} />
                          <span className="truncate">{model.name || model.id}</span>
                        </CommandItem>
                      )
                    })}
                  </CommandGroup>
                )
              })
            ) : (
              providerEntries.map(([provider, models]) => (
                <CommandGroup key={provider} heading={provider}>
                  {models.map(model => {
                    const value = modelKey(model)
                    const isSelected = selectedModelKey === value
                    return (
                      <CommandItem
                        key={value}
                        value={`${value} ${model.name || model.id} ${provider}`}
                        onSelect={() => {
                          const nextModel = selectableByKey[value]
                          if (!nextModel) return

                          setSelectedModelKey(value)
                          setCookie(
                            MODEL_SELECTION_COOKIE,
                            serializeModelSelectionCookie({
                              providerId: nextModel.providerId,
                              modelId: nextModel.id
                            })
                          )
                          setOpen(false)
                        }}
                        className="cursor-pointer"
                      >
                        <Check
                          className={cn(
                            'h-4 w-4',
                            isSelected ? 'opacity-100' : 'opacity-0'
                          )}
                        />
                        <ProviderLogo providerId={model.providerId} />
                        <span className="truncate">{model.name || model.id}</span>
                      </CommandItem>
                    )
                  })}
                </CommandGroup>
              ))
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
