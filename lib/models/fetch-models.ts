import { createGroq } from '@ai-sdk/groq'
import { createAnthropic } from '@ai-sdk/anthropic'
import { createGateway } from '@ai-sdk/gateway'

import { Model } from '@/lib/types/models'

export type ModelsByProvider = Record<string, Model[]>

const MODEL_CACHE_TTL_MS = 2 * 60 * 1000

let modelsCache:
  | {
      expiresAt: number
      value: ModelsByProvider
    }
  | undefined

function sortModels(models: Model[]): Model[] {
  return [...models].sort((a, b) => a.name.localeCompare(b.name))
}

function groupByProvider(models: Model[]): ModelsByProvider {
  return models.reduce<ModelsByProvider>((acc, model) => {
    if (!acc[model.provider]) {
      acc[model.provider] = []
    }
    acc[model.provider].push(model)
    return acc
  }, {})
}

//
// ✅ STATIC MODEL LIST (YOUR FINAL CONFIG)
//

function getStaticModels(): Model[] {
  return [
    // 🔵 OpenAI
    {
      id: 'gpt-4o',
      name: 'GPT-4o',
      provider: 'OpenAI',
      providerId: 'openai'
    },
    {
      id: 'gpt-4o-mini',
      name: 'GPT-4o Mini',
      provider: 'OpenAI',
      providerId: 'openai'
    },
    {
      id: 'gpt-4-turbo',
      name: 'GPT-4 Turbo',
      provider: 'OpenAI',
      providerId: 'openai'
    },
    {
      id: 'gpt-3.5-turbo',
      name: 'GPT-3.5 Turbo',
      provider: 'OpenAI',
      providerId: 'openai'
    },

    // 🟢 Groq (FREE 🔥)
    {
      id: 'llama-3.3-70b-versatile',
      name: 'Llama 3.3 70B (Groq)',
      provider: 'Groq',
      providerId: 'groq'
    },
    {
      id: 'llama-3.1-70b-versatile',
      name: 'Llama 3.1 70B (Groq)',
      provider: 'Groq',
      providerId: 'groq'
    },
    {
      id: 'mixtral-8x7b-32768',
      name: 'Mixtral 8x7B (Groq)',
      provider: 'Groq',
      providerId: 'groq'
    },
    {
      id: 'gemma2-9b-it',
      name: 'Gemma 2 9B (Groq)',
      provider: 'Groq',
      providerId: 'groq'
    },

    // 🔴 Google Gemini (ONLY BEST ONES)
    {
      id: 'gemini-3-flash-preview',
      name: 'Gemini 3 Flash Preview',
      provider: 'Google',
      providerId: 'google'
    },
    {
      id: 'gemini-3.1-flash-lite-preview',
      name: 'Gemini 3.1 Flash Lite',
      provider: 'Google',
      providerId: 'google'
    },
    {
      id: 'gemini-3.1-pro-preview',
      name: 'Gemini 3.1 Pro',
      provider: 'Google',
      providerId: 'google'
    },
    {
      id: 'gemini-1.5-flash',
      name: 'Gemini 1.5 Flash',
      provider: 'Google',
      providerId: 'google'
    },
    {
      id: 'gemini-1.5-pro',
      name: 'Gemini 1.5 Pro',
      provider: 'Google',
      providerId: 'google'
    },

    // 🟣 Anthropic
    {
      id: 'claude-sonnet-4-20250514',
      name: 'Claude Sonnet 4',
      provider: 'Anthropic',
      providerId: 'anthropic'
    },
    {
      id: 'claude-opus-4-20250514',
      name: 'Claude Opus 4',
      provider: 'Anthropic',
      providerId: 'anthropic'
    },
    {
      id: 'claude-3-5-sonnet-20241022',
      name: 'Claude 3.5 Sonnet',
      provider: 'Anthropic',
      providerId: 'anthropic'
    },
    {
      id: 'claude-haiku-4-20250301',
      name: 'Claude Haiku 4',
      provider: 'Anthropic',
      providerId: 'anthropic'
    }
  ]
}

//
// ✅ MAIN FUNCTION
//

export async function fetchAvailableModels(): Promise<ModelsByProvider> {
  const now = Date.now()

  if (modelsCache && modelsCache.expiresAt > now) {
    return modelsCache.value
  }

  const models = getStaticModels()

  const grouped = groupByProvider(models)

  const normalized = Object.fromEntries(
    Object.entries(grouped).map(([provider, models]) => [
      provider,
      sortModels(models)
    ])
  )

  modelsCache = {
    value: normalized,
    expiresAt: now + MODEL_CACHE_TTL_MS
  }

  return normalized
}
