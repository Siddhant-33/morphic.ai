import { createGateway } from '@ai-sdk/gateway'

import { Model } from '@/lib/types/models'
import { isProviderEnabled } from '@/lib/utils/registry'

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

function dedupeModels(models: Model[]): Model[] {
  const seen = new Set<string>()

  return models.filter(model => {
    const key = `${model.providerId}:${model.id}`

    if (seen.has(key)) {
      return false
    }

    seen.add(key)
    return true
  })
}

function groupByProvider(models: Model[]): ModelsByProvider {
  return models.reduce((acc, model) => {
    if (!acc[model.providerId]) {
      acc[model.providerId] = []
    }

    acc[model.providerId].push(model)

    return acc
  }, {} as ModelsByProvider)
}

//
// ✅ OPENAI
//
export async function fetchOpenAIModels(): Promise<Model[]> {
  if (!isProviderEnabled('openai')) {
    return []
  }

  return [
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
      id: 'gpt-4.1',
      name: 'GPT-4.1',
      provider: 'OpenAI',
      providerId: 'openai'
    },
    {
      id: 'gpt-4.1-mini',
      name: 'GPT-4.1 Mini',
      provider: 'OpenAI',
      providerId: 'openai'
    }
  ]
}

//
// ✅ GOOGLE GEMINI
//
export async function fetchGoogleModels(): Promise<Model[]> {
  if (!isProviderEnabled('google')) {
    return []
  }

  return [
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
      id: 'gemini-2.5-flash',
      name: 'Gemini 2.5 Flash',
      provider: 'Google',
      providerId: 'google'
    },
    {
      id: 'gemini-2.5-flash-lite',
      name: 'Gemini 2.5 Flash Lite',
      provider: 'Google',
      providerId: 'google'
    }
  ]
}

//
// ✅ GROQ
//
export async function fetchGroqModels(): Promise<Model[]> {
  if (!isProviderEnabled('groq')) {
    return []
  }

  return [
    {
      id: 'llama-3.3-70b-versatile',
      name: 'Llama 3.3 70B',
      provider: 'Groq',
      providerId: 'groq'
    },
    {
      id: 'llama-3.1-8b-instant',
      name: 'Llama 3.1 8B Instant',
      provider: 'Groq',
      providerId: 'groq'
    },
    {
      id: 'mixtral-8x7b-32768',
      name: 'Mixtral 8x7B',
      provider: 'Groq',
      providerId: 'groq'
    }
  ]
}

//
// ✅ ANTHROPIC
//
export async function fetchAnthropicModels(): Promise<Model[]> {
  if (!isProviderEnabled('anthropic')) {
    return []
  }

  return [
    {
      id: 'claude-3-7-sonnet-latest',
      name: 'Claude 3.7 Sonnet',
      provider: 'Anthropic',
      providerId: 'anthropic'
    },
    {
      id: 'claude-3-5-haiku-latest',
      name: 'Claude 3.5 Haiku',
      provider: 'Anthropic',
      providerId: 'anthropic'
    }
  ]
}

//
// ❌ OLLAMA DISABLED
//
export async function fetchOllamaModels(): Promise<Model[]> {
  return []
}

//
// ✅ GATEWAY
//
export async function fetchGatewayModels(): Promise<Model[]> {
  if (!isProviderEnabled('gateway')) {
    return []
  }

  try {
    const gateway = createGateway({
      apiKey: process.env.AI_GATEWAY_API_KEY
    })

    const metadata = await gateway.getAvailableModels()

    return (metadata.models || []).map(model => ({
      id: String(model.id),
      name: String(model.name || model.id),
      provider: 'Gateway',
      providerId: 'gateway'
    }))
  } catch {
    return []
  }
}

//
// ✅ FINAL
//
export async function fetchAvailableModels(): Promise<ModelsByProvider> {
  const now = Date.now()

  if (modelsCache && modelsCache.expiresAt > now) {
    return modelsCache.value
  }

  const [
    openai,
    google,
    groq,
    anthropic,
    ollama,
    gateway
  ] = await Promise.all([
    fetchOpenAIModels(),
    fetchGoogleModels(),
    fetchGroqModels(),
    fetchAnthropicModels(),
    fetchOllamaModels(),
    fetchGatewayModels()
  ])

  const grouped = groupByProvider(
    dedupeModels([
      ...openai,
      ...google,
      ...groq,
      ...anthropic,
      ...ollama,
      ...gateway
    ])
  )

  const normalized = Object.fromEntries(
    Object.entries(grouped).map(([key, models]) => [
      key,
      sortModels(models)
    ])
  )

  modelsCache = {
    value: normalized,
    expiresAt: now + MODEL_CACHE_TTL_MS
  }

  return normalized
}
