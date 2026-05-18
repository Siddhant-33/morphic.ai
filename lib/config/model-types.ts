import { SearchMode } from '@/lib/types/search'
import { Model } from '@/lib/types/models'
import { getModelsConfig } from './models-config'

export function getModelForMode(mode: SearchMode): Model | undefined {
  const cfg = getModelsConfig()

  // Support all modes
  if (mode === 'quick') {
    return cfg.models?.quick
  }
  if (mode === 'adaptive' || mode === 'analyzing') {
    return cfg.models?.adaptive
  }
  if (mode === 'image') {
    return cfg.models?.quick // or any default model for image
  }
  if (mode === 'research') {
    return cfg.models?.adaptive
  }

  // Fallback
  return cfg.models?.quick
}

export function getDefaultModel(mode: SearchMode = 'quick'): Model {
  const model = getModelForMode(mode)
  if (!model) {
    throw new Error(`No model configured for mode: ${mode}`)
  }
  return model
}
