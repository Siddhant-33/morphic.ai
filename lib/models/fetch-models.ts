import { Model } from '@/lib/types';

export const fetchGroqModels = async (): Promise<Model[]> => {
  return [
    { id: "llama-3.1-8b-instant", name: "Llama 3.1 8B Instant (Ultra Fast)", provider: "Groq", providerId: "groq" },
    { id: "llama-3.3-70b-versatile", name: "Llama 3.3 70B Versatile (Best Balance)", provider: "Groq", providerId: "groq" },
    { id: "openai/gpt-oss-120b", name: "GPT-OSS 120B (Strong Reasoning)", provider: "Groq", providerId: "groq" },
    { id: "openai/gpt-oss-20b", name: "GPT-OSS 20B (Fastest)", provider: "Groq", providerId: "groq" },
    { id: "qwen/qwen3-32b", name: "Qwen3 32B (Best Coding)", provider: "Groq", providerId: "groq" },
    { id: "meta-llama/llama-4-scout-17b-16e-instruct", name: "Llama 4 Scout", provider: "Groq", providerId: "groq" },
    { id: "groq/compound", name: "Groq Compound (Agentic)", provider: "Groq", providerId: "groq" },
  ];
};

export const fetchNvidiaModels = async (): Promise<Model[]> => {
  return [
    { id: "minimax/minimax-m2.7", name: "MiniMax M2.7 (Best Overall)", provider: "NVIDIA", providerId: "nvidia" },
    { id: "deepseek-ai/deepseek-v4-flash", name: "DeepSeek V4 Flash (Fast)", provider: "NVIDIA", providerId: "nvidia" },
    { id: "deepseek-ai/deepseek-v4", name: "DeepSeek V4", provider: "NVIDIA", providerId: "nvidia" },
    { id: "gpt-oss/gpt-oss-120b", name: "GPT-OSS 120B", provider: "NVIDIA", providerId: "nvidia" },
    { id: "glm/glm-5.1", name: "GLM-5.1", provider: "NVIDIA", providerId: "nvidia" },
    { id: "kimi/kimi-k2.5", name: "Kimi K2.5 (Multimodal)", provider: "NVIDIA", providerId: "nvidia" },
  ];
};

export const fetchAllModels = async (): Promise<Model[]> => {
  const groq = await fetchGroqModels();
  const nvidia = await fetchNvidiaModels();

  const extra = [
    { id: "gemini-3.1-pro-preview", name: "Gemini 3.1 Pro Preview", provider: "Google", providerId: "google" },
    { id: "gemini-3.1-flash", name: "Gemini 3.1 Flash", provider: "Google", providerId: "google" },
    { id: "gemini-2.5-pro", name: "Gemini 2.5 Pro", provider: "Google", providerId: "google" },
    { id: "gemini-2.5-flash", name: "Gemini 2.5 Flash", provider: "Google", providerId: "google" },
    { id: "gpt-4o-mini", name: "GPT-4o Mini", provider: "OpenAI", providerId: "openai" },
    { id: "claude-3-5-sonnet-latest", name: "Claude 3.5 Sonnet", provider: "Anthropic", providerId: "anthropic" },
  ];

  return [...groq, ...nvidia, ...extra];
};

export default fetchAllModels;
