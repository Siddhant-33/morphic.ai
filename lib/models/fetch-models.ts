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

    if (seen.has(key)) return false

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
// =========================
// GOOGLE GEMINI
// =========================
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
// =========================
// GROQ
// =========================
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
    },
    {
      id: 'gemma2-9b-it',
      name: 'Gemma 2 9B',
      provider: 'Groq',
      providerId: 'groq'
    }
  ]
}

//
// =========================
// OPENROUTER
// =========================
//

export async function fetchOpenRouterModels(): Promise<Model[]> {
  if (!isProviderEnabled('openrouter')) return []

  return [
    {
      id: 'openai/gpt-4o',
      name: 'GPT-4o',
      provider: 'OpenRouter',
      providerId: 'openrouter'
    },
    {
      id: 'openai/gpt-4.1-mini',
      name: 'GPT-4.1 Mini',
      provider: 'OpenRouter',
      providerId: 'openrouter'
    },
    {
      id: 'anthropic/claude-3.5-sonnet',
      name: 'Claude 3.5 Sonnet',
      provider: 'OpenRouter',
      providerId: 'openrouter'
    },
    {
      id: 'google/gemini-2.0-flash-001',
      name: 'Gemini Flash',
      provider: 'OpenRouter',
      providerId: 'openrouter'
    },
    {
      id: 'meta-llama/llama-3.1-70b-instruct',
      name: 'Meta Llama 3.1 70B',
      provider: 'OpenRouter',
      providerId: 'openrouter'
    },
    {
      id: 'mistralai/mistral-7b-instruct',
      name: 'Mistral 7B',
      provider: 'OpenRouter',
      providerId: 'openrouter'
    }
  ]
}

//
// =========================
// SILICONFLOW
// =========================
//

export async function fetchSiliconModels(): Promise<Model[]> {
  if (!isProviderEnabled('silicon')) return []

  return [
    {
      id: 'deepseek-ai/DeepSeek-R1',
      name: 'DeepSeek R1',
      provider: 'SiliconFlow',
      providerId: 'silicon'
    },
    {
      id: 'deepseek-ai/DeepSeek-V3',
      name: 'DeepSeek V3',
      provider: 'SiliconFlow',
      providerId: 'silicon'
    },
    {
      id: 'Qwen/Qwen2.5-Coder-32B-Instruct',
      name: 'Qwen 2.5 Coder',
      provider: 'SiliconFlow',
      providerId: 'silicon'
    },
    {
      id: 'meta-llama/Llama-3.3-70B-Instruct',
      name: 'Llama 3.3 70B Instruct',
      provider: 'SiliconFlow',
      providerId: 'silicon'
    }
  ]
}

//
// =========================
// OLLAMA
// =========================
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
// =========================
// GATEWAY
// =========================
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
// =========================
// FINAL
// =========================
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

  const grouped = groupByProvider(
    dedupeModels([
      ...google,
      ...groq,
      ...openrouter,
      ...silicon,
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
