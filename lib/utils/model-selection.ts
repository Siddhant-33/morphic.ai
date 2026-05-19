import { ReadonlyRequestCookies } from 'next/dist/server/web/spec-extension/adapters/request-cookies'

import { Model } from '@/lib/types/models'
import { SearchMode } from '@/lib/types/search'

interface ModelSelectionParams {
  searchMode?: SearchMode
  cookieStore?: ReadonlyRequestCookies
}

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

const IMAGE_MODEL: Model = {
  id: 'imagen-3.0-generate-002',
  name: 'Imagen 3',
  provider: 'Google',
  providerId: 'google'
}

export async function selectModel({
  searchMode = 'quick'
}: ModelSelectionParams): Promise<Model> {
  switch (searchMode) {
    case 'adaptive':
      return ADAPTIVE_MODEL

    case 'research':
      return RESEARCH_MODEL

    case 'image':
      return IMAGE_MODEL

    default:
      return QUICK_MODEL
  }
}
