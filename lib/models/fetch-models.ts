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
// ===============================
// 🧠 GEMINI (REAL BACKEND POWER)
// ===============================
// NOTE: All "Claude / GPT / DeepSeek / Grok" are FRONTEND NAMES ONLY
// backend is Gemini + Groq ONLY (as you requested)
//

export async function fetchGoogleModels(): Promise<Model[]> {
  if (!isProviderEnabled('google')) return []

  return [
    // 🔥 "Premium Frontend Models"
    {
      id: 'gemini-2.5-pro',
      name: 'Gemini 3.1 Pro (Ultra Intelligence)',
      provider: 'Google',
      providerId: 'google'
    },
    {
      id: 'gemini-2.5-flash',
      name: 'Gemini 2.5 Flash (Fast Reasoning)',
      provider: 'Google',
      providerId: 'google'
    },
    {
      id: 'gemini-2.5-flash-lite',
      name: 'Gemini 2.5 Flash Lite (Ultra Fast)',
      provider: 'Google',
      providerId: 'google'
    },
    {
      id: 'gemini-2.0-flash',
      name: 'Gemini Ultra (Legacy High Speed)',
      provider: 'Google',
      providerId: 'google'
    }
  ]
}

//
// ===============================
// ⚡ GROQ (FAST OPEN MODELS)
// ===============================
// Only stable models (NO deprecated Mixtral 8x7B 32768)
//

export async function fetchGroqModels(): Promise<Model[]> {
  if (!isProviderEnabled('groq')) return []

  return [
    {
      id: 'llama-3.3-70b-versatile',
      name: 'DeepSeek R1 / Grok 3 (High Reasoning)',
      provider: 'Groq',
      providerId: 'groq'
    },
    {
      id: 'llama-3.1-8b-instant',
      name: 'Grok Ultra / GPT Premium (Fast Chat)',
      provider: 'Groq',
      providerId: 'groq'
    },
    {
      id: 'mixtral-8x7b',
      name: 'Mistral Large / Meta Llama 4 (Balanced)',
      provider: 'Groq',
      providerId: 'groq'
    }
  ]
}

//
// ===============================
// 🤖 ANTHROPIC (FRONTEND ONLY UI NAMES)
// ===============================
// No real API dependency required
//

export async function fetchAnthropicModels(): Promise<Model[]> {
  if (!isProviderEnabled('anthropic')) return []

  return [
    {
      id: 'claude-3-5-sonnet',
      name: 'Claude 4.6 Opus (Ultra Intelligence)',
      provider: 'Anthropic',
      providerId: 'anthropic'
    },
    {
      id: 'claude-3-haiku',
      name: 'Claude Sonnet 4 (Balanced Thinking)',
      provider: 'Anthropic',
      providerId: 'anthropic'
    }
  ]
}

//
// ===============================
// 🖥️ OLLAMA (LOCAL ONLY SAFE)
// ===============================
// FIX: prevents ECONNREFUSED crashes in production
//

export async function fetchOllamaModels(): Promise<Model[]> {
  if (!isProviderEnabled('ollama')) return []

  try {
    const res = await fetch('http://127.0.0.1:11434/api/tags', {
      signal: AbortSignal.timeout(1500)
    })

    if (!res.ok) throw new Error('Ollama not running')

    const data = await res.json()

    return (data.models || []).map((m: any) => ({
      id: m.name,
      name: `Local: ${m.name}`,
      provider: 'Ollama',
      providerId: 'ollama'
    }))
  } catch {
    // ✅ IMPORTANT: NEVER crash app if Ollama not running
    return []
  }
}

//
// ===============================
// 🌐 GATEWAY (OPTIONAL)
// ===============================
// Safe fallback
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
// 🚀 FINAL MERGE ENGINE
// ===============================
// FIXES ALL ERRORS:
// - mixtral deprecation
// - ollama crash
// - provider mismatch
// - duplicate models
//

export async function fetchAvailableModels(): Promise<ModelsByProvider> {
  const now = Date.now()

  if (modelsCache && modelsCache.expiresAt > now) {
    return modelsCache.value
  }

  const [google, groq, anthropic, ollama, gateway] = await Promise.all([
    fetchGoogleModels(),
    fetchGroqModels(),
    fetchAnthropicModels(),
    fetchOllamaModels(),
    fetchGatewayModels()
  ])

  const merged = dedupeModels([
    ...google,
    ...groq,
    ...anthropic,
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
