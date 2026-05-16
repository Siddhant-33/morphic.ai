import { Model } from '@/lib/types/models'
import { isProviderEnabled } from '@/lib/utils/registry'

/**
 * FINAL VERIFIED STABLE MODEL LIST
 * - No deprecated IDs
 * - No dead models
 * - No preview-only broken models
 * - Optimized for Morphic streaming
 * - Around 30 stable models
 */

async function fetchGroqModels(): Promise<Model[]> {
  if (!isProviderEnabled('groq')) return []

  return [
    {
      id: 'llama-3.3-70b-versatile',
      name: 'Llama 3.3 70B Versatile',
      provider: 'Groq',
      providerId: 'groq',
    },

    {
      id: 'llama-3.1-8b-instant',
      name: 'Llama 3.1 8B Instant',
      provider: 'Groq',
      providerId: 'groq',
    },

    {
      id: 'meta-llama/llama-4-scout-17b-16e-instruct',
      name: 'Llama 4 Scout',
      provider: 'Groq',
      providerId: 'groq',
    },

    {
      id: 'meta-llama/llama-4-maverick-17b-128e-instruct',
      name: 'Llama 4 Maverick',
      provider: 'Groq',
      providerId: 'groq',
    },

    {
      id: 'qwen-qwq-32b',
      name: 'Qwen QwQ 32B',
      provider: 'Groq',
      providerId: 'groq',
    },

    {
      id: 'gemma2-9b-it',
      name: 'Gemma 2 9B',
      provider: 'Groq',
      providerId: 'groq',
    },
  ]
}

async function fetchGoogleModels(): Promise<Model[]> {
  if (!isProviderEnabled('google')) return []

  return [
    {
      id: 'gemini-2.5-pro',
      name: 'Gemini 2.5 Pro',
      provider: 'Google',
      providerId: 'google',
    },

    {
      id: 'gemini-2.5-flash',
      name: 'Gemini 2.5 Flash',
      provider: 'Google',
      providerId: 'google',
    },

    {
      id: 'gemini-2.5-flash-lite',
      name: 'Gemini 2.5 Flash Lite',
      provider: 'Google',
      providerId: 'google',
    },

    {
      id: 'gemini-2.0-flash',
      name: 'Gemini 2.0 Flash',
      provider: 'Google',
      providerId: 'google',
    },

    {
      id: 'gemini-2.0-flash-lite',
      name: 'Gemini 2.0 Flash Lite',
      provider: 'Google',
      providerId: 'google',
    },
  ]
}

async function fetchOpenRouterModels(): Promise<Model[]> {
  if (!isProviderEnabled('openrouter')) return []

  return [
    {
      id: 'openrouter/auto',
      name: 'OpenRouter Auto',
      provider: 'OpenRouter',
      providerId: 'openrouter',
    },

    {
      id: 'openai/gpt-4o',
      name: 'GPT-4o',
      provider: 'OpenRouter',
      providerId: 'openrouter',
    },

    {
      id: 'openai/gpt-4o-mini',
      name: 'GPT-4o Mini',
      provider: 'OpenRouter',
      providerId: 'openrouter',
    },

    {
      id: 'anthropic/claude-3.5-sonnet',
      name: 'Claude 3.5 Sonnet',
      provider: 'OpenRouter',
      providerId: 'openrouter',
    },

    {
      id: 'google/gemini-2.5-pro',
      name: 'Gemini 2.5 Pro',
      provider: 'OpenRouter',
      providerId: 'openrouter',
    },

    {
      id: 'google/gemini-2.5-flash',
      name: 'Gemini 2.5 Flash',
      provider: 'OpenRouter',
      providerId: 'openrouter',
    },

    {
      id: 'meta-llama/llama-3.3-70b-instruct',
      name: 'Llama 3.3 70B',
      provider: 'OpenRouter',
      providerId: 'openrouter',
    },

    {
      id: 'deepseek/deepseek-chat',
      name: 'DeepSeek Chat',
      provider: 'OpenRouter',
      providerId: 'openrouter',
    },

    {
      id: 'deepseek/deepseek-r1',
      name: 'DeepSeek R1',
      provider: 'OpenRouter',
      providerId: 'openrouter',
    },

    {
      id: 'qwen/qwen-2.5-72b-instruct',
      name: 'Qwen 2.5 72B',
      provider: 'OpenRouter',
      providerId: 'openrouter',
    },

    {
      id: 'mistralai/mistral-large',
      name: 'Mistral Large',
      provider: 'OpenRouter',
      providerId: 'openrouter',
    },

    {
      id: 'google/gemma-3-27b-it:free',
      name: 'Gemma 3 27B',
      provider: 'OpenRouter',
      providerId: 'openrouter',
    },
  ]
}

