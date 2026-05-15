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
    { id: "minimax/minimax-m2.7", name: "MiniMax M2.7 (Best Overall)", provider: "NVIDIA", providerId: "nvidia" },
    { id: "deepseek-ai/deepseek-v4-flash", name: "DeepSeek V4 Flash", provider: "NVIDIA", providerId: "nvidia" },
    { id: "deepseek-ai/deepseek-v4", name: "DeepSeek V4", provider: "NVIDIA", providerId: "nvidia" },
    { id: "gpt-oss/gpt-oss-120b", name: "GPT-OSS 120B", provider: "NVIDIA", providerId: "nvidia" },
    { id: "glm/glm-5.1", name: "GLM-5.1", provider: "NVIDIA", providerId: "nvidia" },
    { id: "kimi/kimi-k2.5", name: "Kimi K2.5", provider: "NVIDIA", providerId: "nvidia" },
  ]
}

async function fetchOpenRouterModels(): Promise<Model[]> {
  if (!isProviderEnabled('openrouter')) return []
  return [
    { id: "openrouter/free", name: "OpenRouter Free Router (Random Best)", provider: "OpenRouter", providerId: "openrouter" },
    { id: "deepseek/deepseek-r1:free", name: "DeepSeek R1 (Free)", provider: "OpenRouter", providerId: "openrouter" },
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

    // Gemini Models (More Added)
    { id: "gemini-3.1-pro-preview", name: "Gemini 3.1 Pro Preview (Most Powerful)", provider: "Google", providerId: "google" },
    { id: "gemini-3.1-flash", name: "Gemini 3.1 Flash", provider: "Google", providerId: "google" },
    { id: "gemini-3.1-flash-lite", name: "Gemini 3.1 Flash Lite", provider: "Google", providerId: "google" },
    { id: "gemini-2.5-pro", name: "Gemini 2.5 Pro", provider: "Google", providerId: "google" },
    { id: "gemini-2.5-flash", name: "Gemini 2.5 Flash", provider: "Google", providerId: "google" },
    
    { id: "gpt-4o-mini", name: "GPT-4o Mini", provider: "OpenAI", providerId: "openai" },
  ]

  // Group by provider
  const grouped: Record<string, Model[]> = {}
  allModels.forEach(model => {
    const provider = model.provider
    if (!grouped[provider]) grouped[provider] = []
    grouped[provider].push(model)
  })

  return grouped
}
