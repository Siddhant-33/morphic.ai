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

const IMAGE_LIMIT_HOURS = 6
const MAX_FREE_IMAGE_REQUESTS = 1
const MAX_FREE_MESSAGES = 20

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

    const authStart = performance.now()

    const userId = await getCurrentUserId()

    perfTime('Auth completed', authStart)

    const guestChatEnabled = process.env.ENABLE_GUEST_CHAT === 'true'

    const isGuest = !userId

    if (isGuest && !guestChatEnabled) {
      return new Response('Authentication required', {
        status: 401
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

    const searchModeCookie =
      cookieStore.get('searchMode')?.value || 'quick'

    const searchMode: SearchMode =
      ['quick', 'adaptive', 'research', 'image'].includes(
        searchModeCookie
      )
        ? (searchModeCookie as SearchMode)
        : 'quick'

    /*
      IMAGE LIMIT LOGIC
    */

    if (searchMode === 'image') {
      const imageUsageCookie =
        cookieStore.get('image_generation_usage')?.value

      const now = Date.now()

      let usage = {
        count: 0,
        timestamp: now
      }

      if (imageUsageCookie) {
        try {
          usage = JSON.parse(imageUsageCookie)
        } catch {}
      }

      const diffHours =
        (now - usage.timestamp) / (1000 * 60 * 60)

      if (diffHours >= IMAGE_LIMIT_HOURS) {
        usage = {
          count: 0,
          timestamp: now
        }
      }

      if (usage.count >= MAX_FREE_IMAGE_REQUESTS) {
        return Response.json(
          {
            error:
              'You have reached your daily free image generation limit.',
            pricingRequired: true,
            resetInHours: IMAGE_LIMIT_HOURS
          },
          {
            status: 429
          }
        )
      }

      usage.count += 1

      cookieStore.set(
        'image_generation_usage',
        JSON.stringify(usage),
        {
          maxAge: 60 * 60 * IMAGE_LIMIT_HOURS,
          path: '/'
        }
      )
    }

    /*
      EXCESSIVE CHAT USAGE
    */

    if (
      Array.isArray(messages) &&
      messages.length >= MAX_FREE_MESSAGES
    ) {
      return Response.json(
        {
          error: 'Free usage limit reached',
          pricingRequired: true,
          resetInHours: IMAGE_LIMIT_HOURS
        },
        {
          status: 429
        }
      )
    }

    const taskType =
      searchMode === 'image'
        ? 'image'
        : searchMode === 'research'
          ? 'research'
          : 'chat'

    const selectedModel = await selectModel({
      searchMode,
      cookieStore,
      taskType
    })

    if (!selectedModel) {
      return new Response('No enabled model is available', {
        status: 503
      })
    }

    if (!isProviderEnabled(selectedModel.providerId)) {
      return new Response(
        `Selected provider is not enabled ${selectedModel.providerId}`,
        {
          status: 404
        }
      )
    }

    if (!isGuest) {
      const overallLimitResponse =
        await checkAndEnforceOverallChatLimit(userId)

      if (overallLimitResponse) return overallLimitResponse
    }

    const streamStart = performance.now()

    perfLog(
      `createChatStreamResponse - model=${selectedModel.providerId}:${selectedModel.id}`
    )

    const response = isGuest
      ? await createEphemeralChatStreamResponse({
          messages: Array.isArray(messages)
            ? messages
            : [],
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

    perfTime(
      'createChatStreamResponse resolved',
      streamStart
    )

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
              (trigger as
                | 'submit-message'
                | 'regenerate-message') ??
              'submit-message',
            chatId,
            userId,
            providerId: selectedModel.providerId,
            modelId: selectedModel.id
          })
        }
      } catch (error) {
        console.error(
          'Analytics tracking failed:',
          error
        )
      }
    })()

    /*
      FIXED NEXTJS 16 ERROR
    */

    if (chatId && !isGuest) {
      revalidateTag(`chat-${chatId}`, 'max')
    }

    const totalTime = performance.now() - startTime

    perfLog(
      `Total API route time: ${totalTime.toFixed(2)}ms`
    )

    return response
  } catch (error) {
    console.error('API route error:', error)

    return new Response(
      'Error processing your request',
      {
        status: 500
      }
    )
  }
}
