import { createGroq } from '@ai-sdk/groq'
import { createAnthropic } from '@ai-sdk/anthropic'
import { createGateway } from '@ai-sdk/gateway'

import { Model } from '@/lib/types/models'
import { isProviderEnabled } from '@/lib/utils/registry'

export type ModelsByProvider = Record<string, Model[]>

// ✅ CLEAN MODELS
const OPENAI_ALLOWED_PREFIXES = ['gpt-5', 'gpt-4']
const GOOGLE_ALLOWED_PREFIXES = ['gemini-2.5', 'gemini-3']

const MODEL_CACHE_TTL_MS = 2 * 60 * 1000
const DATE_SNAPSHOT_SUFFIX_REGEX = /-\d{4}-\d{2}-\d{2}$/

const OPENAI_EXCLUDED_KEYWORDS = [
  'embed',
  'tts',
  'whisper',
  'dall-e',
  'davinci',
  'babbage',
  'ft:',
  'image',
  'audio',
  'realtime',
  'codex',
  'search',
  'transcribe',
  'deep-research',
  'oss',
  'instruct'
]

const ANTHROPIC_ALLOWED_PREFIXES = [
  'claude-opus-4',
  'claude-sonnet-4',
  'claude-haiku-4'
]

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
  const deduped: Model[] = []

  for (const model of models) {
    const key = `${model.provider}|${model.providerId}|${model.id}`
    if (seen.has(key)) continue
    seen.add(key)
    deduped.push(model)
  }

  return deduped
}

function groupByProvider(models: Model[]): ModelsByProvider {
  return models.reduce<ModelsByProvider>((acc, model) => {
    if (!acc[model.provider]) acc[model.provider] = []
    acc[model.provider].push(model)
    return acc
  }, {})
}

function hasDateSnapshotSuffix(id: string): boolean {
  return DATE_SNAPSHOT_SUFFIX_REGEX.test(id)
}

function passesOpenAIFilters(id: string): boolean {
  if (hasDateSnapshotSuffix(id)) return false

  if (!OPENAI_ALLOWED_PREFIXES.some(p => id.startsWith(p))) return false

  return !OPENAI_EXCLUDED_KEYWORDS.some(k =>
    id.toLowerCase().includes(k)
  )
}

function passesAnthropicFilters(id: string): boolean {
  if (hasDateSnapshotSuffix(id)) return false
  return ANTHROPIC_ALLOWED_PREFIXES.some(p => id.startsWith(p))
}

function passesGoogleFilters(id: string): boolean {
  if (hasDateSnapshotSuffix(id)) return false

  const lower = id.toLowerCase()

  if (
    lower.includes('image') ||
    lower.includes('embedding') ||
    lower.includes('audio') ||
    lower.includes('vision')
  ) return false

  return GOOGLE_ALLOWED_PREFIXES.some(p => id.startsWith(p))
}

function passesGatewayFilters(id: string): boolean {
  if (hasDateSnapshotSuffix(id)) return false

  const i = id.indexOf('/')
  if (i <= 0) return true

  const provider = id.slice(0, i)
  const modelId = id.slice(i + 1)

  switch (provider) {
    case 'openai':
      return passesOpenAIFilters(modelId)
    case 'anthropic':
      return passesAnthropicFilters(modelId)
    case 'google':
      return passesGoogleFilters(modelId)
    default:
      return true
  }
}

