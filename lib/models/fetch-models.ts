import { createGroq } from '@ai-sdk/groq'
import { createAnthropic } from '@ai-sdk/anthropic'
import { createGateway } from '@ai-sdk/gateway'

import { Model } from '@/lib/types/models'
import { isProviderEnabled } from '@/lib/utils/registry'

export type ModelsByProvider = Record<string, Model[]>

const MODEL_CACHE_TTL_MS = 2 * 60 * 1000
const DATE_SNAPSHOT_SUFFIX_REGEX = /-\d{4}-\d{2}-\d{2}$/

// ✅ CLEAN FILTERS
const OPENAI_ALLOWED_PREFIXES = ['gpt-4o', 'gpt-4o-mini']
const GOOGLE_ALLOWED_PREFIXES = ['gemini-3', 'gemini-3.1', 'gemini-2.5']

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

// ---------------- UTIL ----------------

function sortModels(models: Model[]): Model[] {
  return [...models].sort((a, b) => a.name.localeCompare(b.name))
}

function dedupeModels(models: Model[]): Model[] {
  const seen = new Set<string>()
  const out: Model[] = []

  for (const m of models) {
    const key = `${m.provider}|${m.providerId}|${m.id}`
    if (!seen.has(key)) {
      seen.add(key)
      out.push(m)
    }
  }
  return out
}

function groupByProvider(models: Model[]): ModelsByProvider {
  return models.reduce<ModelsByProvider>((acc, m) => {
    if (!acc[m.provider]) acc[m.provider] = []
    acc[m.provider].push(m)
    return acc
  }, {})
}

function hasDateSnapshotSuffix(id: string) {
  return DATE_SNAPSHOT_SUFFIX_REGEX.test(id)
}

// ---------------- FILTERS ----------------

function passesOpenAI(id: string) {
  if (hasDateSnapshotSuffix(id)) return false
  return OPENAI_ALLOWED_PREFIXES.some(p => id.startsWith(p))
}

function passesGoogle(id: string) {
  if (hasDateSnapshotSuffix(id)) return false
  return GOOGLE_ALLOWED_PREFIXES.some(p => id.startsWith(p))
}

function passesAnthropic(id: string) {
  if (hasDateSnapshotSuffix(id)) return false
  return ANTHROPIC_ALLOWED_PREFIXES.some(p => id.startsWith(p))
}

// ---------------- FETCH HELPERS ----------------

async function fetchJson(url: string, headers: HeadersInit) {
  const res = await fetch(url, { headers })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

// ---------------- OPENAI ----------------

export async function fetchOpenAIModels(): Promise<Model[]> {
  if (!isProviderEnabled('openai')) return []

  try {
    const json = await fetchJson('https://api.openai.com/v1/models', {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`
    })

    return sortModels(
      dedupeModels(
        (json.data || [])
          .map((x: any) => x.id)
          .filter(passesOpenAI)
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

// ---------------- GOOGLE ----------------

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
          .map((m: any) => m.name.replace('models/', ''))
          .filter(passesGoogle)
          .map((id: string) => ({
            id,
            name: id,
            provider: 'Google',
            providerId: 'google'
          }))
      )
    )
  } catch {
    return []
  }
}

// ---------------- ANTHROPIC ----------------

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
          .map((m: any) => ({
            id: m.id,
            name: m.display_name || m.id,
            provider: 'Anthropic',
            providerId: 'anthropic'
          }))
          .filter((m: Model) => passesAnthropic(m.id))
      )
    )
  } catch {
    return []
  }
}

// ---------------- GROQ (FIXED ✅) ----------------

export async function fetchGroqModels(): Promise<Model[]> {
  if (!isProviderEnabled('groq')) return []

  // ❌ NO API CALL
  // ✅ HARDCODE BEST MODELS

  return [
    {
      id: 'llama-3.3-70b-versatile',
      name: 'Llama 3.3 70B (Free)',
      provider: 'Groq',
      providerId: 'groq'
    },
    {
      id: 'llama-3.1-70b-versatile',
      name: 'Llama 3.1 70B (Free)',
      provider: 'Groq',
      providerId: 'groq'
    },
    {
      id: 'mixtral-8x7b-32768',
      name: 'Mixtral 8x7B',
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

// ---------------- FINAL ----------------

export async function fetchAvailableModels(): Promise<ModelsByProvider> {
  const now = Date.now()

  if (modelsCache && modelsCache.expiresAt > now) {
    return modelsCache.value
  }

  const [openai, google, anthropic, groq] = await Promise.all([
    fetchOpenAIModels(),
    fetchGoogleModels(),
    fetchAnthropicModels(),
    fetchGroqModels()
  ])

  const grouped = groupByProvider(
    dedupeModels([...openai, ...google, ...anthropic, ...groq])
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
