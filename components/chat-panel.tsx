'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Textarea from 'react-textarea-autosize'
import { useRouter } from 'next/navigation'

import { UseChatHelpers } from '@ai-sdk/react'
import {
  ArrowUp,
  ChevronDown,
  MessageCirclePlus,
  Square
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
            placeholder={(() => {
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

              return messages.length > 0 ? 'Reply...' : 'Search anything...'
            })()}
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
