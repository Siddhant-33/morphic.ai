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
    const key = `${model.provider}|${model.id}`

    if (seen.has(key)) return false

    seen.add(key)

    return true
  })
}

function groupByProvider(models: Model[]): ModelsByProvider {
  return models.reduce((acc, model) => {
    if (!acc[model.provider]) acc[model.provider] = []

    acc[model.provider].push(model)

    return acc
  }, {} as ModelsByProvider)
}

//
// OPENAI
//
export async function fetchOpenAIModels(): Promise<Model[]> {
  if (!isProviderEnabled('openai')) return []

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
    }
  ]
}

//
// GOOGLE GEMINI
//
export async function fetchGoogleModels(): Promise<Model[]> {
  if (!isProviderEnabled('google')) return []

  return [
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
    },
    {
      id: 'gemini-2.5-pro',
      name: 'Gemini 2.5 Pro',
      provider: 'Google',
      providerId: 'google'
    }
  ]
}

//
// GROQ (ONLY WORKING MODELS)
//
export async function fetchGroqModels(): Promise<Model[]> {
  if (!isProviderEnabled('groq')) return []

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
    }
  ]
}

//
// ANTHROPIC
//
export async function fetchAnthropicModels(): Promise<Model[]> {
  if (!isProviderEnabled('anthropic')) return []

  return [
    {
      id: 'claude-3-5-sonnet-latest',
      name: 'Claude 3.5 Sonnet',
      provider: 'Anthropic',
      providerId: 'anthropic'
    }
  ]
}

//
// OLLAMA (LOCALHOST ONLY)
//
export async function fetchOllamaModels(): Promise<Model[]> {
  if (!isProviderEnabled('ollama')) return []

  return [
    {
      id: 'tinyllama',
      name: 'TinyLlama',
      provider: 'Ollama',
      providerId: 'ollama'
    },
    {
      id: 'llama3',
      name: 'Llama 3',
      provider: 'Ollama',
      providerId: 'ollama'
    },
    {
      id: 'mistral',
      name: 'Mistral',
      provider: 'Ollama',
      providerId: 'ollama'
    }
  ]
}

//
// GATEWAY
//
export async function fetchGatewayModels(): Promise<Model[]> {
  if (!isProviderEnabled('gateway')) return []

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
// FINAL
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
    Object.entries(grouped).map(([k, v]) => [k, sortModels(v)])
  )

  modelsCache = {
    value: normalized,
    expiresAt: now + MODEL_CACHE_TTL_MS
  }

  return normalized
}
