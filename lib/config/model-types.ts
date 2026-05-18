import { SearchMode } from '@/lib/types/search'
import { Model } from '@/lib/types/models'

// Simple hardcoded config (no external import)
const modelsConfig = {
  models: {
    quick: {
      id: "gemini-2.5-pro",
      name: "Speed Insight",
      provider: "Google",
      providerId: "google"
    },
    adaptive: {
      id: "gemini-2.5-flash-lite",
      name: "Deep Research",
      provider: "Google",
      providerId: "google"
    }
  }
}

export function getModelForMode(mode: SearchMode): Model | undefined {
  if (mode === 'quick') {
    return modelsConfig.models.quick
  }
  // All other modes (adaptive, analyzing, image, etc.) use Gemini Pro
  return modelsConfig.models.adaptive
}

export function getDefaultModel(mode: SearchMode = 'quick'): Model {
  const model = getModelForMode(mode)
  if (!model) {
    throw new Error(`No model configured for mode: ${mode}`)
  }
  return model
}
