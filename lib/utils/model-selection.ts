import { ReadonlyRequestCookies } from 'next/dist/server/web/spec-extension/adapters/request-cookies'

import { DEFAULT_MODEL } from '@/lib/config/default-model'
import { Model } from '@/lib/types/models'
import { SearchMode } from '@/lib/types/search'

export interface ModelSelectionParams {
  searchMode?: SearchMode
  cookieStore?: ReadonlyRequestCookies
  taskType?: 'chat' | 'image' | 'research' | 'analyze'
}

/*
|--------------------------------------------------------------------------
| GEMINI MODELS ONLY
|--------------------------------------------------------------------------
|
| NO DEAD MODELS
| NO OPENAI
| NO GROK
| ONLY GEMINI 2.5 / 3 SERIES
|
*/

const GEMINI_MODELS = {
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
    name: 'Gemini 2.5 Flash Analyze',
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
    id: 'gemini-2.0-flash-preview-image-generation',
    name: 'Gemini Imagen',
    provider: 'Google',
    providerId: 'google'
  },

  backup1: {
    id: 'gemini-3.1-flash-lite',
    name: 'Gemini 3.1 Flash Lite',
    provider: 'Google',
    providerId: 'google'
  },

  backup2: {
    id: 'gemini-3-flash-preview',
    name: 'Gemini 3 Flash Preview',
    provider: 'Google',
    providerId: 'google'
  }
} satisfies Record<string, Model>

function getSafeModel(model: Model): Model {
  return {
    id: model.id,
    name: model.name,
    provider: model.provider,
    providerId: model.providerId
  }
}

export async function selectModel({
  searchMode = 'quick',
  taskType = 'chat'
}: ModelSelectionParams): Promise<Model | null> {
  try {
    /*
    |--------------------------------------------------------------------------
    | IMAGE GENERATION
    |--------------------------------------------------------------------------
    */

    if (taskType === 'image') {
      return getSafeModel(GEMINI_MODELS.image)
    }

    /*
    |--------------------------------------------------------------------------
    | RESEARCH
    |--------------------------------------------------------------------------
    */

    if (taskType === 'research') {
      return getSafeModel(GEMINI_MODELS.research)
    }

    /*
    |--------------------------------------------------------------------------
    | ANALYZE
    |--------------------------------------------------------------------------
    */

    if (taskType === 'analyze') {
      return getSafeModel(GEMINI_MODELS.analyze)
    }

    /*
    |--------------------------------------------------------------------------
    | ADAPTIVE
    |--------------------------------------------------------------------------
    */

    if (searchMode === 'adaptive') {
      return getSafeModel(GEMINI_MODELS.adaptive)
    }

    /*
    |--------------------------------------------------------------------------
    | QUICK DEFAULT
    |--------------------------------------------------------------------------
    */

    return getSafeModel(GEMINI_MODELS.quick)
  } catch (error) {
    console.error('Model selection failed:', error)

    /*
    |--------------------------------------------------------------------------
    | AUTO FALLBACK SYSTEM
    |--------------------------------------------------------------------------
    */

    try {
      return getSafeModel(GEMINI_MODELS.backup1)
    } catch {
      return getSafeModel(GEMINI_MODELS.backup2)
    }
  }
}

export { DEFAULT_MODEL }
