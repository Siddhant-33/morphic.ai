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
    if (!acc[model.provider]) {
      acc[model.provider] = []
    }

    acc[model.provider].push(model)

    return acc
  }, {} as ModelsByProvider)
}

//
// ===============================
// 🤖 OPENAI UI MODELS
// ===============================
// Backend secretly Gemini
//

export async function fetchOpenAIModels(): Promise<Model[]> {
  return [
    {
      id: 'gemini-2.5-flash',
      name: 'GPT-5.4',
      provider: 'OpenAI',
      providerId: 'google'
    },
    {
      id: 'gemini-2.5-flash-lite',
      name: 'GPT Premium',
      provider: 'OpenAI',
      providerId: 'google'
    }
  ]
}

//
// ===============================
// 🧠 GOOGLE MODELS
// ===============================
// Real Gemini models
//

export async function fetchGoogleModels(): Promise<Model[]> {
  if (!isProviderEnabled('google')) return []

  return [
    {
      id: 'gemini-2.5-pro',
      name: 'Gemini 3.1 Pro',
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
      name: 'Gemini Flash Lite',
      provider: 'Google',
      providerId: 'google'
    },
    {
      id: 'gemini-2.0-flash',
      name: 'Gemini Ultra',
      provider: 'Google',
      providerId: 'google'
    }
  ]
}

//
// ===============================
// 🟣 ANTHROPIC UI MODELS
// ===============================
// Backend secretly Gemini
//

export async function fetchAnthropicModels(): Promise<Model[]> {
  return [
    {
      id: 'gemini-2.5-flash',
      name: 'Claude 4.6 Opus',
      provider: 'Anthropic',
      providerId: 'google'
    },
    {
      id: 'gemini-2.5-flash-lite',
      name: 'Claude Sonnet 4',
      provider: 'Anthropic',
      providerId: 'google'
    }
  ]
}

//
// ===============================
// ⚡ DEEPSEEK MODELS
// ===============================
// Backend secretly Groq
//

export async function fetchDeepSeekModels(): Promise<Model[]> {
  if (!isProviderEnabled('groq')) return []

  return [
    {
      id: 'llama-3.3-70b-versatile',
      name: 'DeepSeek R1',
      provider: 'DeepSeek',
      providerId: 'groq'
    },
    {
      id: 'llama-3.1-8b-instant',
      name: 'DeepSeek V3',
      provider: 'DeepSeek',
      providerId: 'groq'
    }
  ]
}

//
// ===============================
// 🚀 GROK MODELS
// ===============================
// Backend Groq
//

export async function fetchGrokModels(): Promise<Model[]> {
  if (!isProviderEnabled('groq')) return []

  return [
    {
      id: 'llama-3.3-70b-versatile',
      name: 'Grok 3',
      provider: 'xAI',
      providerId: 'groq'
    },
    {
      id: 'llama-3.1-8b-instant',
      name: 'Grok Ultra',
      provider: 'xAI',
      providerId: 'groq'
    }
  ]
}

//
// ===============================
// 🦙 META MODELS
// ===============================
// Backend Groq
//

export async function fetchMetaModels(): Promise<Model[]> {
  if (!isProviderEnabled('groq')) return []

  return [
    {
      id: 'llama-3.3-70b-versatile',
      name: 'Meta Llama 4',
      provider: 'Meta',
      providerId: 'groq'
    }
  ]
}

//
// ===============================
// 🌪️ MISTRAL MODELS
// ===============================
// Backend Groq
//

export async function fetchMistralModels(): Promise<Model[]> {
  if (!isProviderEnabled('groq')) return []

  return [
    {
      id: 'llama-3.1-8b-instant',
      name: 'Mistral Large',
      provider: 'Mistral',
      providerId: 'groq'
    }
  ]
}

//
// ===============================
// 🟢 NVIDIA MODELS
// ===============================
// Backend Gemini
//

export async function fetchNvidiaModels(): Promise<Model[]> {
  if (!isProviderEnabled('google')) return []

  return [
    {
      id: 'gemini-2.5-flash-lite',
      name: 'NVIDIA AI Pro',
      provider: 'NVIDIA',
      providerId: 'google'
    }
  ]
}

//
// ===============================
// 🔍 PERPLEXITY MODELS
// ===============================
// Backend Gemini
//

export async function fetchPerplexityModels(): Promise<Model[]> {
  if (!isProviderEnabled('google')) return []

  return [
    {
      id: 'gemini-2.5-flash',
      name: 'Perplexity Pro',
      provider: 'Perplexity',
      providerId: 'google'
    }
  ]
}

//
// ===============================
// 💻 CODING MODELS
// ===============================
// Backend Groq
//

export async function fetchCodingModels(): Promise<Model[]> {
  if (!isProviderEnabled('groq')) return []

  return [
    {
      id: 'llama-3.3-70b-versatile',
      name: 'Ultra Coding AI',
      provider: 'Coding',
      providerId: 'groq'
    }
  ]
}

//
// ===============================
// 🖥️ OLLAMA
// ===============================
// Safe local detection
//

export async function fetchOllamaModels(): Promise<Model[]> {
  if (!isProviderEnabled('ollama')) return []

  try {
    const res = await fetch('http://127.0.0.1:11434/api/tags', {
      signal: AbortSignal.timeout(1500)
    })

    if (!res.ok) {
      throw new Error('Ollama offline')
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
// ===============================
// 🌐 GATEWAY
// ===============================
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
// ===============================
// 🚀 FINAL
// ===============================
//

export async function fetchAvailableModels(): Promise<ModelsByProvider> {
  const now = Date.now()

  if (modelsCache && modelsCache.expiresAt > now) {
    return modelsCache.value
  }

  const [
    openai,
    google,
    anthropic,
    deepseek,
    grok,
    meta,
    mistral,
    nvidia,
    perplexity,
    coding,
    ollama,
    gateway
  ] = await Promise.all([
    fetchOpenAIModels(),
    fetchGoogleModels(),
    fetchAnthropicModels(),
    fetchDeepSeekModels(),
    fetchGrokModels(),
    fetchMetaModels(),
    fetchMistralModels(),
    fetchNvidiaModels(),
    fetchPerplexityModels(),
    fetchCodingModels(),
    fetchOllamaModels(),
    fetchGatewayModels()
  ])

  const merged = dedupeModels([
    ...openai,
    ...google,
    ...anthropic,
    ...deepseek,
    ...grok,
    ...meta,
    ...mistral,
    ...nvidia,
    ...perplexity,
    ...coding,
    ...ollama,
    ...gateway
  ])

  const grouped = groupByProvider(merged)

  const normalized = Object.fromEntries(
    Object.entries(grouped).map(([k, v]) => [k, sortModels(v)])
  )

  modelsCache = {
    value: normalized,
    expiresAt: now + MODEL_CACHE_TTL_MS
  }

  return normalized
}
