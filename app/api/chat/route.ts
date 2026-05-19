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
import { isProviderEnabled } from '@/lib/utils/registry'

export const maxDuration = 300

export async function POST(req: Request) {
  const abortSignal = req.signal

  try {
    const body = await req.json()
    const { message, messages, chatId, trigger, messageId, isNewChat } = body

    const userId = await getCurrentUserId()
    const isGuest = !userId

    if (isGuest) {
      const guestChatEnabled = process.env.ENABLE_GUEST_CHAT === 'true'
      if (!guestChatEnabled) {
        return new Response(JSON.stringify({ 
          error: "Please sign in to continue", 
          requiresAuth: true 
        }), { 
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        })
      }

      const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || null
      const guestLimit = await checkAndEnforceGuestLimit(ip)
      if (guestLimit) return guestLimit
    }

    const cookieStore = await cookies()
    const searchMode: SearchMode = 
      (cookieStore.get('searchMode')?.value as SearchMode) || 'quick'

    const selectedModel: any = await selectModel({
      searchMode,
      cookieStore,
      taskType: 'chat'
    })

    if (!selectedModel) {
      return new Response('No enabled model is available', { status: 503 })
    }

    const modelForAPI = {
      id: selectedModel.id,
      name: selectedModel.name || selectedModel.id,
      provider: selectedModel.provider || 'google',
      providerId: selectedModel.providerId,
    }

    if (!isProviderEnabled(selectedModel.providerId)) {
      return new Response('Selected provider not enabled', { status: 404 })
    }

    if (!isGuest && userId) {
      const limit = await checkAndEnforceOverallChatLimit(userId)
      if (limit) return limit
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

    // Fixed revalidateTag
    if (chatId && !isGuest) {
      revalidateTag(`chat-${chatId}`)
    }

    return response

  } catch (error) {
    console.error('Chat API Error:', error)
    return new Response('Internal Server Error', { status: 500 })
  }
}
