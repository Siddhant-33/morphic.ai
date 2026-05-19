'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Textarea from 'react-textarea-autosize'
import { useRouter } from 'next/navigation'

import { UseChatHelpers } from '@ai-sdk/react'
import {
  ArrowUp,
  ChevronDown,
  MessageCirclePlus,
  Square,
  Crown,
  Sparkles,
  Zap,
  Check,
  CreditCard,
  QrCode
} from 'lucide-react'
import { toast } from 'sonner'

import { SHORTCUT_EVENTS } from '@/lib/keyboard-shortcuts'
import { UploadedFile } from '@/lib/types'
import type { UIDataTypes, UIMessage, UITools } from '@/lib/types/ai'
import type { ModelSelectorData } from '@/lib/types/model-selector'
import { cn } from '@/lib/utils'

import { useArtifact } from './artifact/artifact-context'
import { Button } from './ui/button'
import { IconBlinkingLogo } from './ui/icons'
import { ActionButtons } from './action-buttons'
import { FileUploadButton } from './file-upload-button'
import { MessageNavigationDots } from './message-navigation-dots'
import { SearchModeSelector } from './search-mode-selector'
import { UploadedFileList } from './uploaded-file-list'

const INPUT_UPDATE_DELAY_MS = 10

interface ChatPanelProps {
  chatId: string
  input: string
  handleInputChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void
  handleSubmit: (e: React.FormEvent<HTMLFormElement>) => void
  status: UseChatHelpers<UIMessage<unknown, UIDataTypes, UITools>>['status']
  messages: UIMessage[]
  setMessages: (messages: UIMessage[]) => void
  query?: string
  stop: () => void
  append: (message: any) => void
  showScrollToBottomButton: boolean
  scrollContainerRef: React.RefObject<HTMLDivElement>
  uploadedFiles: UploadedFile[]
  setUploadedFiles: React.Dispatch<React.SetStateAction<UploadedFile[]>>
  onNewChat?: () => void
  isGuest?: boolean
  isCloudDeployment?: boolean
  modelSelectorData?: ModelSelectorData
  sections?: { id: string; userMessage: UIMessage }[]
}