async function fetchJson(url: string, headers: HeadersInit) {
  const res = await fetch(url, { headers })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

// 🔥 OPENAI
export async function fetchOpenAIModels(): Promise<Model[]> {
  if (!isProviderEnabled('openai')) return []

  try {
    const json = await fetchJson('https://api.openai.com/v1/models', {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`
    })

    return sortModels(
      dedupeModels(
        (json.data || [])
          .map((i: any) => i.id)
          .filter(Boolean)
          .filter(passesOpenAIFilters)
          .map((id: string) => ({
            id,
            name: id,
            provider: 'OpenAI',
            providerId: 'openai'
          }))
      )
    )
  } catch {
    return []
  }
}

// 🔥 ANTHROPIC
export async function fetchAnthropicModels(): Promise<Model[]> {
  if (!isProviderEnabled('anthropic')) return []

  try {
    const json = await fetchJson('https://api.anthropic.com/v1/models', {
      'x-api-key': process.env.ANTHROPIC_API_KEY!,
      'anthropic-version': '2023-06-01'
    })

    return sortModels(
      dedupeModels(
        (json.data || [])
          .map((i: any) => ({
            id: i.id,
            name: i.display_name || i.id,
            provider: 'Anthropic',
            providerId: 'anthropic'
          }))
          .filter((m: Model) => passesAnthropicFilters(m.id))
      )
    )
  } catch {
    return []
  }
}

// 🔥 GOOGLE
export async function fetchGoogleModels(): Promise<Model[]> {
  if (!isProviderEnabled('google')) return []

  try {
    const json = await fetchJson(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.GOOGLE_GENERATIVE_AI_API_KEY}`,
      {}
    )

    return sortModels(
      dedupeModels(
        (json.models || [])
          .map((m: any) => {
            const id = m.name.replace('models/', '')
            return {
              id,
              name: m.displayName || id,
              provider: 'Google',
              providerId: 'google'
            }
          })
          .filter((m: Model) => passesGoogleFilters(m.id))
      )
    )
  } catch {
    return []
  }
}

// 🔥 GROQ (NEW)
export async function fetchGroqModels(): Promise<Model[]> {
  if (!isProviderEnabled('groq')) return []

  try {
    const groq = createGroq({
      apiKey: process.env.GROQ_API_KEY
    })

    const models = await groq.models.list()

    return sortModels(
      dedupeModels(
        models.data
          .map((m: any) => ({
            id: m.id,
            name: m.id,
            provider: 'Groq',
            providerId: 'groq'
          }))
          .filter((m: Model) =>
            !m.id.toLowerCase().includes('embed')
          )
      )
    )
  } catch {
    return []
  }
}

// 🔥 OLLAMA
export async function fetchOllamaModels(): Promise<Model[]> {
  if (!isProviderEnabled('ollama')) return []

  try {
    const json = await fetchJson(
      `${process.env.OLLAMA_BASE_URL}/api/tags`,
      {}
    )

    return sortModels(
      dedupeModels(
        (json.models || [])
          .map((m: any) => ({
            id: m.name,
            name: m.name,
            provider: 'Ollama',
            providerId: 'ollama'
          }))
      )
    )
  } catch {
    return []
  }
}

// 🔥 GATEWAY
export async function fetchGatewayModels(): Promise<Model[]> {
  if (!isProviderEnabled('gateway')) return []

  try {
    const gateway = createGateway({
      apiKey: process.env.AI_GATEWAY_API_KEY
    })

    const data = await gateway.getAvailableModels()

    return sortModels(
      dedupeModels(
        (data.models || [])
          .map((m: any) => ({
            id: m.id,
            name: m.name || m.id,
            provider: 'Gateway',
            providerId: 'gateway'
          }))
          .filter((m: Model) => passesGatewayFilters(m.id))
      )
    )
  } catch {
    return []
  }
}

// 🔥 MAIN
export async function fetchAvailableModels(): Promise<ModelsByProvider> {
  const now = Date.now()

  if (modelsCache && modelsCache.expiresAt > now) {
    return modelsCache.value
  }

  const [openai, anthropic, google, groq, ollama, gateway] =
    await Promise.all([
      fetchOpenAIModels(),
      fetchAnthropicModels(),
      fetchGoogleModels(),
      fetchGroqModels(),
      fetchOllamaModels(),
      fetchGatewayModels()
    ])

  const grouped = groupByProvider(
    dedupeModels([
      ...openai,
      ...anthropic,
      ...google,
      ...groq,
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
