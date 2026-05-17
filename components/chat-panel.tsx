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
  isCloudDeployment?: boolean
  sections?: { id: string; userMessage: UIMessage }[]
}

export function ChatPanel(props: ChatPanelProps) {
  const {
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
    isCloudDeployment = false,
    sections = []
  } = props

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

  // ... rest of your logic (keep your existing useEffects)

  return (
    <div className={cn('w-full bg-background group/form-container shrink-0', messages.length > 0 ? 'sticky bottom-0 px-2 pb-4' : 'px-6')}>
      {/* Your existing JSX */}
      {/* ... */}
    </div>
  )
}
