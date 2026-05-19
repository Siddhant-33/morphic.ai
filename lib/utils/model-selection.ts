import { ReadonlyRequestCookies } from 'next/dist/server/web/spec-extension/adapters/request-cookies'

import { DEFAULT_MODEL } from '@/lib/config/default-model'
import { Model } from '@/lib/types/models'
import { SearchMode } from '@/lib/types/search'

export interface ModelSelectionParams {
  searchMode?: SearchMode
  cookieStore?: ReadonlyRequestCookies
  taskType?: 'chat' | 'image' | 'research' | 'analyze'
}

const MODELS = {
  quick: {
    id: 'gemini-2.5-flash-lite',
    name: 'Gemini 2.5 Flash Lite',
    provider: 'Google',
    providerId: 'google'
  },

  adaptive: {
    id: 'gemini-2.5-flash',
    name: 'Gemini 2.5 Flash',
    provider: 'Google',
    providerId: 'google'
  },

  analyze: {
    id: 'gemini-2.5-flash',
    name: 'Gemini 2.5 Flash',
    provider: 'Google',
    providerId: 'google'
  },

  research: {
    id: 'gemini-2.5-pro',
    name: 'Gemini 2.5 Pro',
    provider: 'Google',
    providerId: 'google'
  },

  image: {
    id: 'gemini-2.5-flash',
    name: 'Gemini 2.5 Flash Image',
    provider: 'Google',
    providerId: 'google'
  }
} satisfies Record<string, Model>

export async function selectModel({
  searchMode = 'quick',
  taskType = 'chat'
}: ModelSelectionParams): Promise<Model | null> {
  try {
    if (taskType === 'image') {
      return MODELS.image
    }

    if (taskType === 'research') {
      return MODELS.research
    }

    if (taskType === 'analyze') {
      return MODELS.analyze
    }

    if (searchMode === 'adaptive') {
      return MODELS.adaptive
    }

    return MODELS.quick
  } catch (error) {
    console.error(error)

    return MODELS.quick
  }
}

export { DEFAULT_MODEL }
