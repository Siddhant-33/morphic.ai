import { anthropic } from '@ai-sdk/anthropic'
import { createGateway } from '@ai-sdk/gateway'
import { google } from '@ai-sdk/google'
import { createOpenAI, openai } from '@ai-sdk/openai'
import { createGroq } from '@ai-sdk/groq'
import { createProviderRegistry, LanguageModel } from 'ai'
import { createOllama } from 'ai-sdk-ollama'

// ✅ GROQ
const groq = createGroq({
  apiKey: process.env.GROQ_API_KEY
})

const providers: Record<string, any> = {
  openai,
  anthropic,
  google,
  groq, // ✅ added
  'openai-compatible': createOpenAI({
    apiKey: process.env.OPENAI_COMPATIBLE_API_KEY,
    baseURL: process.env.OPENAI_COMPATIBLE_API_BASE_URL
  }),
  gateway: createGateway({
    apiKey: process.env.AI_GATEWAY_API_KEY
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

// ✅ ENABLE PROVIDERS
export function isProviderEnabled(providerId: string): boolean {
  switch (providerId) {
    case 'openai':
      return !!process.env.OPENAI_API_KEY
    case 'anthropic':
      return !!process.env.ANTHROPIC_API_KEY
    case 'google':
      return !!process.env.GOOGLE_GENERATIVE_AI_API_KEY
    case 'groq': // ✅ added
      return !!process.env.GROQ_API_KEY
    case 'openai-compatible':
      return (
        !!process.env.OPENAI_COMPATIBLE_API_KEY &&
        !!process.env.OPENAI_COMPATIBLE_API_BASE_URL
      )
    case 'gateway':
      return !!process.env.AI_GATEWAY_API_KEY
    case 'ollama':
      return !!process.env.OLLAMA_BASE_URL
    default:
      return false
  }
}
