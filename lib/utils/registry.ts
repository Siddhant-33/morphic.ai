import { anthropic } from '@ai-sdk/anthropic'  
import { createGateway } from '@ai-sdk/gateway'  
import { google } from '@ai-sdk/google'  
import { createGroq } from '@ai-sdk/groq'  
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
  groq: createGroq({  
    apiKey: process.env.GROQ_API_KEY  
  }),  
  openrouter: createOpenAI({  
    apiKey: process.env.OPENROUTER_API_KEY,  
    baseURL: 'https://openrouter.ai/api/v1',  
    headers: {  
      'HTTP-Referer': 'https://morphic.sh',  
      'X-Title': 'Morphic'  
    }  
  }),  
  nvidia: createOpenAI({  
    apiKey: process.env.NVIDIA_API_KEY,  
    baseURL: 'https://integrate.api.nvidia.com/v1'  
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
    
    // Evaluate if the model supports thinking. Disable explicitly for tinyllama.
    const supportsThinking = !modelId.toLowerCase().includes('tinyllama')
    const lm = ollamaProvider(modelId, { think: supportsThinking })  
    
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
    case 'openai':  
      return !!process.env.OPENAI_API_KEY  
    case 'anthropic':  
      return !!process.env.ANTHROPIC_API_KEY  
    case 'google':  
      return !!process.env.GOOGLE_GENERATIVE_AI_API_KEY  
    case 'openai-compatible':  
      return (  
        !!process.env.OPENAI_COMPATIBLE_API_KEY &&  
        !!process.env.OPENAI_COMPATIBLE_API_BASE_URL  
      )  
    case 'gateway':  
      return !!process.env.AI_GATEWAY_API_KEY  
    case 'ollama':  
      return !!process.env.OLLAMA_BASE_URL  
    case 'groq':  
      return !!process.env.GROQ_API_KEY  
    case 'openrouter':  
      return !!process.env.OPENROUTER_API_KEY  
    case 'nvidia':  
      return !!process.env.NVIDIA_API_KEY  
    default:  
      return false  
  }  
}
