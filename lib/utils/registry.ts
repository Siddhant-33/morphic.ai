import { anthropic } from '@ai-sdk/anthropic'  
import { createGateway } from '@ai-sdk/gateway'  
import { google } from '@ai-sdk/google'  
import { createOpenAI, openai } from '@ai-sdk/openai'  
import { createProviderRegistry, LanguageModel } from 'ai'  
import { createOllama } from 'ai-sdk-ollama'  
  
const providers: Record<string, any> = {  
  openai,  
  anthropic,  
  google,  
  'openai-compatible': createOpenAI({  
    apiKey: process.env.OPENAI_COMPATIBLE_API_KEY,  
    baseURL: process.env.OPENAI_COMPATIBLE_API_BASE_URL  
  }),  
  gateway: createGateway({  
    apiKey: process.env.AI_GATEWAY_API_KEY  
  }),  
  // Custom providers  
  fireworks: createOpenAI({  
    apiKey: process.env.FIREWORKS_API_KEY,  
    baseURL: 'https://api.fireworks.ai/inference/v1'  
  }),  
  deepseek: createOpenAI({  
    apiKey: process.env.DEEPSEEK_API_KEY,  
    baseURL: 'https://api.deepseek.com'  
  }),  
  xai: createOpenAI({  
    apiKey: process.env.XAI_API_KEY,  
    baseURL: 'https://api.x.ai/v1'  
  }),  
  siliconflow: createOpenAI({  
    apiKey: process.env.SILICONFLOW_API_KEY,  
    baseURL: 'https://api.siliconflow.cn/v1'  
  }),  
  openrouter: createOpenAI({  
    apiKey: process.env.OPENROUTER_API_KEY,  
    baseURL: 'https://openrouter.ai/api/v1'  
  })  
}  
  
const ollamaProvider = process.env.OLLAMA_BASE_URL  
  ? createOllama({ baseURL: process.env.OLLAMA_BASE_URL })  
  : null  
  
if (ollamaProvider) {  
  providers.ollama = ollamaProvider  
}  
  
export const registry = createProviderRegistry(providers)  
  
export function getModel(model: string): LanguageModel {  
  if (model.startsWith('ollama:') && ollamaProvider) {  
    const modelId = model.slice('ollama:'.length)  
    const lm = ollamaProvider(modelId, { think: true })  
    Object.defineProperty(lm, 'supportedUrls', {  
      value: {},  
      configurable: true  
    })  
    return lm  
  }  
  return registry.languageModel(  
    model as Parameters<typeof registry.languageModel>[0]  
  )  
}  
  
export function isProviderEnabled(providerId: string): boolean {  
  switch (providerId) {  
    case 'openai': return !!process.env.OPENAI_API_KEY  
    case 'anthropic': return !!process.env.ANTHROPIC_API_KEY  
    case 'google': return !!process.env.GOOGLE_GENERATIVE_AI_API_KEY  
    case 'openai-compatible': return !!process.env.OPENAI_COMPATIBLE_API_KEY && !!process.env.OPENAI_COMPATIBLE_API_BASE_URL  
    case 'gateway': return !!process.env.AI_GATEWAY_API_KEY  
    case 'ollama': return !!process.env.OLLAMA_BASE_URL  
    case 'fireworks': return !!process.env.FIREWORKS_API_KEY  
    case 'deepseek': return !!process.env.DEEPSEEK_API_KEY  
    case 'xai': return !!process.env.XAI_API_KEY  
    case 'siliconflow': return !!process.env.SILICONFLOW_API_KEY  
    case 'openrouter': return !!process.env.OPENROUTER_API_KEY  
    default: return false  
  }  
}
