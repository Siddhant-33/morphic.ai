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

    perfLog(
      `API Route - Start: chatId=${chatId}, trigger=${trigger}, isNewChat=${isNewChat}`
    )

    if (trigger === 'regenerate-message') {
      if (!messageId) {
        return new Response('messageId is required for regeneration', {
          status: 400,
          statusText: 'Bad Request'
        })
      }
    } else if (trigger === 'submit-message') {
      if (!message) {
        return new Response('message is required for submission', {
          status: 400,
          statusText: 'Bad Request'
        })
      }
    }

    const referer = req.headers.get('referer')
    const isSharePage = referer?.includes('/share/')

    const authStart = performance.now()

    const userId = await getCurrentUserId()

    perfTime('Auth completed', authStart)

    if (isSharePage) {
      return new Response('Chat API is not available on share pages', {
        status: 403,
        statusText: 'Forbidden'
      })
    }

    const guestChatEnabled = process.env.ENABLE_GUEST_CHAT === 'true'

    const isGuest = !userId

    if (isGuest && !guestChatEnabled) {
      return new Response('Authentication required', {
        status: 401,
        statusText: 'Unauthorized'
      })
    }

    if (isGuest) {
      const forwardedFor = req.headers.get('x-forwarded-for') || ''

      const ip =
        forwardedFor.split(',')[0]?.trim() ||
        req.headers.get('x-real-ip') ||
        null

      const guestLimitResponse = await checkAndEnforceGuestLimit(ip)

      if (guestLimitResponse) return guestLimitResponse
    }

    const cookieStore = await cookies()

    const searchModeCookie = cookieStore.get('searchMode')?.value

    const searchMode: SearchMode =
      searchModeCookie && ['quick', 'adaptive'].includes(searchModeCookie)
        ? (searchModeCookie as SearchMode)
        : 'quick'

    /*
      AUTO TASK DETECTION
    */

    const latestMessage =
      Array.isArray(messages) && messages.length > 0
        ? messages[messages.length - 1]?.content || ''
        : message || ''

    const lowerPrompt = String(latestMessage).toLowerCase()

    let taskType: 'chat' | 'image' | 'research' = 'chat'

    /*
      IMAGE TASKS
    */

    if (
      lowerPrompt.includes('generate image') ||
      lowerPrompt.includes('create image') ||
      lowerPrompt.includes('make image') ||
      lowerPrompt.includes('draw') ||
      lowerPrompt.includes('image generation') ||
      lowerPrompt.includes('create a photo') ||
      lowerPrompt.includes('create an image')
    ) {
      taskType = 'image'
    }

    /*
      RESEARCH TASKS
    */

    else if (
      lowerPrompt.includes('deep research') ||
      lowerPrompt.includes('research') ||
      lowerPrompt.includes('analyze deeply') ||
      lowerPrompt.includes('full analysis') ||
      lowerPrompt.includes('investigate')
    ) {
      taskType = 'research'
    }

    /*
      MODEL AUTO ROUTING
    */

    const selectedModel = await selectModel({
      searchMode,
      cookieStore,
      taskType
    })

    if (!selectedModel) {
      return new Response('No enabled model is available', {
        status: 503,
        statusText: 'Service Unavailable'
      })
    }

    if (!isProviderEnabled(selectedModel.providerId)) {
      return new Response(
        `Selected provider is not enabled ${selectedModel.providerId}`,
        {
          status: 404,
          statusText: 'Not Found'
        }
      )
    }

    if (!isGuest) {
      const overallLimitResponse = await checkAndEnforceOverallChatLimit(userId)

      if (overallLimitResponse) return overallLimitResponse
    }

    const streamStart = performance.now()

    perfLog(
      `createChatStreamResponse - Start: model=${selectedModel.providerId}:${selectedModel.id}, searchMode=${searchMode}, taskType=${taskType}`
    )

    const response = isGuest
      ? await createEphemeralChatStreamResponse({
          messages: Array.isArray(messages) ? messages : [],
          model: selectedModel,
          abortSignal,
          searchMode,
          chatId
        })
      : await createChatStreamResponse({
          message,
          model: selectedModel,
          chatId,
          userId,
          trigger,
          messageId,
          abortSignal,
          isNewChat,
          searchMode
        })

    perfTime('createChatStreamResponse resolved', streamStart)

    ;(async () => {
      try {
        let conversationTurn = 1

        if (!isNewChat && !isGuest) {
          const chat = await loadChat(chatId, userId)

          if (chat?.messages) {
            conversationTurn =
              calculateConversationTurn(chat.messages) + 1
          }
        }

        if (!isGuest && userId) {
          await trackChatEvent({
            searchMode,
            conversationTurn,
            isNewChat: isNewChat ?? false,
            trigger:
              (trigger as 'submit-message' | 'regenerate-message') ??
              'submit-message',
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
      revalidateTag(`chat-${chatId}`, 'max')
    }

    const totalTime = performance.now() - startTime

    perfLog(`Total API route time: ${totalTime.toFixed(2)}ms`)
    perfLog(`=== Summary ===`)
    perfLog(`Chat Type: ${isNewChat ? 'NEW' : 'EXISTING'}`)
    perfLog(`Task Type: ${taskType}`)
    perfLog(`Total Time: ${totalTime.toFixed(2)}ms`)
    perfLog(`================`)

    return response
  } catch (error) {
    console.error('API route error:', error)

    return new Response('Error processing your request', {
      status: 500,
      statusText: 'Internal Server Error'
    })
  }
}
