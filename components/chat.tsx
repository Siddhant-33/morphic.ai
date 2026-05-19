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
import { cn } from '@/lib/utils'
import { useFileDropzone } from '@/hooks/use-file-dropzone'
import { ChatMessages } from './chat-messages'
import { ChatPanel } from './chat-panel'
import { DragOverlay } from './drag-overlay'
import { ErrorModal } from './error-modal'

interface ChatSection {
  id: string
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
  modelSelectorData?: any
}) {
  const router = useRouter()
  const [chatId, setChatId] = useState(() => providedId || generateId())

  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const [isAtBottom, setIsAtBottom] = useState(true)
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])
  const [input, setInput] = useState('')

  const [errorModal, setErrorModal] = useState<{
    open: boolean
    type: 'rate-limit' | 'auth' | 'forbidden' | 'general'
    message: string
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
      prepareSendMessagesRequest: ({ messages, trigger, messageId }) => ({
        body: {
          trigger,
          chatId,
          messageId,
          message: trigger === 'submit-message' ? messages[messages.length - 1] : undefined,
          isNewChat: trigger === 'submit-message' && messages.length === 1 && savedMessages.length === 0,
        }
      }),
    }),
    messages: savedMessages,
    onFinish: () => {
      window.dispatchEvent(new CustomEvent('chat-history-updated'))
    },
    onError: (error) => {
      const msg = error.message?.toLowerCase() || ''
      if (msg.includes('401') || msg.includes('sign in') || msg.includes('authentication')) {
        setErrorModal({
          open: true,
          type: 'auth',
          message: 'Please sign in to continue using Morphic'
        })
      } else if (msg.includes('429') || msg.includes('limit')) {
        setErrorModal({
          open: true,
          type: 'rate-limit',
          message: 'Daily limit reached. Please try again later or sign in for more.'
        })
      } else {
        toast.error(`Error: ${error.message}`)
      }
    }
  })

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value)
  }

  const sections = useMemo<ChatSection[]>(() => {
    const result: ChatSection[] = []
    let current: ChatSection | null = null

    for (const message of messages) {
      if (message.role === 'user') {
        if (current) result.push(current)
        current = { id: message.id, userMessage: message, assistantMessages: [] }
      } else if (current && message.role === 'assistant') {
        current.assistantMessages.push(message)
      }
    }
    if (current) result.push(current)
    return result
  }, [messages])

  const handleNewChat = () => {
    const newId = generateId()
    setChatId(newId)
    setInput('')
    setUploadedFiles([])
    setErrorModal({ open: false, type: 'general', message: '' })
    router.push('/')
  }

  const { isDragging, handleDragOver, handleDragLeave, handleDrop } = useFileDropzone({
    uploadedFiles,
    setUploadedFiles,
    chatId
  })

  return (
    <ChatProvider sendMessage={sendMessage}>
      <div className={cn('relative flex h-full min-w-0 flex-1 flex-col', messages.length === 0 ? 'items-center justify-center' : '')}>
        <ChatMessages
          sections={sections}
          status={status}
          chatId={chatId}
          isGuest={isGuest}
          addToolResult={addToolResult}
          scrollContainerRef={scrollContainerRef}
          onUpdateMessage={() => {}}
          reload={() => {}}
          error={error}
        />

        <ChatPanel
          chatId={chatId}
          isCloudDeployment={isCloudDeployment}
          modelSelectorData={modelSelectorData}
          input={input}
          handleInputChange={handleInputChange}
          handleSubmit={(e) => {
            e.preventDefault()
            if (input.trim()) {
              sendMessage({ role: 'user', content: input })
              setInput('')
            }
          }}
          status={status}
          messages={messages}
          setMessages={setMessages}
          stop={stop}
          query={query}
          append={sendMessage}
          showScrollToBottomButton={!isAtBottom}
          uploadedFiles={uploadedFiles}
          setUploadedFiles={setUploadedFiles}
          scrollContainerRef={scrollContainerRef}
          onNewChat={handleNewChat}
          isGuest={isGuest}
        />

        <DragOverlay visible={isDragging} />

        <ErrorModal
          open={errorModal.open}
          onOpenChange={(open) => setErrorModal(prev => ({ ...prev, open }))}
          error={errorModal}
          onAuthClose={() => router.push('/')}
        />
      </div>
    </ChatProvider>
  )
}
