import { revalidateTag } from 'next/cache'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import Stripe from 'stripe'

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

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-08-27.basil'
})

function isGeminiQuotaError(err: unknown): boolean {
  const msg = String(err).toLowerCase()

  return (
    msg.includes('quota') ||
    msg.includes('429') ||
    msg.includes('resource_exhausted') ||
    msg.includes('free_tier') ||
    msg.includes('rate limit') ||
    msg.includes('billing')
  )
}

function cleanError(err: unknown): NextResponse {
  console.error('[AI ERROR]', err)

  if (isGeminiQuotaError(err)) {
    return NextResponse.json(
      {
        error: 'RATE_LIMIT',
        message: 'You have reached our free limit, Please contact the owner.',
        showPricing: false
      },
      { status: 429 }
    )
  }

  return NextResponse.json(
    {
      error: 'AI_ERROR',
      message: 'Something went wrong. Please try again.'
    },
    { status: 500 }
  )
}

export async function PUT(req: Request) {
  try {
    const body = await req.json()

    if (body.type !== 'stripe') {
      return NextResponse.json(
        { error: 'Invalid request' },
        { status: 400 }
      )
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: body.priceId,
          quantity: 1
        }
      ],
      success_url: `${req.headers.get('origin')}?success=true`,
      cancel_url: `${req.headers.get('origin')}?canceled=true`
    })

    return NextResponse.json({
      url: session.url
    })
  } catch (error) {
    console.error(error)
    return NextResponse.json(
      { error: 'Stripe checkout failed' },
      { status: 500 }
    )
  }
}

export async function POST(req: Request) {
  const startTime = performance.now()
  const abortSignal = req.signal

  const body = await req.json()

  if (body.action === 'create-checkout') {
    try {
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        mode: 'subscription',
        line_items: [
          {
            price: body.priceId,
            quantity: 1
          }
        ],
        success_url: `${process.env.NEXT_PUBLIC_APP_URL}/success`,
        cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}`
      })

      return Response.json({
        url: session.url
      })
    } catch (error) {
      console.error(error)
      return Response.json(
        { error: 'Stripe checkout failed' },
        { status: 500 }
      )
    }
  }

  if (process.env.ENABLE_PERF_LOGGING === 'true') {
    resetAllCounters()
  }

  try {
    const { message, messages, chatId, trigger, messageId, isNewChat } = body

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
      const guestId =
        req.headers.get('x-vercel-id') ||
        req.headers.get('x-forwarded-for') ||
        crypto.randomUUID()

      const guestLimitResponse = await checkAndEnforceGuestLimit(guestId)
      if (guestLimitResponse) return guestLimitResponse
    }

    const cookieStore = await cookies()

    const searchModeCookie = cookieStore.get('searchMode')?.value
    const searchMode: SearchMode =
      searchModeCookie && ['quick', 'adaptive', 'planning', 'image'].includes(searchModeCookie)
        ? (searchModeCookie as SearchMode)
        : 'quick'

    const selectedModel = await selectModel({ searchMode, cookieStore })

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
      `createChatStreamResponse - Start: model=${selectedModel.providerId}:${selectedModel.id}, searchMode=${searchMode}`
    )

    const latestMessage =
      message?.content ||
      (Array.isArray(messages)
        ? messages[messages.length - 1]?.content
        : '')

    const imageKeywords = [
      'generate image', 'create image', 'make image', 'draw', 'photo',
      'picture', 'wallpaper', 'illustration', 'logo', 'art', 'anime', 'realistic image'
    ]

    const isImageGenerationRequest =
      typeof latestMessage === 'string' &&
      imageKeywords.some(keyword =>
        latestMessage.toLowerCase().includes(keyword)
      )

    const finalSearchMode: SearchMode =
      isImageGenerationRequest
        ? 'adaptive'
        : searchMode

    const response = isGuest
      ? await createEphemeralChatStreamResponse({
          messages: Array.isArray(messages) ? messages : [],
          model: selectedModel,
          abortSignal,
          searchMode: finalSearchMode,
          chatId
        })
      : await createChatStreamResponse({
          message,
          model: selectedModel,
          chatId,
          userId: userId,
          trigger,
          messageId,
          abortSignal,
          isNewChat,
          searchMode: finalSearchMode
        })

    perfTime('createChatStreamResponse resolved', streamStart)

    ;(async () => {
      try {
        let conversationTurn = 1
        if (!isNewChat && !isGuest) {
          const chat = await loadChat(chatId, userId)
          if (chat?.messages) {
            conversationTurn = calculateConversationTurn(chat.messages) + 1
          }
        }

        if (!isGuest && userId) {
          await trackChatEvent({
            searchMode:
              searchMode === 'adaptive' ||
              searchMode === 'research' ||
              searchMode === 'image'
                ? 'adaptive'
                : 'quick',
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
      revalidateTag(chatId, 'max')
    }

    return response
  } catch (error) {
    return cleanError(error)
  }
}
