// lib/models.ts
import { Model } from '@/lib/types/models'
import { isProviderEnabled } from '@/lib/utils/registry'

// ─── Groq (5 fast models) ────────────────────────────
async function fetchGroqModels(): Promise<Model[]> {
  if (!isProviderEnabled('groq')) return []
  return [
    { id: "llama-3.1-8b-instant", name: "Llama 3.1 8B Instant", provider: "Groq", providerId: "groq" },
    { id: "llama-3.3-70b-versatile", name: "Llama 3.3 70B Versatile", provider: "Groq", providerId: "groq" },
    { id: "qwen-2.5-32b", name: "Qwen 2.5 32B", provider: "Groq", providerId: "groq" },
    { id: "mixtral-8x7b-32768", name: "Mixtral 8x7B", provider: "Groq", providerId: "groq" },
    { id: "gemma2-9b-it", name: "Gemma 2 9B", provider: "Groq", providerId: "groq" }
  ]
}

// ─── NVIDIA (5 small + fast models, no timeouts) ──────
async function fetchNvidiaModels(): Promise<Model[]> {
  if (!isProviderEnabled('nvidia')) return []
  return [
    { id: "meta/llama-3.1-8b-instruct", name: "Llama 3.1 8B", provider: "NVIDIA", providerId: "nvidia" },
    { id: "mistralai/mistral-7b-instruct-v0.3", name: "Mistral 7B v0.3", provider: "NVIDIA", providerId: "nvidia" },
    { id: "ibm/granite-3.1-8b-instruct", name: "Granite 3.1 8B", provider: "NVIDIA", providerId: "nvidia" },
    { id: "google/gemma-2-9b-it", name: "Gemma 2 9B", provider: "NVIDIA", providerId: "nvidia" },
    { id: "nvidia/nemotron-4-mini-4b-instruct", name: "Nemotron 4B Mini", provider: "NVIDIA", providerId: "nvidia" }
  ]
}

// ─── OpenRouter (12 models, NO OpenAI) ────────────────
async function fetchOpenRouterModels(): Promise<Model[]> {
  if (!isProviderEnabled('openrouter')) return []
  return [
    { id: "anthropic/claude-3.5-sonnet", name: "Claude 3.5 Sonnet", provider: "OpenRouter", providerId: "openrouter" },
    { id: "anthropic/claude-3-haiku", name: "Claude 3 Haiku", provider: "OpenRouter", providerId: "openrouter" },
    { id: "anthropic/claude-3-opus", name: "Claude 3 Opus", provider: "OpenRouter", providerId: "openrouter" },
    { id: "google/gemini-2.0-flash-001", name: "Gemini 2.0 Flash", provider: "OpenRouter", providerId: "openrouter" },
    { id: "meta-llama/llama-3.3-70b-instruct", name: "Llama 3.3 70B", provider: "OpenRouter", providerId: "openrouter" },
    { id: "meta-llama/llama-3.1-8b-instruct", name: "Llama 3.1 8B", provider: "OpenRouter", providerId: "openrouter" },
    { id: "deepseek/deepseek-chat", name: "DeepSeek V3", provider: "OpenRouter", providerId: "openrouter" },
    { id: "mistralai/mistral-large", name: "Mistral Large", provider: "OpenRouter", providerId: "openrouter" },
    { id: "mistralai/mistral-small", name: "Mistral Small", provider: "OpenRouter", providerId: "openrouter" },
    { id: "cohere/command-r-plus", name: "Command R+", provider: "OpenRouter", providerId: "openrouter" },
    { id: "google/gemma-2-9b-it", name: "Gemma 2 9B", provider: "OpenRouter", providerId: "openrouter" },
    { id: "perplexity/llama-3.1-sonar-large-128k-online", name: "Sonar Large (online)", provider: "OpenRouter", providerId: "openrouter" }
  ]
}

// ─── Anthropic (3 direct models) ──────────────────────
async function fetchAnthropicModels(): Promise<Model[]> {
  if (!isProviderEnabled('anthropic')) return []
  return [
    { id: "claude-3-5-sonnet-20241022", name: "Claude 3.5 Sonnet", provider: "Anthropic", providerId: "anthropic" },
    { id: "claude-3-opus-20240229", name: "Claude 3 Opus", provider: "Anthropic", providerId: "anthropic" },
    { id: "claude-3-haiku-20240307", name: "Claude 3 Haiku", provider: "Anthropic", providerId: "anthropic" }
  ]
}

// ─── Main exporter (29 models total) ──────────────────
export async function fetchAvailableModels(): Promise<Record<string, Model[]>> {
  const [groq, nvidia, openrouter, anthropic] = await Promise.all([
    fetchGroqModels(),
    fetchNvidiaModels(),
    fetchOpenRouterModels(),
    fetchAnthropicModels()
  ])

  // Google – best Flash & Pro models, no decommissioned
  const googleModels: Model[] = isProviderEnabled('google') ? [
    { id: "gemini-2.0-flash-001", name: "Gemini 2.0 Flash", provider: "Google", providerId: "google" },
    { id: "gemini-2.0-flash-lite-preview-02-05", name: "Gemini 2.0 Flash Lite", provider: "Google", providerId: "google" },
    { id: "gemini-2.5-pro-exp-03-25", name: "Gemini 2.5 Pro (experimental)", provider: "Google", providerId: "google" },
    { id: "gemini-1.5-pro", name: "Gemini 1.5 Pro", provider: "Google", providerId: "google" }
  ] : []

  // NO OpenAI – completely removed

  const allModels: Model[] = [
    ...groq,          // 5
    ...nvidia,        // 5
    ...openrouter,    // 12
    ...anthropic,     // 3
    ...googleModels   // 4
  ]                   // = 29

  const grouped: Record<string, Model[]> = {}
  allModels.forEach(model => {
    const p = model.provider
    if (!grouped[p]) grouped[p] = []
    grouped[p].push(model)
  })
  return grouped
}
