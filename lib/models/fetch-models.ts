import { Model } from '@/lib/types/models'
import { isProviderEnabled } from '@/lib/utils/registry'

async function fetchGroqModels(): Promise<Model[]> {
  if (!isProviderEnabled('groq')) return []
  return [
    { id: "llama-3.1-8b-instant", name: "Llama 3.1 8B Instant", provider: "Groq", providerId: "groq" },
    { id: "llama-3.3-70b-versatile", name: "Llama 3.3 70B Versatile", provider: "Groq", providerId: "groq" },
    { id: "openai/gpt-oss-20b", name: "GPT-OSS 20B (Fast)", provider: "Groq", providerId: "groq" },
    { id: "qwen/qwen3-32b", name: "Qwen3 32B", provider: "Groq", providerId: "groq" },
  ]
}

async function fetchNvidiaModels(): Promise<Model[]> {
  if (!isProviderEnabled('nvidia')) return []
  return [
    { id: "deepseek-ai/deepseek-v4-flash", name: "DeepSeek V4 Flash", provider: "NVIDIA", providerId: "nvidia" },
    { id: "minimaxai/minimax-m2.7", name: "MiniMax M2.7", provider: "NVIDIA", providerId: "nvidia" },
    { id: "glm/glm-5.1", name: "GLM-5.1", provider: "NVIDIA", providerId: "nvidia" },
  ]
}

export async function fetchAvailableModels(): Promise<Record<string, Model[]>> {
  const [groq, nvidia] = await Promise.all([
    fetchGroqModels(),
    fetchNvidiaModels(),
  ])

  const allModels: Model[] = [
    ...groq,
    ...nvidia,

    // Best Gemini Models
    { id: "gemini-3.1-flash", name: "Gemini 3.1 Flash", provider: "Google", providerId: "google" },
    { id: "gemini-3.1-flash-lite", name: "Gemini 3.1 Flash Lite", provider: "Google", providerId: "google" },
    { id: "gemini-3.1-pro-preview", name: "Gemini 3.1 Pro Preview", provider: "Google", providerId: "google" },
    { id: "gemini-2.5-pro", name: "Gemini 2.5 Pro", provider: "Google", providerId: "google" },
    { id: "gemini-2.5-flash", name: "Gemini 2.5 Flash", provider: "Google", providerId: "google" },
  ]

  const grouped: Record<string, Model[]> = {}
  allModels.forEach(model => {
    const p = model.provider
    if (!grouped[p]) grouped[p] = []
    grouped[p].push(model)
  })

  return grouped
}
