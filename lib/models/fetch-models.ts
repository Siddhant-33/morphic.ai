import { Model } from '@/lib/types/models'
import { isProviderEnabled } from '@/lib/utils/registry'

async function fetchGroqModels(): Promise<Model[]> {
  if (!isProviderEnabled('groq')) return []
  return [
    { id: "llama-3.1-8b-instant", name: "Llama 3.1 8B Instant (Ultra Fast)", provider: "Groq", providerId: "groq" },
    { id: "llama-3.3-70b-versatile", name: "Llama 3.3 70B Versatile (Best Balance)", provider: "Groq", providerId: "groq" },
    { id: "openai/gpt-oss-120b", name: "GPT-OSS 120B (Strong Reasoning)", provider: "Groq", providerId: "groq" },
    { id: "openai/gpt-oss-20b", name: "GPT-OSS 20B (Fastest)", provider: "Groq", providerId: "groq" },
    { id: "qwen/qwen3-32b", name: "Qwen3 32B (Best Coding)", provider: "Groq", providerId: "groq" },
    { id: "meta-llama/llama-4-scout-17b-16e-instruct", name: "Llama 4 Scout", provider: "Groq", providerId: "groq" },
  ]
}

async function fetchNvidiaModels(): Promise<Model[]> {
  if (!isProviderEnabled('nvidia')) return []
  return [
    { id: "minimax/minimax-m2.7", name: "MiniMax M2.7 (NVIDIA Best)", provider: "NVIDIA", providerId: "nvidia" },
    { id: "deepseek-ai/deepseek-v4-flash", name: "DeepSeek V4 Flash (Fast)", provider: "NVIDIA", providerId: "nvidia" },
    { id: "deepseek-ai/deepseek-v4", name: "DeepSeek V4", provider: "NVIDIA", providerId: "nvidia" },
    { id: "gpt-oss/gpt-oss-120b", name: "GPT-OSS 120B", provider: "NVIDIA", providerId: "nvidia" },
    { id: "glm/glm-5.1", name: "GLM-5.1", provider: "NVIDIA", providerId: "nvidia" },
    { id: "kimi/kimi-k2.5", name: "Kimi K2.5", provider: "NVIDIA", providerId: "nvidia" },
  ]
}

async function fetchOpenRouterModels(): Promise<Model[]> {
  if (!isProviderEnabled('openrouter')) return []
  return [
    { id: "openrouter/auto", name: "OpenRouter Auto (Best Free)", provider: "OpenRouter", providerId: "openrouter" },
    { id: "deepseek/deepseek-r1:free", name: "DeepSeek R1 Free", provider: "OpenRouter", providerId: "openrouter" },
    { id: "qwen/qwen2.5-72b-instruct:free", name: "Qwen 72B Free", provider: "OpenRouter", providerId: "openrouter" },
    { id: "meta-llama/llama-4-scout:free", name: "Llama 4 Scout Free", provider: "OpenRouter", providerId: "openrouter" },
    { id: "google/gemini-flash-1.5:free", name: "Gemini Flash Free", provider: "OpenRouter", providerId: "openrouter" },
    { id: "nvidia/nemotron-3-super-120b-a12b:free", name: "Nemotron Super Free", provider: "OpenRouter", providerId: "openrouter" },
  ]
}

export async function fetchAvailableModels(): Promise<Record<string, Model[]>> {
  const [groq, nvidia, openrouter] = await Promise.all([
    fetchGroqModels(),
    fetchNvidiaModels(),
    fetchOpenRouterModels(),
  ])

  const allModels: Model[] = [
    ...groq,
    ...nvidia,
    ...openrouter,

    // Best Gemini Models
    { id: "gemini-3.1-pro-preview", name: "Gemini 3.1 Pro Preview (Most Powerful)", provider: "Google", providerId: "google" },
    { id: "gemini-3.1-flash", name: "Gemini 3.1 Flash", provider: "Google", providerId: "google" },
    { id: "gemini-3.1-flash-lite", name: "Gemini 3.1 Flash Lite", provider: "Google", providerId: "google" },
    { id: "gemini-2.5-pro", name: "Gemini 2.5 Pro", provider: "Google", providerId: "google" },
    { id: "gemini-2.5-flash", name: "Gemini 2.5 Flash", provider: "Google", providerId: "google" },
    { id: "gemini-2.0-pro", name: "Gemini 2.0 Pro", provider: "Google", providerId: "google" },
    { id: "gemini-2.0-flash", name: "Gemini 2.0 Flash", provider: "Google", providerId: "google" },

    { id: "gpt-4o-mini", name: "GPT-4o Mini", provider: "OpenAI", providerId: "openai" },
  ]

  const grouped: Record<string, Model[]> = {}
  allModels.forEach(model => {
    const p = model.provider
    if (!grouped[p]) grouped[p] = []
    grouped[p].push(model)
  })

  return grouped
}
