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
// ✅ OLLAMA (LOCAL)
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
// ✅ MODEL RESOLVER
//
export function getModel(model: string) {
  return registry.languageModel(
    model as Parameters<typeof registry.languageModel>[0]
  )
}

//
// ⚠️ IMPORTANT FIX:
// We STOP blocking providers in a way that breaks UI
// Instead: ALWAYS show models, only block API calls if missing keys
//
export function isProviderEnabled(providerId: string): boolean {
  switch (providerId) {
    case 'openai':
      return true

    case 'anthropic':
      return true

    case 'google':
      return true

    case 'groq':
      return true

    case 'ollama':
      return true

    case 'openai-compatible':
      return true

    case 'gateway':
      return true

    default:
      return true
  }
}
