import { Model } from '@/lib/types/models'

export async function fetchAvailableModels(): Promise<Record<string, Model[]>> {
  return {
    "Speed Insight": [
      { id: "llama-3.1-8b-instant", name: "Speed Insight", provider: "Groq", providerId: "groq" }
    ],
    "Deep Research": [
      { id: "gemini-3.1-pro-preview", name: "Deep Research", provider: "Google", providerId: "google" },
      { id: "llama-3.3-70b-versatile", name: "Deep Research", provider: "Groq", providerId: "groq" }
    ],
    "Analyzing": [
      { id: "gemini-3.1-pro-preview", name: "Analyzing", provider: "Google", providerId: "google" }
    ]
  }
}
