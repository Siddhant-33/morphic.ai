import { revalidateTag } from 'next/cache'
import { cookies } from 'next/headers'
import { loadChat } from '@/lib/actions/chat'
import { calculateConversationTurn, trackChatEvent } from '@/lib/analytics'
import { getCurrentUserId } from '@/lib/auth/get-current-user'
import { checkAndEnforceOverallChatLimit } from '@/lib/rate-limit/chat-limits'
import { checkAndEnforceGuestLimit } from '@/lib/rate-limit/guest-limit'
import { createChatStreamResponse } from '@/lib/streaming/create-chat-stream-response'
import { createEphemeralChatStreamResponse } from '@/lib/streaming/create-ephemeral-chat-stream-response'
import { SearchMode } from '@/lib/types/search'
import { selectModel } from '@/lib/utils/model-selection'
import { perfLog, perfTime } from '@/lib/utils/perf-logging'
import { resetAllCounters } from '@/lib/utils/perf-tracking'
import { isProviderEnabled } from '@/lib/utils/registry'

export const maxDuration = 300

export async function POST(req: Request) {
  const startTime = performance.now()
  const abortSignal = req.signal

  if (process.env.ENABLE_PERF_LOGGING === 'true') {
    resetAllCounters()
  }

  try {
    const body = await req.json()
    const {
      message,
      messages,
      chatId,
      trigger,
      messageId,
      isNewChat
    } = body

    const referer = req.headers.get('referer')
    const isSharePage = referer?.includes('/share/')

    const userId = await getCurrentUserId()

    if (isSharePage) {
      return new Response('Chat API is not available on share pages', { status: 403 })
    }

    const guestChatEnabled = process.env.ENABLE_GUEST_CHAT === 'true'
    const isGuest = !userId

    if (isGuest && !guestChatEnabled) {
      return new Response('Authentication required', { status: 401 })
    }

    if (isGuest) {
      const forwardedFor = req.headers.get('x-forwarded-for') || ''
      const ip = forwardedFor.split(',')[0]?.trim() || req.headers.get('x-real-ip') || null
      const guestLimitResponse = await checkAndEnforceGuestLimit(ip)
      if (guestLimitResponse) return guestLimitResponse
    }

    const cookieStore = await cookies()

    const searchModeCookie = cookieStore.get('searchMode')?.value
    const searchMode: SearchMode = 
      searchModeCookie && ['quick', 'adaptive', 'research', 'image'].includes(searchModeCookie)
        ? (searchModeCookie as SearchMode)
        : 'quick'

    let taskType: 'chat' | 'image' | 'research' = 'chat'
    if (searchMode === 'image') taskType = 'image'
    if (searchMode === 'research') taskType = 'research'

    const selectedModel: any = await selectModel({
      searchMode,
      cookieStore,
      taskType
    })

    /*
      FREE IMAGE LIMIT
    */

    if (searchMode === 'image') {
      const imageCount =
        Number(cookieStore.get('freeImageCount')?.value || '0')

      if (imageCount >= 1) {
        return new Response(
          'You have reached your daily free image generation limit.',
          {
            status: 429
          }
        )
      }
    }

    if (!selectedModel) {
      return new Response('No enabled model is available', {
        status: 503,
        statusText: 'Service Unavailable'
      })
    }

    const modelForAPI = {
      id: selectedModel.id,
      name: selectedModel.name || selectedModel.id || 'Unknown',
      provider: selectedModel.provider || selectedModel.providerId || 'unknown',
      providerId: selectedModel.providerId,
    }

    if (!isProviderEnabled(selectedModel.providerId)) {
      return new Response(`Selected provider is not enabled`, { status: 404 })
    }

    if (!isGuest && userId) {
      const overallLimitResponse = await checkAndEnforceOverallChatLimit(userId)
      if (overallLimitResponse) return overallLimitResponse
    }

    const response = isGuest
      ? await createEphemeralChatStreamResponse({
          messages: Array.isArray(messages) ? messages : [],
          model: modelForAPI,
          abortSignal,
          searchMode,
          chatId
        })
      : await createChatStreamResponse({
          message,
          model: modelForAPI,
          chatId,
          userId: userId!,
          trigger,
          messageId,
          abortSignal,
          isNewChat,
          searchMode
        })

    // Background analytics
    ;(async () => {
      try {
        let conversationTurn = 1
        if (!isNewChat && !isGuest && userId) {
          const chat = await loadChat(chatId, userId)
          if (chat?.messages) {
            conversationTurn = calculateConversationTurn(chat.messages) + 1
          }
        }
        if (!isGuest && userId) {
          await trackChatEvent({
            searchMode: searchMode as any,
            conversationTurn,
            isNewChat: isNewChat ?? false,
            trigger: (trigger as any) ?? 'submit-message',
            chatId,
            userId,
            providerId: selectedModel.providerId,
            modelId: selectedModel.id
          })
        }
      } catch (error) {
        console.error('Analytics tracking failed:', error)
      }
    })()

    if (chatId && !isGuest) {
      revalidateTag(`chat-${chatId}`, 'layout')   // ← FIXED
    }

    if (searchMode === 'image') {
      cookieStore.set(
        'freeImageCount',
        '1',
        {
          maxAge: 60 * 60 * 24,
          path: '/'
        }
      )
    }

    return response

  } catch (error) {
    console.error('API route error:', error)
    return new Response('Error processing your request', {
      status: 500,
      statusText: 'Internal Server Error'
    })
  }
}
