import { ReadonlyRequestCookies } from 'next/dist/server/web/spec-extension/adapters/request-cookies'

import { DEFAULT_MODEL } from '@/lib/config/default-model'
import { Model } from '@/lib/types/models'
import { SearchMode } from '@/lib/types/search'

interface ModelSelectionParams {
  searchMode?: SearchMode
  cookieStore?: ReadonlyRequestCookies
  taskType?: 'chat' | 'image' | 'research'
}

export async function selectModel({
  searchMode,
  taskType = 'chat'
}: ModelSelectionParams): Promise<Model | null> {
  /*
    QUICK MODE
  */
  const QUICK_MODEL: Model = {
    id: 'gemini-2.5-flash-lite',
    name: 'Gemini 2.5 Flash Lite',
    provider: 'Google',
    providerId: 'google'
  }

  /*
    ADAPTIVE MODE
  */
  const ADAPTIVE_MODEL: Model = {
    id: 'gemini-2.5-flash',
    name: 'Gemini 2.5 Flash',
    provider: 'Google',
    providerId: 'google'
  }

  /*
    RESEARCH / ANALYZING MODE
  */
  const RESEARCH_MODEL: Model = {
    id: 'gemini-2.5-pro',
    name: 'Gemini 2.5 Pro',
    provider: 'Google',
    providerId: 'google'
  }

  /*
    IMAGE GENERATION
  */
  const IMAGE_MODEL: Model = {
    id: 'gemini-2.5-flash-image',
    name: 'Gemini Image Generation',
    provider: 'Google',
    providerId: 'google'
  }

  /*
    TASK-BASED ROUTING
  */

  if (taskType === 'image') {
    return IMAGE_MODEL
  }

  if (taskType === 'research') {
    return RESEARCH_MODEL
  }

  /*
    MODE-BASED ROUTING
  */

  switch (searchMode) {
    case 'adaptive':
      return ADAPTIVE_MODEL

    case 'research':
      return RESEARCH_MODEL

    case 'image':
      return IMAGE_MODEL

    case 'quick':
    default:
      return QUICK_MODEL
  }
}

export { DEFAULT_MODEL }