export function ChatPanel({
  chatId,
  input,
  handleInputChange,
  handleSubmit,
  status,
  messages,
  setMessages,
  query,
  stop,
  append,
  showScrollToBottomButton,
  uploadedFiles,
  setUploadedFiles,
  scrollContainerRef,
  onNewChat,
  isGuest = false,
  isCloudDeployment = false,
  modelSelectorData,
  sections = []
}: ChatPanelProps) {
  const router = useRouter()

  const inputRef = useRef<HTMLTextAreaElement>(null)

  const isFirstRender = useRef(true)

  const [isComposing, setIsComposing] = useState(false)

  const [enterDisabled, setEnterDisabled] = useState(false)

  const [isInputFocused, setIsInputFocused] = useState(false)

  const [showPricing, setShowPricing] = useState(false)

  const plans = [
    {
      name: 'Free',
      price: '₹0',
      icon: Zap,
      features: ['Gemini Flash Lite', '1 image/day', 'Basic AI']
    },
    {
      name: 'Pro',
      price: '₹299/mo',
      icon: Sparkles,
      popular: true,
      features: ['Gemini 2.5 Flash', '50 images/day', 'Research mode', 'Priority AI']
    },
    {
      name: 'Ultra',
      price: '₹999/mo',
      icon: Crown,
      features: ['Gemini 3 Flash Preview', 'Unlimited images', 'Deep research', 'Premium speed']
    }
  ]

  const { close: closeArtifact } = useArtifact()

  const isLoading = status === 'submitted' || status === 'streaming'

  const hasAvailableModels =
    isCloudDeployment || modelSelectorData?.hasAvailableModels !== false

  const handleCompositionStart = () => setIsComposing(true)

  const handleCompositionEnd = () => {
    setIsComposing(false)

    setEnterDisabled(true)

    setTimeout(() => {
      setEnterDisabled(false)
    }, 300)
  }

  const handleNewChat = useCallback(() => {
    setMessages([])

    closeArtifact()

    setIsInputFocused(false)

    inputRef.current?.blur()

    onNewChat?.()

    router.push('/')
  }, [setMessages, closeArtifact, onNewChat, router])

  const handleNewChatRef = useRef(handleNewChat)

  useEffect(() => {
    handleNewChatRef.current = handleNewChat
  }, [handleNewChat])

  useEffect(() => {
    const handleNewChatShortcut = (e: Event) => {
      if (e.defaultPrevented) return

      e.preventDefault()

      handleNewChatRef.current()
    }

    window.addEventListener(SHORTCUT_EVENTS.newChat, handleNewChatShortcut)

    return () => {
      window.removeEventListener(
        SHORTCUT_EVENTS.newChat,
        handleNewChatShortcut
      )
    }
  }, [])

  const isToolInvocationInProgress = () => {
    if (!messages.length) return false

    const lastMessage = messages[messages.length - 1]

    if (lastMessage.role !== 'assistant' || !lastMessage.parts) return false

    const parts = lastMessage.parts

    const lastPart = parts[parts.length - 1]

    return (
      (lastPart?.type === 'tool-search' ||
        lastPart?.type === 'tool-fetch' ||
        lastPart?.type === 'tool-askQuestion') &&
      ((lastPart as any)?.state === 'input-streaming' ||
        (lastPart as any)?.state === 'input-available')
    )
  }

  useEffect(() => {
    if (isFirstRender.current && query && query.trim().length > 0) {
      append({
        role: 'user',
        content: query
      })

      isFirstRender.current = false
    }
  }, [query, append])

  const handleFileRemove = useCallback(
    (index: number) => {
      setUploadedFiles(prev => prev.filter((_, i) => i !== index))
    },
    [setUploadedFiles]
  )

  const handleScrollToBottom = () => {
    const scrollContainer = scrollContainerRef.current

    if (scrollContainer) {
      scrollContainer.scrollTo({
        top: scrollContainer.scrollHeight,
        behavior: 'smooth'
      })
    }
  }

  if (showPricing) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-md p-4">
        <div className="relative w-full max-w-5xl overflow-hidden rounded-3xl border border-border bg-background shadow-2xl">
          <div className="border-b border-border bg-gradient-to-br from-violet-500/10 to-amber-500/10 p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-3xl font-semibold">Usage limit reached</h2>
                <p className="mt-2 text-muted-foreground">
                  Upgrade your plan to continue using Morphic AI.
                </p>
              </div>

              <button
                onClick={() => setShowPricing(false)}
                className="rounded-xl border border-border px-4 py-2 hover:bg-muted"
              >
                Close
              </button>
            </div>
          </div>

          <div className="grid gap-4 p-6 md:grid-cols-3">
            {plans.map(plan => {
              const Icon = plan.icon

              return (
                <div
                  key={plan.name}
                  className={cn(
                    'rounded-3xl border bg-background p-6 transition-all',
                    plan.popular && 'border-violet-500 shadow-xl'
                  )}
                >
                  <div className="mb-6 flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-amber-400 text-white">
                      <Icon className="h-6 w-6" />
                    </div>

                    <div>
                      <h3 className="text-xl font-semibold">{plan.name}</h3>
                      <p className="text-muted-foreground">{plan.price}</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {plan.features.map(feature => (
                      <div key={feature} className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-green-500" />
                        <span className="text-sm text-muted-foreground">{feature}</span>
                      </div>
                    ))}
                  </div>

                  <button
                    className={cn(
                      'mt-6 w-full rounded-2xl py-3 text-sm font-medium',
                      plan.popular
                        ? 'bg-gradient-to-r from-violet-500 to-amber-400 text-white'
                        : 'border border-border bg-muted'
                    )}
                  >
                    Upgrade
                  </button>
                </div>
              )
            })}
          </div>

          <div className="border-t border-border p-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-3xl border border-border p-6">
                <div className="mb-4 flex items-center gap-2">
                  <QrCode className="h-5 w-5" />
                  <h3 className="text-lg font-semibold">UPI Payment</h3>
                </div>
                <div className="flex h-48 items-center justify-center rounded-2xl border border-dashed border-border bg-muted">
                  Fake QR Preview
                </div>
                <div className="mt-4 rounded-xl bg-muted p-3 text-center font-mono">
                  morphicai@upi
                </div>
              </div>

              <div className="rounded-3xl border border-border p-6">
                <div className="mb-4 flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  <h3 className="text-lg font-semibold">Card Payment</h3>
                </div>
                <div className="space-y-4">
                  <input
                    placeholder="Card Number"
                    className="h-12 w-full rounded-2xl border border-border bg-background px-4"
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <input
                      placeholder="MM/YY"
                      className="h-12 rounded-2xl border border-border bg-background px-4"
                    />
                    <input
                      placeholder="CVV"
                      className="h-12 rounded-2xl border border-border bg-background px-4"
                    />
                  </div>
                  <button className="h-12 w-full rounded-2xl bg-gradient-to-r from-violet-500 to-amber-400 text-white">
                    Complete Payment
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div
      className={cn(
        'w-full bg-background group/form-container shrink-0',
        messages.length > 0 ? 'sticky bottom-0 px-2 pb-2 md:pb-4' : 'px-6'
      )}
    >
      {messages.length === 0 && (
        <div className="mb-6 md:mb-10 flex flex-col items-center gap-2 md:gap-4">
          <IconBlinkingLogo className="size-12 text-white" />

          <h1 className="text-xl md:text-2xl font-medium text-white">
            What would you like to know?
          </h1>
        </div>
      )}

      {uploadedFiles.length > 0 && (
        <UploadedFileList files={uploadedFiles} onRemove={handleFileRemove} />
      )}

      <form
        onSubmit={e => {
          if (!hasAvailableModels) {
            e.preventDefault()

            toast.error('No enabled model is available')

            return
          }

          handleSubmit(e)

          setIsInputFocused(false)

          inputRef.current?.blur()
        }}
        className={cn('max-w-full md:max-w-3xl w-full mx-auto relative')}
      >
        {messages.length > 0 && (
          <div
            className={cn(
              'transition-opacity duration-100',
              showScrollToBottomButton
                ? 'opacity-100'
                : 'pointer-events-none opacity-0'
            )}
          >
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="absolute -top-10 right-0 z-20 size-8 rounded-full shadow-md border-white/10 bg-black/40 backdrop-blur-md"
              onClick={handleScrollToBottom}
              title="Scroll to bottom"
            >
              <ChevronDown size={16} />
            </Button>
          </div>
        )}

        {sections.length > 0 && (
          <div
            className={cn(
              'transition-opacity duration-100',
              !showScrollToBottomButton && status === 'ready'
                ? 'opacity-100'
                : 'pointer-events-none opacity-0'
            )}
          >
            <MessageNavigationDots sections={sections} />
          </div>
        )}

        <div
          className={cn(
            'relative flex flex-col w-full gap-2 bg-[#111111]/95 backdrop-blur-xl rounded-[28px] border border-white/10 shadow-2xl transition-shadow',
            isInputFocused &&
              'ring-1 ring-white/20 ring-offset-1 ring-offset-black/50'
          )}
        >
          <Textarea
            ref={inputRef}
            name="input"
            rows={2}
            maxRows={5}
            tabIndex={0}
            onCompositionStart={handleCompositionStart}
            onCompositionEnd={handleCompositionEnd}
            onFocus={() => setIsInputFocused(true)}
            onBlur={() => setIsInputFocused(false)}
            placeholder={
              (() => {
                const mode = document.cookie
                  .split('; ')
                  .find(row => row.startsWith('searchMode='))
                  ?.split('=')[1]

                if (mode === 'adaptive') {
                  return messages.length > 0
                    ? 'Continue adaptive chat...'
                    : 'Ask anything intelligently...'
                }

                if (mode === 'research') {
                  return messages.length > 0
                    ? 'Continue research...'
                    : 'Research on anything...'
                }

                if (mode === 'image') {
                  return messages.length > 0
                    ? 'Describe more image details...'
                    : 'Generate a picture of...'
                }

                return messages.length > 0
                  ? 'Reply...'
                  : 'Search anything...'
              })()
            }
            spellCheck={false}
            value={input}
            disabled={isLoading || isToolInvocationInProgress()}
            className="resize-none w-full min-h-12 bg-transparent border-0 p-4 md:p-5 text-[15px] text-white placeholder:text-zinc-500 focus-visible:outline-hidden disabled:cursor-not-allowed disabled:opacity-50"
            onChange={handleInputChange}
            onKeyDown={e => {
              if (
                e.key === 'Enter' &&
                !e.shiftKey &&
                !isComposing &&
                !enterDisabled
              ) {
                if (input.trim().length === 0) {
                  e.preventDefault()

                  return
                }

                e.preventDefault()

                const textarea = e.target as HTMLTextAreaElement

                textarea.form?.requestSubmit()

                setIsInputFocused(false)

                textarea.blur()
              }
            }}
          />

          <div className="flex items-center justify-between p-2 md:p-3">
            <div className="flex items-center gap-3">
              {!isGuest && (
                <FileUploadButton
                  onFileSelect={async files => {
                    const newFiles: UploadedFile[] = files.map(file => ({
                      file,
                      status: 'uploading'
                    }))

                    setUploadedFiles(prev => [...prev, ...newFiles])

                    await Promise.all(
                      newFiles.map(async uf => {
                        const formData = new FormData()

                        formData.append('file', uf.file)

                        formData.append('chatId', chatId)

                        try {
                          const res = await fetch('/api/upload', {
                            method: 'POST',
                            body: formData
                          })

                          if (!res.ok) {
                            throw new Error('Upload failed')
                          }

                          const { file: uploaded } = await res.json()

                          setUploadedFiles(prev =>
                            prev.map(f =>
                              f.file === uf.file
                                ? {
                                    ...f,
                                    status: 'uploaded',
                                    url: uploaded.url,
                                    name: uploaded.filename,
                                    key: uploaded.key
                                  }
                                : f
                            )
                          )
                        } catch (e) {
                          toast.error(`Failed to upload ${uf.file.name}`)

                          setUploadedFiles(prev =>
                            prev.map(f =>
                              f.file === uf.file ? { ...f, status: 'error' } : f
                            )
                          )
                        }
                      })
                    )
                  }}
                />
              )}

              <SearchModeSelector />
            </div>

            <div className="flex items-center gap-2">
              {messages.length > 0 && (
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleNewChat}
                  className="shrink-0 size-8 md:size-10 rounded-full group bg-transparent border-white/10 hover:bg-white/10"
                  type="button"
                  disabled={isLoading}
                >
                  <MessageCirclePlus className="size-4 group-hover:rotate-12 transition-all" />
                </Button>
              )}

              <Button
                type={isLoading ? 'button' : 'submit'}
                size={'icon'}
                className={cn(
                  isLoading && 'animate-pulse',
                  'size-8 md:size-10 rounded-full bg-white text-black hover:bg-zinc-200 border-0'
                )}
                disabled={
                  (input.length === 0 && !isLoading) || !hasAvailableModels
                }
                onClick={isLoading ? stop : undefined}
                title={
                  hasAvailableModels
                    ? undefined
                    : 'No enabled model is available'
                }
              >
                {isLoading ? (
                  <Square className="size-4 md:size-5" />
                ) : (
                  <ArrowUp className="size-4 md:size-5" />
                )}
              </Button>
            </div>
          </div>
        </div>

        {messages.length === 0 && (
          <ActionButtons
            onSelectPrompt={message => {
              handleInputChange({
                target: { value: message }
              } as React.ChangeEvent<HTMLTextAreaElement>)

              setTimeout(() => {
                inputRef.current?.form?.requestSubmit()

                setIsInputFocused(false)

                inputRef.current?.blur()
              }, INPUT_UPDATE_DELAY_MS)
            }}
            onCategoryClick={category => {
              handleInputChange({
                target: { value: category }
              } as React.ChangeEvent<HTMLTextAreaElement>)

              inputRef.current?.focus()
            }}
            inputRef={inputRef}
            className="mt-2"
          />
        )}
      </form>
    </div>
  )
}
