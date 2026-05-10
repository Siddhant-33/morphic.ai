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
    const key = `${model.providerId}:${model.id}`  
  
    if (seen.has(key)) return false  
  
    seen.add(key)  
  
    return true  
  })  
}  
  
function groupByProvider(models: Model[]): ModelsByProvider {  
  return models.reduce((acc, model) => {  
    if (!acc[model.provider]) {  
      acc[model.provider] = []  
    }  
  
    acc[model.provider].push(model)  
  
    return acc  
  }, {} as ModelsByProvider)  
}  
  
//  
// ========================================  
// GOOGLE GEMINI  
// ========================================  
//  
  
export async function fetchGoogleModels(): Promise<Model[]> {  
  if (!isProviderEnabled('google')) return []  
  
  return [  
    {  
      id: 'gemini-2.5-pro',  
      name: 'Gemini 2.5 Pro',  
      provider: 'Google',  
      providerId: 'google'  
    },  
    {  
      id: 'gemini-2.5-flash',  
      name: 'Gemini 2.5 Flash',  
      provider: 'Google',  
      providerId: 'google'  
    },  
    {  
      id: 'gemini-2.5-flash-lite',  
      name: 'Gemini 2.5 Flash Lite',  
      provider: 'Google',  
      providerId: 'google'  
    },  
    {  
      id: 'gemini-2.0-flash',  
      name: 'Gemini 2.0 Flash',  
      provider: 'Google',  
      providerId: 'google'  
    },  
    {  
      id: 'gemini-1.5-pro',  
      name: 'Gemini 1.5 Pro',  
      provider: 'Google',  
      providerId: 'google'  
    },  
    {  
      id: 'gemini-1.5-flash',  
      name: 'Gemini 1.5 Flash',  
      provider: 'Google',  
      providerId: 'google'  
    }  
  ]  
}  
  
//  
// ========================================  
// DEEPSEEK  
// ========================================  
//  
  
export async function fetchDeepSeekModels(): Promise<Model[]> {  
  if (!isProviderEnabled('deepseek')) return []  
  
  return [  
    {  
      id: 'deepseek-chat',  
      name: 'DeepSeek Chat',  
      provider: 'DeepSeek',  
      providerId: 'deepseek'  
    },  
    {  
      id: 'deepseek-reasoner',  
      name: 'DeepSeek Reasoner',  
      provider: 'DeepSeek',  
      providerId: 'deepseek'  
    }  
  ]  
}  
  
//  
// ========================================  
// FIREWORKS  
// ========================================  
//  
  
export async function fetchFireworksModels(): Promise<Model[]> {  
  if (!isProviderEnabled('fireworks')) return []  
  
  return [  
    {  
      id: 'accounts/fireworks/models/llama-v3p1-70b-instruct',  
      name: 'Llama 3.1 70B',  
      provider: 'Fireworks',  
      providerId: 'fireworks'  
    },  
    {  
      id: 'accounts/fireworks/models/mixtral-8x7b-instruct',  
      name: 'Mixtral 8x7B',  
      provider: 'Fireworks',  
      providerId: 'fireworks'  
    },  
    {  
      id: 'accounts/fireworks/models/qwen2-72b-instruct',  
      name: 'Qwen 2 72B',  
      provider: 'Fireworks',  
      providerId: 'fireworks'  
    }  
  ]  
}  
  
//  
// ========================================  
// XAI (GROK)  
// ========================================  
//  
  
export async function fetchXaiModels(): Promise<Model[]> {  
  if (!isProviderEnabled('xai')) return []  
  
  return [  
    {  
      id: 'grok-beta',  
      name: 'Grok Beta',  
      provider: 'xAI',  
      providerId: 'xai'  
    },  
    {  
      id: 'grok-vision-beta',  
      name: 'Grok Vision Beta',  
      provider: 'xAI',  
      providerId: 'xai'  
    }  
  ]  
}  
  
//  
// ========================================  
// OPENROUTER  
// ========================================  
//  
  
