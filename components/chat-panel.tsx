'use client'

import * as React from 'react'
import { useRef, useState, useTransition, useCallback } from 'react'
import Textarea from 'react-textarea-autosize'
import { Button } from '@/components/ui/button'
import { ArrowUp, Search, Brain, Sparkles, Microscope } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useEnterSubmit } from '@/lib/hooks/use-enter-submit'
import { useRouter } from 'next/navigation'
import { createStreamableUI, createStreamableValue } from 'ai/rsc'

// ── Mode type ────────────────────────────────────────────────────────────────
export type ChatMode = 'search' | 'adaptive' | 'image' | 'deep-research'

// Auto model routing – NEVER shown to the user, picked in background
export const MODE_MODELS: Record<ChatMode, { speed: string; quality: string; provider: string }> = {
  search: {
    speed:   'llama-3.1-8b-instant',
    quality: 'llama-3.3-70b-versatile',
    provider: 'groq',
  },
  adaptive: {
    speed:   'gemini-2.5-flash',
    quality: 'gemini-2.5-pro',
    provider: 'google',
  },
  image: {
    speed:   'dall-e-2',
    quality: 'dall-e-3',
    provider: 'openai',
  },
  'deep-research': {
    speed:   'deepseek-r1-distill-llama-70b',
    quality: 'deepseek-ai/deepseek-v4-pro',
    provider: 'groq',
  },
}

const MODES: { id: ChatMode; label: string; Icon: React.FC<{ size?: number; className?: string }> ; placeholder: string }[] = [
  {
    id: 'search',
    label: 'Search',
    Icon: ({ size = 14, className }) => <Search size={size} className={className} />,
    placeholder: 'Ask anything...',
  },
  {
    id: 'adaptive',
    label: 'Adaptive',
    Icon: ({ size = 14, className }) => <Brain size={size} className={className} />,
    placeholder: 'Ask anything complex...',
  },
  {
    id: 'image',
    label: 'Image',
    Icon: ({ size = 14, className }) => <Sparkles size={size} className={className} />,
    placeholder: 'Describe the image you want to generate...',
  },
  {
    id: 'deep-research',
    label: 'Deep Research',
    Icon: ({ size = 14, className }) => <Microscope size={size} className={className} />,
    placeholder: 'What topic do you want deeply researched?',
  },
]

// ── Props ─────────────────────────────────────────────────────────────────────
interface ChatPanelProps {
  id?: string
  isLoading: boolean
  stop: () => void
  append: (message: { role: string; content: string; mode?: ChatMode; autoModel?: string }) => void
  reload: () => void
  messages: any[]
  input: string
  setInput: (value: string) => void
}

export function ChatPanel({
  id,
  isLoading,
  stop,
  append,
  reload,
  messages,
  input,
  setInput,
}: ChatPanelProps) {
  const router = useRouter()
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const { onKeyDown } = useEnterSubmit()

  const [mode, setMode] = useState<ChatMode>('search')
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  // ── Pick model automatically based on message complexity ──────────────────
  const pickAutoModel = useCallback(
    (text: string): { modelId: string; provider: string } => {
      const isComplex =
        text.length > 200 ||
        /\b(explain|analyze|compare|research|write|code|debug|summarize|translate|detailed|comprehensive)\b/i.test(text)

      const cfg = MODE_MODELS[mode]
      return {
        modelId:  isComplex ? cfg.quality : cfg.speed,
        provider: cfg.provider,
      }
    },
    [mode]
  )

  // ── Submit handler ────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    const text = input.trim()
    setInput('')

    if (mode === 'image') {
      // Route to image generation endpoint
      startTransition(async () => {
        try {
          const res = await fetch('/api/generate-image', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt: text, quality: 'hd' }),
          })
          const data = await res.json()
          if (data.url) setImagePreview(data.url)
          // Still append to chat so the conversation is tracked
          append({ role: 'user', content: text, mode, autoModel: 'dall-e-3' })
        } catch (err) {
          console.error('Image generation failed:', err)
        }
      })
      return
    }

    const { modelId, provider } = pickAutoModel(text)
    append({ role: 'user', content: text, mode, autoModel: `${provider}:${modelId}` })
  }

  const currentMode = MODES.find(m => m.id === mode)!

  return (
    <div className="fixed inset-x-0 bottom-0 w-full">
      {/* Generated image preview (image mode only) */}
      {imagePreview && mode === 'image' && (
        <div className="mx-auto mb-4 max-w-2xl px-4">
          <div className="relative rounded-2xl overflow-hidden border border-white/10 bg-black/40 backdrop-blur">
            <img src={imagePreview} alt="Generated" className="w-full h-auto rounded-2xl" />
            <button
              onClick={() => setImagePreview(null)}
              className="absolute top-2 right-2 rounded-full bg-black/60 p-1 text-white/70 hover:text-white text-xs px-2"
            >
              ✕ close
            </button>
          </div>
        </div>
      )}

      <div className="mx-auto max-w-2xl px-4 pb-4 sm:pb-6">
        <form onSubmit={handleSubmit}>
          <div className="relative rounded-2xl border border-white/10 bg-[#111111] shadow-xl shadow-black/30">
            {/* Textarea */}
            <Textarea
              ref={inputRef}
              name="message"
              placeholder={currentMode.placeholder}
              className={cn(
                'w-full resize-none bg-transparent px-4 pt-4 pb-2 text-sm text-white/90',
                'placeholder:text-white/30 outline-none ring-0 border-0 focus:ring-0 focus:border-0',
                'max-h-52 min-h-[52px] leading-relaxed',
              )}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={onKeyDown}
              rows={1}
              autoFocus
            />

            {/* Bottom action bar */}
            <div className="flex items-center justify-between gap-2 px-2 pb-2">
              {/* Mode buttons */}
              <div className="flex items-center gap-0.5">
                {MODES.map((m, i) => (
                  <React.Fragment key={m.id}>
                    {/* Visual divider before new modes */}
                    {i === 2 && (
                      <div className="mx-1.5 h-4 w-px bg-white/10" />
                    )}
                    <button
                      type="button"
                      onClick={() => setMode(m.id)}
                      className={cn(
                        'flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-all duration-150 select-none',
                        mode === m.id
                          ? 'bg-white/10 text-white'
                          : 'text-white/40 hover:bg-white/5 hover:text-white/70'
                      )}
                    >
                      <m.Icon size={13} />
                      <span>{m.label}</span>
                      {(m.id === 'image' || m.id === 'deep-research') && (
                        <span className="rounded px-1 py-px text-[9px] font-semibold bg-white/10 text-white/50 leading-none">
                          NEW
                        </span>
                      )}
                    </button>
                  </React.Fragment>
                ))}
              </div>

              {/* Send / Stop button */}
              {isLoading ? (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={stop}
                  className="h-8 w-8 shrink-0 rounded-full bg-white/10 hover:bg-white/20 text-white"
                >
                  <span className="h-3 w-3 rounded-sm bg-white" />
                </Button>
              ) : (
                <Button
                  type="submit"
                  size="icon"
                  disabled={!input.trim() || isPending}
                  className={cn(
                    'h-8 w-8 shrink-0 rounded-full transition-all',
                    input.trim()
                      ? 'bg-white text-black hover:bg-white/90'
                      : 'bg-white/10 text-white/20 cursor-not-allowed'
                  )}
                >
                  <ArrowUp size={16} />
                </Button>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