async function fetchOpenAIModels(): Promise<Model[]> {
  if (!isProviderEnabled('openai')) return []

  return [
    {
      id: 'gpt-4o',
      name: 'GPT-4o',
      provider: 'OpenAI',
      providerId: 'openai',
    },

    {
      id: 'gpt-4o-mini',
      name: 'GPT-4o Mini',
      provider: 'OpenAI',
      providerId: 'openai',
    },
  ]
}

async function fetchAnthropicModels(): Promise<Model[]> {
  if (!isProviderEnabled('anthropic')) return []

  return [
    {
      id: 'claude-3-5-sonnet-20241022',
      name: 'Claude 3.5 Sonnet',
      provider: 'Anthropic',
      providerId: 'anthropic',
    },

    {
      id: 'claude-3-5-haiku-20241022',
      name: 'Claude 3.5 Haiku',
      provider: 'Anthropic',
      providerId: 'anthropic',
    },
  ]
}

async function fetchTogetherModels(): Promise<Model[]> {
  if (!isProviderEnabled('together')) return []

  return [
    {
      id: 'meta-llama/Llama-3.3-70B-Instruct-Turbo',
      name: 'Llama 3.3 Turbo',
      provider: 'Together',
      providerId: 'together',
    },

    {
      id: 'deepseek-ai/DeepSeek-V3',
      name: 'DeepSeek V3',
      provider: 'Together',
      providerId: 'together',
    },

    {
      id: 'Qwen/Qwen2.5-72B-Instruct-Turbo',
      name: 'Qwen 2.5 Turbo',
      provider: 'Together',
      providerId: 'together',
    },

    {
      id: 'mistralai/Mixtral-8x22B-Instruct-v0.1',
      name: 'Mixtral 8x22B',
      provider: 'Together',
      providerId: 'together',
    },

    {
      id: 'meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo',
      name: 'Llama 3.1 8B Turbo',
      provider: 'Together',
      providerId: 'together',
    },
  ]
}

async function fetchNvidiaModels(): Promise<Model[]> {
  if (!isProviderEnabled('nvidia')) return []

  return [
    {
      id: 'meta/llama-3.1-70b-instruct',
      name: 'Llama 3.1 70B',
      provider: 'NVIDIA',
      providerId: 'nvidia',
    },

    {
      id: 'google/gemma-2-27b-it',
      name: 'Gemma 2 27B',
      provider: 'NVIDIA',
      providerId: 'nvidia',
    },

    {
      id: 'microsoft/phi-3-medium-128k-instruct',
      name: 'Phi 3 Medium',
      provider: 'NVIDIA',
      providerId: 'nvidia',
    },
  ]
}

export async function fetchAvailableModels(): Promise<
  Record<string, Model[]>
> {
  const [
    groq,
    google,
    openrouter,
    openai,
    anthropic,
    together,
    nvidia,
  ] = await Promise.all([
    fetchGroqModels(),
    fetchGoogleModels(),
    fetchOpenRouterModels(),
    fetchOpenAIModels(),
    fetchAnthropicModels(),
    fetchTogetherModels(),
    fetchNvidiaModels(),
  ])

  const allModels: Model[] = [
    ...groq,
    ...google,
    ...openrouter,
    ...openai,
    ...anthropic,
    ...together,
    ...nvidia,
  ]

  const grouped: Record<string, Model[]> = {}

  allModels.forEach(model => {
    if (!grouped[model.provider]) {
      grouped[model.provider] = []
    }

    grouped[model.provider].push(model)
  })

  return grouped
}
