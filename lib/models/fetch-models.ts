import { createGateway } from '@ai-sdk/gateway'
import { Model } from '@/lib/types/models'
import { isProviderEnabled } from '@/lib/utils/registry'

export type ModelsByProvider = Record<string, Model[]>

//
// ✅ OPENAI
//
export async function fetchOpenAIModels(): Promise<Model[]> {
  if (!isProviderEnabled('openai')) return []

  return [
    {
      id: 'gpt-4o',
      name: 'GPT-4o',
      provider: 'OpenAI',
      providerId: 'openai'
    },
    {
      id: 'gpt-4o-mini',
      name: 'GPT-4o Mini',
      provider: 'OpenAI',
      providerId: 'openai'
    }
  ]
}

//
// ✅ GOOGLE
//
export async function fetchGoogleModels(): Promise<Model[]> {
  if (!isProviderEnabled('google')) return []

  return [
    {
      id: 'gemini-2.5-flash-lite',
      name: 'Gemini 2.5 Flash Lite',
      provider: 'Google',
      providerId: 'google'
    },
    {
      id: 'gemini-3-flash-preview',
      name: 'Gemini 3 Flash Preview',
      provider: 'Google',
      providerId: 'google'
    },
    {
      id: 'gemini-3.1-flash-lite-preview',
      name: 'Gemini 3.1 Flash Lite',
      provider: 'Google',
      providerId: 'google'
    }
  ]
}

//
// ✅ GROQ (ONLY WORKING MODELS)
//
export async function fetchGroqModels(): Promise<Model[]> {
  if (!isProviderEnabled('groq')) return []

  return [
    {
      id: 'llama-3.3-70b-versatile',
      name: 'Llama 3.3 70B',
      provider: 'Groq',
      providerId: 'groq'
    },
    {
      id: 'llama-3.1-8b-instant',
      name: 'Llama 3.1 8B Instant',
      provider: 'Groq',
      providerId: 'groq'
    }
  ]
}

//
// ✅ OLLAMA
//
export async function fetchOllamaModels(): Promise<Model[]> {
  return [
    {
      id: 'tinyllama',
      name: 'TinyLlama',
      provider: 'Ollama',
      providerId: 'ollama'
    },
    {
      id: 'llama3',
      name: 'Llama 3',
      provider: 'Ollama',
      providerId: 'ollama'
    },
    {
      id: 'mistral',
      name: 'Mistral',
      provider: 'Ollama',
      providerId: 'ollama'
    }
  ]
}

//
// ✅ ANTHROPIC
//
export async function fetchAnthropicModels(): Promise<Model[]> {
  if (!isProviderEnabled('anthropic')) return []

  return [
    {
      id: 'claude-sonnet-4',
      name: 'Claude Sonnet 4',
      provider: 'Anthropic',
      providerId: 'anthropic'
    }
  ]
}

//
// ✅ GATEWAY
//
export async function fetchGatewayModels(): Promise<Model[]> {
  if (!isProviderEnabled('gateway')) return []

  try {
    const gateway = createGateway({
      apiKey: process.env.AI_GATEWAY_API_KEY
    })

    const metadata = await gateway.getAvailableModels()

    return (metadata.models || []).map(model => ({
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
// ✅ FINAL
//
export async function fetchAvailableModels(): Promise<ModelsByProvider> {
  const [
    openai,
    google,
    groq,
    ollama,
    anthropic,
    gateway
  ] = await Promise.all([
    fetchOpenAIModels(),
    fetchGoogleModels(),
    fetchGroqModels(),
    fetchOllamaModels(),
    fetchAnthropicModels(),
    fetchGatewayModels()
  ])

  return {
    OpenAI: openai,
    Google: google,
    Groq: groq,
    Ollama: ollama,
    Anthropic: anthropic,
    Gateway: gateway
  }
}
