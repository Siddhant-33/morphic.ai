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
    if (!acc[model.provider]) {
      acc[model.provider] = []
    }

    acc[model.provider].push(model)

    return acc
  }, {} as ModelsByProvider)
}

//
// ===================================
// GOOGLE GEMINI
// ===================================
//

export async function fetchGoogleModels(): Promise<Model[]> {
  if (!isProviderEnabled('google')) return []

  return [
    {
      id: 'gemini-2.5-pro',
      name: 'Gemini 2.5 Pro',
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
    },
    {
      id: 'gemini-2.0-flash',
      name: 'Gemini 2.0 Flash',
      provider: 'Google',
      providerId: 'google'
    }
  ]
}

//
// ===================================
// GROQ
// ===================================
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
      name: 'Llama 3.1 8B',
      provider: 'Groq',
      providerId: 'groq'
    }
  ]
}

//
// ===================================
// OPENROUTER
// ===================================
//

export async function fetchOpenRouterModels(): Promise<Model[]> {
  if (!isProviderEnabled('openrouter')) return []

  return [
    {
      id: 'openai/gpt-4o-mini',
      name: 'GPT-4o Mini',
      provider: 'OpenRouter',
      providerId: 'openrouter'
    },
    {
      id: 'google/gemini-flash-1.5',
      name: 'Gemini Flash 1.5',
      provider: 'OpenRouter',
      providerId: 'openrouter'
    },
    {
      id: 'meta-llama/llama-3.1-70b-instruct',
      name: 'Llama 3.1 70B',
      provider: 'OpenRouter',
      providerId: 'openrouter'
    },
    {
      id: 'qwen/qwen-2.5-72b-instruct',
      name: 'Qwen 2.5 72B',
      provider: 'OpenRouter',
      providerId: 'openrouter'
    },
    {
      id: 'deepseek/deepseek-chat',
      name: 'DeepSeek Chat',
      provider: 'OpenRouter',
      providerId: 'openrouter'
    },
    {
      id: 'deepseek/deepseek-r1',
      name: 'DeepSeek R1',
      provider: 'OpenRouter',
      providerId: 'openrouter'
    }
  ]
}

//
// ===================================
// SILICONFLOW
// ===================================
//

export async function fetchSiliconModels(): Promise<Model[]> {
  if (!isProviderEnabled('silicon')) return []

  return [
    {
      id: 'deepseek-ai/DeepSeek-R1-Distill-Qwen-32B',
      name: 'DeepSeek R1 Distill',
      provider: 'SiliconFlow',
      providerId: 'silicon'
    },
    {
      id: 'Qwen/Qwen2.5-72B-Instruct',
      name: 'Qwen 2.5 72B',
      provider: 'SiliconFlow',
      providerId: 'silicon'
    },
    {
      id: 'meta-llama/Meta-Llama-3.1-70B-Instruct',
      name: 'Llama 3.1 70B Instruct',
      provider: 'SiliconFlow',
      providerId: 'silicon'
    },
    {
      id: 'internlm/internlm2_5-20b-chat',
      name: 'InternLM 2.5 20B',
      provider: 'SiliconFlow',
      providerId: 'silicon'
    }
  ]
}

//
// ===================================
// OLLAMA
// ===================================
//

export async function fetchOllamaModels(): Promise<Model[]> {
  if (!isProviderEnabled('ollama')) return []

  try {
    const res = await fetch('http://127.0.0.1:11434/api/tags', {
      signal: AbortSignal.timeout(1500)
    })

    if (!res.ok) {
      return []
    }

    const data = await res.json()

    return (data.models || []).map((m: any) => ({
      id: m.name,
      name: m.name,
      provider: 'Ollama',
      providerId: 'ollama'
    }))
  } catch {
    return []
  }
}

//
// ===================================
// GATEWAY
// ===================================
//

export async function fetchGatewayModels(): Promise<Model[]> {
  if (!isProviderEnabled('gateway')) return []

  try {
    const gateway = createGateway({
      apiKey: process.env.AI_GATEWAY_API_KEY
    })

    const metadata = await gateway.getAvailableModels()

    return (metadata.models || []).map((model: any) => ({
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
// ===================================
// FINAL MODEL LOADER
// ===================================
//

export async function fetchAvailableModels(): Promise<ModelsByProvider> {
  const now = Date.now()

  if (modelsCache && modelsCache.expiresAt > now) {
    return modelsCache.value
  }

  const [
    google,
    groq,
    openrouter,
    silicon,
    ollama,
    gateway
  ] = await Promise.all([
    fetchGoogleModels(),
    fetchGroqModels(),
    fetchOpenRouterModels(),
    fetchSiliconModels(),
    fetchOllamaModels(),
    fetchGatewayModels()
  ])

  const merged = dedupeModels([
    ...google,
    ...groq,
    ...openrouter,
    ...silicon,
    ...ollama,
    ...gateway
  ])

  const grouped = groupByProvider(merged)

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
