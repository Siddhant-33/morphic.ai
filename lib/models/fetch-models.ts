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
// =====================================
// OPENAI
// =====================================
//

export async function fetchOpenAIModels(): Promise<Model[]> {
  return [
    {
      id: 'gpt-5',
      name: 'GPT-5',
      provider: 'OpenAI',
      providerId: 'openai'
    },
    {
      id: 'gpt-5-mini',
      name: 'GPT-5 Mini',
      provider: 'OpenAI',
      providerId: 'openai'
    },
    {
      id: 'gpt-4.1',
      name: 'GPT-4.1',
      provider: 'OpenAI',
      providerId: 'openai'
    }
  ]
}

//
// =====================================
// GOOGLE
// =====================================
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
      name: 'Gemini Flash Lite',
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
// =====================================
// ANTHROPIC
// =====================================
//

export async function fetchAnthropicModels(): Promise<Model[]> {
  return [
    {
      id: 'claude-opus-4',
      name: 'Claude Opus 4',
      provider: 'Anthropic',
      providerId: 'anthropic'
    },
    {
      id: 'claude-sonnet-4',
      name: 'Claude Sonnet 4',
      provider: 'Anthropic',
      providerId: 'anthropic'
    },
    {
      id: 'claude-3-5-haiku',
      name: 'Claude Haiku',
      provider: 'Anthropic',
      providerId: 'anthropic'
    }
  ]
}

//
// =====================================
// DEEPSEEK
// =====================================
//

export async function fetchDeepSeekModels(): Promise<Model[]> {
  return [
    {
      id: 'deepseek-r1',
      name: 'DeepSeek R1',
      provider: 'DeepSeek',
      providerId: 'openai-compatible'
    },
    {
      id: 'deepseek-v3',
      name: 'DeepSeek V3',
      provider: 'DeepSeek',
      providerId: 'openai-compatible'
    }
  ]
}

//
// =====================================
// xAI / GROK
// =====================================
//

export async function fetchGrokModels(): Promise<Model[]> {
  return [
    {
      id: 'grok-3',
      name: 'Grok 3',
      provider: 'xAI',
      providerId: 'openai-compatible'
    },
    {
      id: 'grok-3-mini',
      name: 'Grok 3 Mini',
      provider: 'xAI',
      providerId: 'openai-compatible'
    }
  ]
}

//
// =====================================
// META
// =====================================
//

export async function fetchMetaModels(): Promise<Model[]> {
  return [
    {
      id: 'llama-4-maverick',
      name: 'Llama 4 Maverick',
      provider: 'Meta',
      providerId: 'groq'
    },
    {
      id: 'llama-3.3-70b-versatile',
      name: 'Llama 3.3 70B',
      provider: 'Meta',
      providerId: 'groq'
    }
  ]
}

//
// =====================================
// MISTRAL
// =====================================
//

export async function fetchMistralModels(): Promise<Model[]> {
  return [
    {
      id: 'mistral-large',
      name: 'Mistral Large',
      provider: 'Mistral',
      providerId: 'openai-compatible'
    },
    {
      id: 'mixtral-8x7b',
      name: 'Mixtral 8x7B',
      provider: 'Mistral',
      providerId: 'groq'
    }
  ]
}

//
// =====================================
// NVIDIA
// =====================================
//

export async function fetchNvidiaModels(): Promise<Model[]> {
  return [
    {
      id: 'nvidia-nemotron',
      name: 'NVIDIA Nemotron',
      provider: 'NVIDIA',
      providerId: 'openai-compatible'
    }
  ]
}

//
// =====================================
// PERPLEXITY
// =====================================
//

export async function fetchPerplexityModels(): Promise<Model[]> {
  return [
    {
      id: 'sonar-pro',
      name: 'Perplexity Sonar Pro',
      provider: 'Perplexity',
      providerId: 'openai-compatible'
    }
  ]
}

//
// =====================================
// CODING
// =====================================
//

export async function fetchCodingModels(): Promise<Model[]> {
  return [
    {
      id: 'qwen-coder',
      name: 'Qwen Coder',
      provider: 'Coding',
      providerId: 'openai-compatible'
    }
  ]
}

//
// =====================================
// OLLAMA
// =====================================
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
// =====================================
// GATEWAY
// =====================================
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
// =====================================
// FINAL
// =====================================
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
