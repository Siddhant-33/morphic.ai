import { ReadonlyRequestCookies } from 'next/dist/server/web/spec-extension/adapters/request-cookies'

import { DEFAULT_MODEL } from '@/lib/config/default-model'
import { isCloudDeployment } from '@/lib/config/load-models-config'
import {
  MODEL_SELECTION_COOKIE,
  parseModelSelectionCookie
} from '@/lib/config/model-selection-cookie'
import { getModelForMode } from '@/lib/config/model-types'
import { fetchAvailableModels } from '@/lib/models/fetch-models'
import { Model } from '@/lib/types/models'
import { SearchMode } from '@/lib/types/search'
import { isProviderEnabled } from '@/lib/utils/registry'

const MODE_FALLBACK_ORDER: SearchMode[] = ['quick', 'adaptive']

const PROVIDER_LABELS: Record<string, string> = {
  google: 'Google'
}

function buildProviderOptions(
  providerId: string,
  _modelId: string
): Model['providerOptions'] | undefined {
  return undefined
}

function pickFirstFetchedModel(
  modelsByProvider: Record<string, Model[]>
): Model | null {
  const providers = Object.keys(modelsByProvider).sort((a, b) =>
    a.localeCompare(b)
  )

  for (const provider of providers) {
    const firstModel = modelsByProvider[provider]?.[0]

    if (firstModel) {
      return firstModel
    }
  }

  return null
}

interface ModelSelectionParams {
  searchMode?: SearchMode
  cookieStore?: ReadonlyRequestCookies
  taskType?: 'chat' | 'image' | 'research'
}

function buildLocalCookieModel(
  providerId: string,
  modelId: string
): Model {
  const providerOptions = buildProviderOptions(providerId, modelId)

  return {
    id: modelId,
    name: modelId,
    provider: PROVIDER_LABELS[providerId] ?? providerId,
    providerId,
    ...(providerOptions ? { providerOptions } : {})
  }
}

function resolveModelForMode(mode: SearchMode): Model | undefined {
  try {
    const model = getModelForMode(mode)

    if (!model) {
      return undefined
    }

    if (!isProviderEnabled(model.providerId)) {
      console.warn(
        `[ModelSelection] Provider "${model.providerId}" is not enabled for mode "${mode}"`
      )

      return undefined
    }

    return model
  } catch (error) {
    console.error(
      `[ModelSelection] Failed to load model configuration for mode "${mode}":`,
      error
    )

    return undefined
  }
}

export async function selectModel({
  searchMode,
  cookieStore,
  taskType = 'chat'
}: ModelSelectionParams): Promise<Model | null> {
  /*
    FORCE GEMINI ONLY
  */

  const GEMINI_CHAT_MODEL: Model = {
    id: 'gemini-2.5-flash-lite',
    name: 'Gemini 2.5 Flash Lite',
    provider: 'Google',
    providerId: 'google'
  }

  const GEMINI_ADAPTIVE_MODEL: Model = {
    id: 'gemini-2.5-flash',
    name: 'Gemini 2.5 Flash',
    provider: 'Google',
    providerId: 'google'
  }

  const GEMINI_RESEARCH_MODEL: Model = {
    id: 'gemini-2.5-pro',
    name: 'Gemini 2.5 Pro',
    provider: 'Google',
    providerId: 'google'
  }

  const GEMINI_IMAGE_MODEL: Model = {
    id: 'gemini-2.0-flash-preview-image-generation',
    name: 'Gemini Image Generation',
    provider: 'Google',
    providerId: 'google'
  }

  /*
    IMAGE GENERATION
  */

  if (taskType === 'image') {
    return GEMINI_IMAGE_MODEL
  }

  /*
    DEEP RESEARCH
  */

  if (taskType === 'research') {
    return GEMINI_RESEARCH_MODEL
  }

  /*
    ADAPTIVE SEARCH
  */

  if (searchMode === 'adaptive') {
    return GEMINI_ADAPTIVE_MODEL
  }

  /*
    NORMAL CHAT
  */

  return GEMINI_CHAT_MODEL
}

export { DEFAULT_MODEL }
