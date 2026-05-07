// lib/config/default-model.ts

export const DEFAULT_MODELS = [
  {
    id: 'gemini-2.5-flash',
    name: 'Gemini 2.5 Flash',
    provider: 'google'
  }
]

// ✅ THIS FIXES YOUR BUILD ERROR
export const DEFAULT_MODEL = DEFAULT_MODELS[0]
