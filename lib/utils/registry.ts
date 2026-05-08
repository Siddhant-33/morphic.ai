import { anthropic } from '@ai-sdk/anthropic'
import { createGateway } from '@ai-sdk/gateway'
import { google } from '@ai-sdk/google'
import { createGroq } from '@ai-sdk/groq'
import { createOpenAI, openai } from '@ai-sdk/openai'
import { createProviderRegistry } from 'ai'

//
// ✅ GROQ
//
const groq = createGroq({
  apiKey: process.env.GROQ_API_KEY
})

//
// ✅ OPENROUTER
//
const openrouter = createOpenAI({
  name: 'openrouter',
  apiKey: process.env.OPENROUTER_API_KEY,
  baseURL: 'https://openrouter.ai/api/v1'
})

//
// ✅ SILICONFLOW
//
const silicon = createOpenAI({
  name: 'silicon',
  apiKey: process.env.SILICONFLOW_API_KEY,
  baseURL: 'https://api.siliconflow.cn/v1'
})

//
// ✅ OLLAMA LOCAL
//
const ollama = createOpenAI({
  name: 'ollama',
  apiKey: 'ollama',
  baseURL: 'http://127.0.0.1:11434/v1'
})

//
// ✅ PROVIDERS
//
const providers = {
  openai,
  anthropic,
  google,
  groq,
  openrouter,
  silicon,
  ollama,

  'openai-compatible': createOpenAI({
    apiKey: process.env.OPENAI_COMPATIBLE_API_KEY,
    baseURL: process.env.OPENAI_COMPATIBLE_API_BASE_URL
  }),

  gateway: createGateway({
    apiKey: process.env.AI_GATEWAY_API_KEY
  })
}

//
// ✅ REGISTRY
//
export const registry = createProviderRegistry(providers)

//
// ✅ MODEL GETTER
//
export function getModel(model: string) {
  return registry.languageModel(
    model as Parameters<typeof registry.languageModel>[0]
  )
}

//
// ✅ PROVIDER ENABLE CHECK
//
export function isProviderEnabled(providerId: string): boolean {
  switch (providerId) {
    case 'openai':
      return !!process.env.OPENAI_API_KEY

    case 'anthropic':
      return !!process.env.ANTHROPIC_API_KEY

    case 'google':
      return !!process.env.GOOGLE_GENERATIVE_AI_API_KEY

    case 'groq':
      return !!process.env.GROQ_API_KEY

    case 'openrouter':
      return !!process.env.OPENROUTER_API_KEY

    case 'silicon':
      return !!process.env.SILICONFLOW_API_KEY

    case 'ollama':
      return true

    case 'openai-compatible':
      return (
        !!process.env.OPENAI_COMPATIBLE_API_KEY &&
        !!process.env.OPENAI_COMPATIBLE_API_BASE_URL
      )

    case 'gateway':
      return !!process.env.AI_GATEWAY_API_KEY

    default:
      return false
  }
}
