import { ReadonlyRequestCookies } from 'next/dist/server/web/spec-extension/adapters/request-cookies'

import { DEFAULT_MODEL } from '@/lib/config/default-model'
import { Model } from '@/lib/types/models'
import { SearchMode } from '@/lib/types/search'

interface ModelSelectionParams {
  searchMode?: SearchMode
  cookieStore?: ReadonlyRequestCookies
  taskType?: 'chat' | 'image' | 'research' | 'analyze'
}

/*
  GEMINI ONLY MODELS
  NO DEAD MODELS
*/

const QUICK_MODEL: Model = {
  id: 'gemini-2.5-flash-lite',
  name: 'Gemini 2.5 Flash Lite',
  provider: 'Google',
  providerId: 'google'
}

const ADAPTIVE_MODEL: Model = {
  id: 'gemini-2.5-flash',
  name: 'Gemini 2.5 Flash',
  provider: 'Google',
  providerId: 'google'
}

const RESEARCH_MODEL: Model = {
  id: 'gemini-3-flash-preview',
  name: 'Gemini 3 Flash Preview',
  provider: 'Google',
  providerId: 'google'
}

const ANALYZE_MODEL: Model = {
  id: 'gemini-3.1-flash-lite',
  name: 'Gemini 3.1 Flash Lite',
  provider: 'Google',
  providerId: 'google'
}

const IMAGE_MODEL: Model = {
  id: 'imagen-3.0-generate-002',
  name: 'Imagen 3',
  provider: 'Google',
  providerId: 'google'
}

export async function selectModel({
  searchMode,
  taskType = 'chat'
}: ModelSelectionParams): Promise<Model | null> {
  /*
    IMAGE GENERATION
  */

  if (taskType === 'image') {
    return IMAGE_MODEL
  }

  /*
    RESEARCH
  */

  if (taskType === 'research') {
    return RESEARCH_MODEL
  }

  /*
    ANALYZE
  */

  if (taskType === 'analyze') {
    return ANALYZE_MODEL
  }

  /*
    SEARCH MODES
  */

  switch (searchMode) {
    case 'adaptive':
      return ADAPTIVE_MODEL

    case 'research':
      return RESEARCH_MODEL

    case 'analyze':
      return ANALYZE_MODEL

    case 'image':
      return IMAGE_MODEL

    case 'quick':
    default:
      return QUICK_MODEL
  }
}

export { DEFAULT_MODEL }
