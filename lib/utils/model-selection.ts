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
  openai: 'OpenAI',
  anthropic: 'Anthropic',
  google: 'Google',
  ollama: 'Ollama',
  gateway: 'Gateway',
  'openai-compatible': 'OpenAI Compatible'
}

/**
 * ✅ FIX: normalize DEFAULT_MODEL safely
 * prevents TS errors if providerId is missing in config file
 */
const SAFE_DEFAULT_MODEL: Model = {
  ...DEFAULT_MODEL,
  providerId: (DEFAULT_MODEL as any).providerId ?? 'google'
}

function buildProviderOptions(
  providerId: string,
  _modelId: string
): Model['providerOptions'] | undefined {
  if (providerId === 'ollama') {
    return {
      ollama: {
        think: true
      }
    }
  }
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
    if (firstModel) return firstModel
  }

  return null
}

interface ModelSelectionParams {
  searchMode?: SearchMode
  cookieStore?: ReadonlyRequestCookies
}

function buildLocalCookieModel(providerId: string, modelId: string): Model {
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
    if (!model) return undefined

    if (!isProviderEnabled(model.providerId)) return undefined

    return model
  } catch (error) {
    console.error(`[ModelSelection] mode error "${mode}":`, error)
    return undefined
  }
}

/**
 * MAIN MODEL SELECTOR
 */
export async function selectModel({
  searchMode,
  cookieStore
}: ModelSelectionParams): Promise<Model | null> {
  if (!isCloudDeployment()) {
    const parsedCookie = parseModelSelectionCookie(
      cookieStore?.get(MODEL_SELECTION_COOKIE)?.value
    )

    if (parsedCookie) {
      if (isProviderEnabled(parsedCookie.providerId)) {
        return buildLocalCookieModel(
          parsedCookie.providerId,
          parsedCookie.modelId
        )
      }
    }

    // ✅ FIX: safe default model usage
    if (isProviderEnabled(SAFE_DEFAULT_MODEL.providerId)) {
      return SAFE_DEFAULT_MODEL
    }

    return pickFirstFetchedModel(await fetchAvailableModels())
  }

  const requestedMode =
    searchMode && MODE_FALLBACK_ORDER.includes(searchMode)
      ? searchMode
      : 'quick'

  const modeOrder = Array.from(
    new Set<SearchMode>([requestedMode, ...MODE_FALLBACK_ORDER])
  )

  for (const mode of modeOrder) {
    const model = resolveModelForMode(mode)
    if (model) return model
  }

  if (isProviderEnabled(SAFE_DEFAULT_MODEL.providerId)) {
    return SAFE_DEFAULT_MODEL
  }

  return pickFirstFetchedModel(await fetchAvailableModels())
}

export { DEFAULT_MODEL }
