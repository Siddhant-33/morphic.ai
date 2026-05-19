'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'

import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport } from 'ai'
import { toast } from 'sonner'

import { ChatProvider } from '@/lib/contexts/chat-context'
import { generateId } from '@/lib/db/schema'
import { SHORTCUT_EVENTS } from '@/lib/keyboard-shortcuts'
import { stripSpecBlocks } from '@/lib/render/strip-spec-blocks'
import { UploadedFile } from '@/lib/types'
import type { UIMessage } from '@/lib/types/ai'
import {
  isDynamicToolPart,
  isToolCallPart,
  isToolTypePart
} from '@/lib/types/dynamic-tools'
import type { ModelSelectorData } from '@/lib/types/model-selector'
import { cn } from '@/lib/utils'

import { useFileDropzone } from '@/hooks/use-file-dropzone'

import { ChatMessages } from './chat-messages'
import { ChatPanel } from './chat-panel'
import { DragOverlay } from './drag-overlay'
import { ErrorModal } from './error-modal'

// Define section structure
interface ChatSection {
  id: string // User message ID
  userMessage: UIMessage
  assistantMessages: UIMessage[]
}

export function Chat({
  id: providedId,
  savedMessages = [],
  query,
  isGuest = false,
  isCloudDeployment = false,
  modelSelectorData
}: {
  id?: string
  savedMessages?: UIMessage[]
  query?: string
  isGuest?: boolean
  isCloudDeployment?: boolean
  modelSelectorData?: ModelSelectorData
}) {
  const router = useRouter()
  const [showPricingModal, setShowPricingModal] = useState(false)

  // Generate a stable chatId on the client side
  const [chatId, setChatId] = useState(() => providedId || generateId())

  // Callback to reset chat state when user clicks "New" button
  const handleNewChat = () => {
    const newId = generateId()
    setChatId(newId)
    setInput('')
    setUploadedFiles([])
    setErrorModal({
      open: false,
      type: 'general',
      message: ''
    })
  }

  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const [isAtBottom, setIsAtBottom] = useState(true)
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])
  const [input, setInput] = useState('')
  const [errorModal, setErrorModal] = useState<{
    open: boolean
    type: 'rate-limit' | 'auth' | 'forbidden' | 'general'
    message: string
    details?: string
  }>({
    open: false,
    type: 'general',
    message: ''
  })

  const {
    messages,
    status,
    setMessages,
    stop,
    sendMessage,
    regenerate,
    addToolResult,
    error
  } = useChat({
    id: chatId,
    transport: new DefaultChatTransport({
      api: '/api/chat',
      prepareSendMessagesRequest: ({ messages, trigger, messageId }) => {
        const lastMessage = messages[messages.length - 1]
        const messageToRegenerate =
          trigger === 'regenerate-message'
            ? messages.find(m => m.id === messageId)
            : undefined

        return {
          body: {
            trigger,
            chatId: chatId,
            messageId,
            ...(isGuest ? { messages } : {}),
            message:
              trigger === 'regenerate-message' &&
              messageToRegenerate?.role === 'user'
                ? messageToRegenerate
                : trigger === 'submit-message'
                  ? lastMessage
                  : undefined,
            isNewChat:
              trigger === 'submit-message' &&
              messages.length === 1 &&
              savedMessages.length === 0
          }
        }
      },
      // Error handling implementation
      async fetch(url, options) {
        const response = await fetch(url, options)
        if (!response.ok) {
          try {
            const data = await response.json()
            if (data?.showPricingModal) {
              setShowPricingModal(true)
              return new Response(JSON.stringify(data), { status: response.status })
            }
          } catch (e) {}
          throw new Error('Request failed')
        }
        return response
      }
    }),
    messages: savedMessages,
    onFinish: () => {
      window.dispatchEvent(new CustomEvent('chat-history-updated'))
    },
    onError: error => {
      const errorMessage = error.message?.toLowerCase() || ''
      const isRateLimit =
        error.message?.includes('429') ||
        errorMessage.includes('rate limit') ||
        errorMessage.includes('too many requests') ||
        errorMessage.includes('daily limit')

      const isAuthError =
        error.message?.includes('401') ||
        errorMessage.includes('unauthorized') ||
        errorMessage.includes('authentication required') ||
        errorMessage.includes('sign in to continue')

      if (isRateLimit) {
        let parsedError: {
          error?: string
          resetAt?: number
          remaining?: number
        } = {}
        try {
          const jsonMatch = error.message?.match(/\{.*\}/)
          if (jsonMatch) {
            parsedError = JSON.parse(jsonMatch[0])
          }
        } catch {}

        const userMessage =
          parsedError.error ||
          'You have reached your daily limit for quality mode chat requests.'

        setErrorModal({
          open: true,
          type: 'rate-limit',
          message: userMessage,
          details: undefined
        })
      } else if (isAuthError) {
        setErrorModal({
          open: true,
          type: 'auth',
          message: error.message
        })
      } else if (
        error.message?.includes('403') ||
        errorMessage.includes('forbidden')
      ) {
        setErrorModal({
          open: true,
          type: 'forbidden',
          message: error.message
        })
      } else {
        toast.error(`Error in chat: ${error.message}`)
      }
    },
    experimental_throttle: 100,
    generateId
  })

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value)
  }

  const sections = useMemo<ChatSection[]>(() => {
    const result: ChatSection[] = []
    let currentSection: ChatSection | null = null

    for (const message of messages) {
      if (message.role === 'user') {
        if (currentSection) {
          result.push(currentSection)
        }
        currentSection = {
          id: message.id,
          userMessage: message,
          assistantMessages: []
        }
      } else if (currentSection && message.role === 'assistant') {
        currentSection.assistantMessages.push(message)
      }
    }

    if (currentSection) {
      result.push(currentSection)
    }

    return result
  }, [messages])

  const messagesRef = useRef(messages)
  useEffect(() => {
    messagesRef.current = messages
  }, [messages])

  useEffect(() => {
    const handleCopyMessage = (e: Event) => {
      if (e.defaultPrevented) return
      if (!scrollContainerRef.current?.offsetParent) return
      e.preventDefault()

      const assistantMessages = messagesRef.current.filter(
        m => m.role === 'assistant'
      )
      const lastAssistant = assistantMessages[assistantMessages.length - 1]
      if (!lastAssistant) {
        toast.info('No assistant message to copy')
        return
      }
      const text =
        lastAssistant.parts
          ?.filter(
            (p): p is { type: 'text'; text: string } => p.type === 'text'
          )
          .map(p => p.text)
          .join('\n') ?? ''

      if (text) {
        navigator.clipboard.writeText(stripSpecBlocks(text)).then(
          () => toast.success('Message copied to clipboard'),
          () => toast.error('Failed to copy message')
        )
      }
    }

    window.addEventListener(SHORTCUT_EVENTS.copyMessage, handleCopyMessage)
    return () =>
      window.removeEventListener(SHORTCUT_EVENTS.copyMessage, handleCopyMessage)
  }, [])

  useEffect(() => {
    window.dispatchEvent(
      new CustomEvent('messages-changed', {
        detail: { hasMessages: messages.length > 0 }
      })
    )
  }, [messages.length])

  useEffect(() => {
    const container = scrollContainerRef.current
    if (!container) return

    const updateIsAtBottom = () => {
      const { scrollTop, scrollHeight, clientHeight } = container
      const threshold = 50
      setIsAtBottom(scrollHeight - scrollTop - clientHeight < threshold)
    }

    const handleScroll = () => {
      updateIsAtBottom()
    }

    container.addEventListener('scroll', handleScroll, { passive: true })
    const frame = requestAnimationFrame(updateIsAtBottom)

    return () => {
      cancelAnimationFrame(frame)
      container.removeEventListener('scroll', handleScroll)
    }
  }, [messages.length])

  useEffect(() => {
    const container = scrollContainerRef.current
    if (!container) return

    const frame = requestAnimationFrame(() => {
      const { scrollTop, scrollHeight, clientHeight } = container
      const threshold = 50
      setIsAtBottom(scrollHeight - scrollTop - clientHeight < threshold)
    })

    return () => cancelAnimationFrame(frame)
  }, [messages])

  useEffect(() => {
    const isCurrentChat =
      window.location.pathname === `/search/${chatId}` ||
      (window.location.pathname === '/' && sections.length > 0)

    if (isCurrentChat && sections.length > 0) {
      const lastMessage = messages[messages.length - 1]
      if (lastMessage && lastMessage.role === 'user') {
        const sectionId = lastMessage.id
        requestAnimationFrame(() => {
          const sectionElement = document.getElementById(`section-${sectionId}`)
          sectionElement?.scrollIntoView({ behavior: 'smooth', block: 'start' })
        })
      }
    }
  }, [sections, messages, chatId])

  const handleUpdateAndReloadMessage = async (
    editedMessageId: string,
    newContentText: string
  ) => {
    if (!chatId) {
      toast.error('Chat ID is missing.')
      return
    }

    try {
      setMessages(prevMessages => {
        const messageIndex = prevMessages.findIndex(
          m => m.id === editedMessageId
        )
        if (messageIndex === -1) return prevMessages

        const updatedMessages = [...prevMessages]
        updatedMessages[messageIndex] = {
          ...updatedMessages[messageIndex],
          parts: [{ type: 'text', text: newContentText }]
        }

        return updatedMessages
      })

      await regenerate({ messageId: editedMessageId })
    } catch (error) {
      console.error('Error during message edit and reload process:', error)
      toast.error(
        `Error processing edited message: ${(error as Error).message}`
      )
    }
  }

  const handleReloadFrom = async (reloadFromFollowerMessageId: string) => {
    if (!chatId) {
      toast.error('Chat ID is missing for reload.')
      return
    }

    try {
      await regenerate({ messageId: reloadFromFollowerMessageId })
    } catch (error) {
      console.error(
        `Error during reload from message ${reloadFromFollowerMessageId}:`,
        error
      )
      toast.error(`Failed to reload conversation: ${(error as Error).message}`)
    }
  }

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    const uploaded = uploadedFiles.filter(f => f.status === 'uploaded')

    if (input.trim() || uploaded.length > 0) {
      const parts: any[] = []

      if (input.trim()) {
        parts.push({ type: 'text', text: input })
      }

      uploaded.forEach(f => {
        parts.push({
          type: 'file',
          url: f.url!,
          filename: f.name!,
          mediaType: f.file.type
        })
      })

      sendMessage({ role: 'user', parts })
      setInput('')
      setUploadedFiles([])

      if (!isGuest && window.location.pathname === '/') {
        window.history.pushState({}, '', `/search/${chatId}`)
      }
    }
  }

  const { isDragging, handleDragOver, handleDragLeave, handleDrop } =
    useFileDropzone({
      uploadedFiles,
      setUploadedFiles,
      chatId: chatId
    })
  const guestDragHandlers = {
    isDragging: false,
    handleDragOver: (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault()
    },
    handleDragLeave: (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault()
    },
    handleDrop: (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault()
    }
  }
  const dragHandlers = isGuest
    ? guestDragHandlers
    : { isDragging, handleDragOver, handleDragLeave, handleDrop }

  return (
    <ChatProvider sendMessage={sendMessage}>
      <div
        className={cn(
          'relative flex h-full min-w-0 flex-1 flex-col',
          messages.length === 0 ? 'items-center justify-center' : ''
        )}
        data-testid="full-chat"
        onDragOver={dragHandlers.handleDragOver}
        onDragLeave={dragHandlers.handleDragLeave}
        onDrop={dragHandlers.handleDrop}
      >
        <ChatMessages
          sections={sections}
          status={status}
          chatId={chatId}
          isGuest={isGuest}
          addToolResult={({
            toolCallId,
            result
          }: {
            toolCallId: string
            result: any
          }) => {
            let toolName = 'unknown'

            outerLoop: for (const message of messages) {
              if (!message.parts) continue

              for (const part of message.parts) {
                if (isToolCallPart(part) && part.toolCallId === toolCallId) {
                  toolName = part.toolName
                  break outerLoop
                } else if (
                  isToolTypePart(part) &&
                  part.toolCallId === toolCallId
                ) {
                  toolName = part.type.substring(5)
                  break outerLoop
                } else if (
                  isDynamicToolPart(part) &&
                  part.toolCallId === toolCallId
                ) {
                  toolName = part.toolName
                  break outerLoop
                }
              }
            }

            addToolResult({ tool: toolName, toolCallId, output: result })
          }}
          scrollContainerRef={scrollContainerRef}
          onUpdateMessage={handleUpdateAndReloadMessage}
          reload={handleReloadFrom}
          error={error}
        />
        <ChatPanel
          chatId={chatId}
          input={input}
          handleInputChange={handleInputChange}
          handleSubmit={onSubmit}
          status={status}
          messages={messages}
          setMessages={setMessages}
          stop={stop}
          query={query}
          append={(message: any) => {
            sendMessage(message)
          }}
          showScrollToBottomButton={!isAtBottom}
          uploadedFiles={uploadedFiles}
          setUploadedFiles={setUploadedFiles}
          scrollContainerRef={scrollContainerRef}
          onNewChat={handleNewChat}
          isGuest={isGuest}
          isCloudDeployment={isCloudDeployment}
          modelSelectorData={modelSelectorData}
          sections={sections}
        />
        <DragOverlay visible={dragHandlers.isDragging} />
        <ErrorModal
          open={errorModal.open}
          onOpenChange={open => setErrorModal(prev => ({ ...prev, open }))}
          error={errorModal}
          onRetry={
            errorModal.type !== 'rate-limit'
              ? () => {
                  if (messages.length > 0) {
                    const lastUserMessage = messages
                      .filter(m => m.role === 'user')
                      .pop()
                    if (lastUserMessage) {
                      sendMessage(lastUserMessage)
                    }
                  }
                }
              : undefined
          }
          onAuthClose={() => {
            setMessages([])
            router.push('/')
          }}
        />

        {showPricingModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-md p-4">
            <div className="relative w-full max-w-4xl overflow-y-auto max-h-[90vh] rounded-3xl border border-border bg-background p-6 md:p-8 shadow-2xl">
              <button
                onClick={() => setShowPricingModal(false)}
                className="absolute right-4 top-4 rounded-full border border-border px-3 py-1 text-sm hover:bg-muted"
              >
                Close
              </button>

              <div className="mb-8 text-center">
                <h2 className="text-3xl font-bold tracking-tight">
                  Upgrade Your Experience
                </h2>
                <p className="mt-3 text-muted-foreground">
                  You’ve reached your free usage limit.
                  Upgrade for higher limits, faster AI,
                  image generation, research tools and more.
                </p>
              </div>

              <div className="grid gap-6 md:grid-cols-3">
                <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
                  <div className="mb-4">
                    <h3 className="text-xl font-semibold">Starter Pro</h3>
                    <p className="mt-1 text-sm text-muted-foreground">Perfect for casual users</p>
                  </div>
                  <div className="mb-6 text-4xl font-bold">
                    ₹199<span className="text-base font-normal text-muted-foreground">/month</span>
                  </div>
                  <ul className="space-y-3 text-sm">
                    <li>✓ Faster responses</li>
                    <li>✓ Research Mode</li>
                    <li>✓ More messages</li>
                    <li>✓ Image generation</li>
                  </ul>
                  <button
                    className="mt-6 w-full rounded-2xl bg-black px-4 py-3 text-white dark:bg-white dark:text-black"
                    onClick={() => alert('Demo Payment Gateway\n\nUPI: morphic@upi\nCard: 4242 4242 4242 4242')}
                  >
                    Select Plan
                  </button>
                </div>

                <div className="rounded-3xl border-2 border-primary bg-card p-6 shadow-xl scale-[1.02]">
                  <div className="mb-4">
                    <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">MOST POPULAR</span>
                    <h3 className="mt-3 text-xl font-semibold">Pro Ultra</h3>
                    <p className="mt-1 text-sm text-muted-foreground">Best for power users</p>
                  </div>
                  <div className="mb-6 text-4xl font-bold">
                    ₹499<span className="text-base font-normal text-muted-foreground">/month</span>
                  </div>
                  <ul className="space-y-3 text-sm">
                    <li>✓ Unlimited chat</li>
                    <li>✓ Priority AI speed</li>
                    <li>✓ Deep research</li>
                    <li>✓ Premium image generation</li>
                    <li>✓ Advanced reasoning</li>
                  </ul>
                  <button
                    className="mt-6 w-full rounded-2xl bg-black px-4 py-3 text-white dark:bg-white dark:text-black"
                    onClick={() => alert('Demo Payment Gateway\n\nUPI: morphic@upi\nCard: 4242 4242 4242 4242')}
                  >
                    Select Plan
                  </button>
                </div>

                <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
                  <div className="mb-4">
                    <h3 className="text-xl font-semibold">Enterprise</h3>
                    <p className="mt-1 text-sm text-muted-foreground">Teams & creators</p>
                  </div>
                  <div className="mb-6 text-4xl font-bold">
                    ₹1499<span className="text-base font-normal text-muted-foreground">/month</span>
                  </div>
                  <ul className="space-y-3 text-sm">
                    <li>✓ Maximum limits</li>
                    <li>✓ Premium support</li>
                    <li>✓ All future tools</li>
                    <li>✓ Team access</li>
                  </ul>
                  <button
                    className="mt-6 w-full rounded-2xl bg-black px-4 py-3 text-white dark:bg-white dark:text-black"
                    onClick={() => alert('Demo Payment Gateway\n\nUPI: morphic@upi\nCard: 4242 4242 4242 4242')}
                  >
                    Select Plan
                  </button>
                </div>
              </div>
              <div className="mt-8 text-center text-sm text-muted-foreground">
                Free limits reset automatically after 6 hours.
              </div>
            </div>
          </div>
        )}
      </div>
    </ChatProvider>
  )
}
