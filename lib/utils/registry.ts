import { anthropic } from '@ai-sdk/anthropic'
import { createGateway } from '@ai-sdk/gateway'
import { google } from '@ai-sdk/google'
import { createGroq } from '@ai-sdk/groq'
import { createOpenAI, openai } from '@ai-sdk/openai'

import { createProviderRegistry } from 'ai'

const groq = createGroq({
  apiKey: process.env.GROQ_API_KEY
})

const providers: Record<string, any> = {
  openai,
  anthropic,
  google,
  groq,

  'openai-compatible': createOpenAI({
    apiKey: process.env.OPENAI_COMPATIBLE_API_KEY,
    baseURL: process.env.OPENAI_COMPATIBLE_API_BASE_URL
  }),

  gateway: createGateway({
    apiKey: process.env.AI_GATEWAY_API_KEY
  })
}

export const registry = createProviderRegistry(providers)

//
// ✅ CUSTOM MODEL GETTER
//
export function getModel(model: string): any {
  //
  // ✅ OLLAMA FIX
  //
  if (model.startsWith('ollama:')) {
    const modelId = model.replace('ollama:', '')

    return {
      specificationVersion: 'v2',

      provider: 'ollama.chat',

      modelId,

      supportedUrls: {},

      async doGenerate() {
        const response = await fetch(
          'http://127.0.0.1:11434/api/generate',
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              model: modelId,
              prompt: 'Hello'
            })
          }
        )

        const data = await response.json()

        return {
          text: data.response || ''
        }
      }
    }
  }

  return registry.languageModel(
    model as Parameters<typeof registry.languageModel>[0]
  )
}

//
// ✅ ENABLE PROVIDERS
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

    case 'openai-compatible':
      return (
        !!process.env.OPENAI_COMPATIBLE_API_KEY &&
        !!process.env.OPENAI_COMPATIBLE_API_BASE_URL
      )

    case 'gateway':
      return !!process.env.AI_GATEWAY_API_KEY

    case 'ollama':
      return true

    default:
      return false
  }
}