export async function fetchOpenRouterModels(): Promise<Model[]> {  
  if (!isProviderEnabled('openrouter')) return []  
  
  return [  
    {  
      id: 'anthropic/claude-3.5-sonnet',  
      name: 'Claude 3.5 Sonnet',  
      provider: 'OpenRouter',  
      providerId: 'openrouter'  
    },  
    {  
      id: 'anthropic/claude-3.5-haiku',  
      name: 'Claude 3.5 Haiku',  
      provider: 'OpenRouter',  
      providerId: 'openrouter'  
    },  
    {  
      id: 'openai/gpt-4o',  
      name: 'GPT-4o',  
      provider: 'OpenRouter',  
      providerId: 'openrouter'  
    },  
    {  
      id: 'openai/gpt-4o-mini',  
      name: 'GPT-4o Mini',  
      provider: 'OpenRouter',  
      providerId: 'openrouter'  
    },  
    {  
      id: 'google/gemini-2.0-flash-exp',  
      name: 'Gemini 2.0 Flash',  
      provider: 'OpenRouter',  
      providerId: 'openrouter'  
    },  
    {  
      id: 'deepseek/deepseek-chat',  
      name: 'DeepSeek Chat',  
      provider: 'OpenRouter',  
      providerId: 'openrouter'  
    },  
    {  
      id: 'deepseek/deepseek-reasoner',  
      name: 'DeepSeek Reasoner',  
      provider: 'OpenRouter',  
      providerId: 'openrouter'  
    },  
    {  
      id: 'meta-llama/llama-3.1-70b-instruct',  
      name: 'Llama 3.1 70B',  
      provider: 'OpenRouter',  
      providerId: 'openrouter'  
    },  
    {  
      id: 'qwen/qwen-2.5-72b-instruct',  
      name: 'Qwen 2.5 72B',  
      provider: 'OpenRouter',  
      providerId: 'openrouter'  
    }  
  ]  
}  
  
//  
// ========================================  
// SILICONFLOW  
// ========================================  
//  
  
export async function fetchSiliconFlowModels(): Promise<Model[]> {  
  if (!isProviderEnabled('siliconflow')) return []  
  
  return [  
    {  
      id: 'deepseek-ai/DeepSeek-V3',  
      name: 'DeepSeek V3',  
      provider: 'SiliconFlow',  
      providerId: 'siliconflow'  
    },  
    {  
      id: 'Qwen/Qwen2.5-72B-Instruct',  
      name: 'Qwen 2.5 72B',  
      provider: 'SiliconFlow',  
      providerId: 'siliconflow'  
    },  
    {  
      id: 'Qwen/Qwen2.5-Coder-32B-Instruct',  
      name: 'Qwen 2.5 Coder',  
      provider: 'SiliconFlow',  
      providerId: 'siliconflow'  
    },  
    {  
      id: 'meta-llama/Meta-Llama-3.1-70B-Instruct',  
      name: 'Llama 3.1 70B',  
      provider: 'SiliconFlow',  
      providerId: 'siliconflow'  
    },  
    {  
      id: 'THUDM/glm-4-9b-chat',  
      name: 'GLM 4 9B',  
      provider: 'SiliconFlow',  
      providerId: 'siliconflow'  
    }  
  ]  
}  
  
//  
// ========================================  
// OLLAMA  
// ========================================  
//  
  
export async function fetchOllamaModels(): Promise<Model[]> {  
  return []  
}  
  
//  
// ========================================  
// GATEWAY  
// ========================================  
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
// ========================================  
// FINAL  
// ========================================  
//  
  
export async function fetchAvailableModels(): Promise<ModelsByProvider> {  
  const now = Date.now()  
  
  if (modelsCache && modelsCache.expiresAt > now) {  
    return modelsCache.value  
  }  
  
  const [  
    google,  
    deepseek,  
    fireworks,  
    xai,  
    openrouter,  
    siliconflow,  
    gateway  
  ] = await Promise.all([  
    fetchGoogleModels(),  
    fetchDeepSeekModels(),  
    fetchFireworksModels(),  
    fetchXaiModels(),  
    fetchOpenRouterModels(),  
    fetchSiliconFlowModels(),  
    fetchGatewayModels()  
  ])  
  
  const grouped = groupByProvider(  
    dedupeModels([  
      ...google,  
      ...deepseek,  
      ...fireworks,  
      ...xai,  
      ...openrouter,  
      ...siliconflow,  
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
