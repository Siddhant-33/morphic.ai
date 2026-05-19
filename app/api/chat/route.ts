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

    const totalMessages =
      Array.isArray(messages) ? messages.length : 0

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

      if (guestLimitResponse) {
        return new Response(
          JSON.stringify({
            error: true,
            showPricingModal: true,
            message:
              'You have reached your current free usage limit. Upgrade to continue instantly or wait 6 hours for reset.'
          }),
          {
            status: 429,
            headers: {
              'Content-Type': 'application/json'
            }
          }
        )
      }
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

    if (totalMessages >= 20) {
      return new Response(
        JSON.stringify({
          error: true,
          pricingRequired: true,
          message:
            'You reached your free usage limit. Please upgrade or wait 6 hours.'
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      )
    }

    const selectedModel: any = await selectModel({
      searchMode,
      cookieStore,
      taskType
    })

    /*
      FREE IMAGE LIMIT
    */
    const imageCountCookie =
      cookieStore.get('image_count')?.value || '0'

    const imageCount = Number(imageCountCookie)

    if (taskType === 'image' && imageCount >= 1) {
      return new Response(
        JSON.stringify({
          error: true,
          message:
            'You have reached your daily free image generation limit.'
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      )
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

    if (searchMode === 'image') {
      const imagePrompt =
        typeof message === 'string'
          ? message
          : messages?.[messages.length - 1]?.content || ''

      const imageResponse = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-preview-image-generation:generateContent?key=${process.env.GOOGLE_GENERATIVE_AI_API_KEY}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text: imagePrompt
                  }
                ]
              }
            ],
            generationConfig: {
              responseModalities: ['TEXT', 'IMAGE']
            }
          })
        }
      )

      const data = await imageResponse.json()

      const imageData =
        data?.candidates?.[0]?.content?.parts?.find(
          (p: any) => p.inlineData
        )?.inlineData?.data

      if (!imageData) {
        return new Response(
          JSON.stringify({
            error: true,
            message: 'Image generation failed'
          }),
          {
            status: 500,
            headers: {
              'Content-Type': 'application/json'
            }
          }
        )
      }

      return new Response(
        JSON.stringify({
          image:
            `data:image/png;base64,${imageData}`
        }),
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      )
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
      revalidateTag(`chat-${chatId}`, 'max')
    }

    if (searchMode === 'image') {
      cookieStore.set(
        'image_count',
        (imageCount + 1).toString(),
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
