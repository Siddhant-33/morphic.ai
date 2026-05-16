// lib/models.ts
import { Model } from '@/lib/types/models'
import { isProviderEnabled } from '@/lib/utils/registry'

// -------------------- Groq (5 models) --------------------
async function fetchGroqModels(): Promise<Model[]> {
  if (!isProviderEnabled('groq')) return []
  return [
    {
      id: "llama-3.1-8b-instant",
      name: "Llama 3.1 8B Instant",
      provider: "Groq",
      providerId: "groq"
    },
    {
      id: "llama-3.3-70b-versatile",
      name: "Llama 3.3 70B Versatile",
      provider: "Groq",
      providerId: "groq"
    },
    {
      id: "qwen-2.5-32b",
      name: "Qwen 2.5 32B",
      provider: "Groq",
      providerId: "groq"
    },
    {
      id: "mixtral-8x7b-32768",
      name: "Mixtral 8x7B",
      provider: "Groq",
      providerId: "groq"
    },
    {
      id: "gemma2-9b-it",
      name: "Gemma 2 9B",
      provider: "Groq",
      providerId: "groq"
    }
  ]
}

// -------------------- NVIDIA (5 models) --------------------
async function fetchNvidiaModels(): Promise<Model[]> {
  if (!isProviderEnabled('nvidia')) return []
  return [
    {
      id: "meta/llama-3.1-8b-instruct",
      name: "Llama 3.1 8B",
      provider: "NVIDIA",
      providerId: "nvidia"
    },
    {
      id: "mistralai/mistral-7b-instruct-v0.3",
      name: "Mistral 7B v0.3",
      provider: "NVIDIA",
      providerId: "nvidia"
    },
    {
      id: "ibm/granite-3.1-8b-instruct",
      name: "Granite 3.1 8B",
      provider: "NVIDIA",
      providerId: "nvidia"
    },
    {
      id: "nvidia/llama-3.1-nemotron-70b-instruct",
      name: "Nemotron 70B",
      provider: "NVIDIA",
      providerId: "nvidia"
    },
    {
      id: "meta/llama-3.3-70b-instruct",
      name: "Llama 3.3 70B",
      provider: "NVIDIA",
      providerId: "nvidia"
    }
  ]
}

// -------------------- OpenRouter (8 models) --------------------
async function fetchOpenRouterModels(): Promise<Model[]> {
  if (!isProviderEnabled('openrouter')) return []
  return [
    {
      id: "openai/gpt-4o",
      name: "GPT-4o",
      provider: "OpenRouter",
      providerId: "openrouter"
    },
    {
      id: "openai/gpt-4o-mini",
      name: "GPT-4o Mini",
      provider: "OpenRouter",
      providerId: "openrouter"
    },
    {
      id: "anthropic/claude-3.5-sonnet",
      name: "Claude 3.5 Sonnet",
      provider: "OpenRouter",
      providerId: "openrouter"
    },
    {
      id: "google/gemini-2.0-flash-001",
      name: "Gemini 2.0 Flash",
      provider: "OpenRouter",
      providerId: "openrouter"
    },
    {
      id: "meta-llama/llama-3.3-70b-instruct",
      name: "Llama 3.3 70B",
      provider: "OpenRouter",
      providerId: "openrouter"
    },
    {
      id: "deepseek/deepseek-chat",
      name: "DeepSeek V3",
      provider: "OpenRouter",
      providerId: "openrouter"
    },
    {
      id: "mistralai/mistral-large",
      name: "Mistral Large",
      provider: "OpenRouter",
      providerId: "openrouter"
    },
    {
      id: "cohere/command-r-plus",
      name: "Command R+",
      provider: "OpenRouter",
      providerId: "openrouter"
    }
  ]
}

// -------------------- Anthropic (3 models) --------------------
async function fetchAnthropicModels(): Promise<Model[]> {
  if (!isProviderEnabled('anthropic')) return []
  return [
    {
      id: "claude-3-5-sonnet-20241022",
      name: "Claude 3.5 Sonnet",
      provider: "Anthropic",
      providerId: "anthropic"
    },
    {
      id: "claude-3-opus-20240229",
      name: "Claude 3 Opus",
      provider: "Anthropic",
      providerId: "anthropic"
    },
    {
      id: "claude-3-haiku-20240307",
      name: "Claude 3 Haiku",
      provider: "Anthropic",
      providerId: "anthropic"
    }
  ]
}

// -------------------- Main exporter (30 models total) --------------------
export async function fetchAvailableModels(): Promise<Record<string, Model[]>> {
  const [groq, nvidia, openrouter, anthropic] = await Promise.all([
    fetchGroqModels(),
    fetchNvidiaModels(),
    fetchOpenRouterModels(),
    fetchAnthropicModels()
  ])

  // Hard‑coded providers (Google & OpenAI) – all IDs are live and working
  const googleModels: Model[] = isProviderEnabled('google')
    ? [
        {
          id: "gemini-1.5-flash",
          name: "Gemini 1.5 Flash",
          provider: "Google",
          providerId: "google"
        },
        {
          id: "gemini-1.5-pro",
          name: "Gemini 1.5 Pro",
          provider: "Google",
          providerId: "google"
        },
        {
          id: "gemini-2.0-flash-001",
          name: "Gemini 2.0 Flash",
          provider: "Google",
          providerId: "google"
        },
        {
          id: "gemini-2.5-pro-exp-03-25",
          name: "Gemini 2.5 Pro (experimental)",
          provider: "Google",
          providerId: "google"
        }
      ]
    : []

  const openaiModels: Model[] = isProviderEnabled('openai')
    ? [
        {
          id: "gpt-4o",
          name: "GPT-4o",
          provider: "OpenAI",
          providerId: "openai"
        },
        {
          id: "gpt-4o-mini",
          name: "GPT-4o Mini",
          provider: "OpenAI",
          providerId: "openai"
        },
        {
          id: "gpt-4-turbo",
          name: "GPT-4 Turbo",
          provider: "OpenAI",
          providerId: "openai"
        },
        {
          id: "o1-mini",
          name: "o1 Mini",
          provider: "OpenAI",
          providerId: "openai"
        },
        {
          id: "o1-preview",
          name: "o1 Preview",
          provider: "OpenAI",
          providerId: "openai"
        }
      ]
    : []

  const allModels: Model[] = [
    ...groq,          // 5
    ...nvidia,        // 5
    ...openrouter,    // 8
    ...anthropic,     // 3
    ...googleModels,  // 4
    ...openaiModels   // 5
  ]                   // = 30

  const grouped: Record<string, Model[]> = {}
  allModels.forEach(model => {
    const p = model.provider
    if (!grouped[p]) grouped[p] = []
    grouped[p].push(model)
  })

  return grouped
}
