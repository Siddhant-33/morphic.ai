'use client'
import { useCallback, useEffect, useRef, useState } from 'react'
import Textarea from 'react-textarea-autosize'
import { useRouter } from 'next/navigation'
import { UseChatHelpers } from '@ai-sdk/react'
import { ArrowUp, ChevronDown, MessageCirclePlus, Square } from 'lucide-react'
import { toast } from 'sonner'
import { SHORTCUT_EVENTS } from '@/lib/keyboard-shortcuts'
import { UploadedFile } from '@/lib/types'
import type { UIDataTypes, UIMessage, UITools } from '@/lib/types/ai'
import { cn } from '@/lib/utils'
import { useArtifact } from './artifact/artifact-context'
import { Button } from './ui/button'
import { IconBlinkingLogo } from './ui/icons'
import { ActionButtons } from './action-buttons'
import { FileUploadButton } from './file-upload-button'
import { MessageNavigationDots } from './message-navigation-dots'
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
  scrollContainerRef,
  uploadedFiles,
  setUploadedFiles,
  onNewChat,
  isGuest = false,
}: ChatPanelProps) {
  const router = useRouter()
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const isFirstRender = useRef(true)
  const [isComposing, setIsComposing] = useState(false)
  const [enterDisabled, setEnterDisabled] = useState(false)

  const isLoading = status === 'submitted' || status === 'streaming'

  const handleNewChat = useCallback(() => {
    setMessages([])
    inputRef.current?.blur()
    onNewChat?.()
    router.push('/')
  }, [setMessages, onNewChat, router])

  useEffect(() => {
    if (isFirstRender.current && query && query.trim().length > 0) {
      append({ role: 'user', content: query })
      isFirstRender.current = false
    }
  }, [query, append])

  const handleFileRemove = useCallback((index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index))
  }, [setUploadedFiles])

  return (
    <div className={cn('w-full bg-background group/form-container shrink-0', messages.length > 0 ? 'sticky bottom-0 px-2 pb-4' : 'px-6')}>
      {messages.length === 0 && (
        <div className="mb-10 flex flex-col items-center gap-4">
          <IconBlinkingLogo className="size-12" />
          <h1 className="text-2xl font-medium text-foreground">What would you like to know?</h1>
        </div>
      )}

      {uploadedFiles.length > 0 && <UploadedFileList files={uploadedFiles} onRemove={handleFileRemove} />}

      <form onSubmit={handleSubmit} className="max-w-3xl w-full mx-auto">
        <div className="relative flex flex-col w-full gap-2 bg-muted rounded-3xl border border-input">
          <Textarea
            ref={inputRef}
            rows={2}
            maxRows={6}
            placeholder={messages.length > 0 ? 'Reply...' : 'Ask anything...'}
            value={input}
            onChange={handleInputChange}
            disabled={isLoading}
            className="resize-none w-full min-h-12 bg-transparent border-0 p-4 text-sm placeholder:text-muted-foreground"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                if (input.trim().length === 0) return
                e.preventDefault()
                e.currentTarget.form?.requestSubmit()
              }
            }}
          />

          <div className="flex items-center justify-between p-3">
            <FileUploadButton onFileSelect={/* keep your original upload logic */} />
            
            <div className="flex gap-2">
              {messages.length > 0 && (
                <Button variant="outline" size="icon" onClick={handleNewChat}>
                  <MessageCirclePlus className="size-4" />
                </Button>
              )}
              <Button type={isLoading ? 'button' : 'submit'} size="icon" disabled={input.length === 0 && !isLoading}>
                {isLoading ? <Square className="size-4" /> : <ArrowUp className="size-4" />}
              </Button>
            </div>
          </div>
        </div>
      </form>
    </div>
  )
}
