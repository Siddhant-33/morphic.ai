import { google } from '@ai-sdk/google'
import { createProviderRegistry, LanguageModel } from 'ai'
import { createOllama } from 'ai-sdk-ollama'

const providers: Record<string, any> = {
  google
}

const ollamaProvider = process.env.OLLAMA_BASE_URL
  ? createOllama({
      baseURL: process.env.OLLAMA_BASE_URL
    })
  : null

if (ollamaProvider) {
  providers.ollama = ollamaProvider
}

export const registry =
  createProviderRegistry(providers)

export function getModel(
  model: string
): LanguageModel {
  if (
    model.startsWith('ollama:') &&
    ollamaProvider
  ) {
    const modelId =
      model.slice('ollama:'.length)

    const lm = ollamaProvider(modelId, {
      think: true
    })

    Object.defineProperty(lm, 'supportedUrls', {
      value: {},
      configurable: true
    })

    return lm
  }

  return registry.languageModel(
    model as Parameters<
      typeof registry.languageModel
    >[0]
  )
}

export function isProviderEnabled(
  providerId: string
): boolean {
  switch (providerId) {
    case 'google':
      return !!process.env.GOOGLE_GENERATIVE_AI_API_KEY

    case 'ollama':
      return !!process.env.OLLAMA_BASE_URL

    default:
      return false
  }
}
