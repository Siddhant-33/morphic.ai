import { UIMessage } from 'ai'

import { createChatWithFirstMessage, upsertMessage } from '@/lib/actions/chat'
import { updateChatTitle } from '@/lib/db/actions'
import { SearchMode } from '@/lib/types/search'
import { perfTime } from '@/lib/utils/perf-logging'
import { retryDatabaseOperation } from '@/lib/utils/retry'

const DEFAULT_CHAT_TITLE = 'Untitled'

export async function persistStreamResults(
  responseMessage: UIMessage,
  chatId: string,
  userId: string,
  titlePromise?: Promise<string>,
  parentTraceId?: string,
  searchMode?: SearchMode,
  modelId?: string,
  initialSavePromise?: Promise<
    Awaited<ReturnType<typeof createChatWithFirstMessage>>
  >,
  initialUserMessage?: UIMessage
) {
  // Attach metadata to response message
  responseMessage.metadata = {
    ...(responseMessage.metadata || {}),
    ...(parentTraceId && { traceId: parentTraceId }),
    ...(searchMode && { searchMode }),
    ...(modelId && { modelId })
  }

  // Wait for title generation
  const chatTitle = titlePromise ? await titlePromise : undefined

  // Ensure initial chat creation completed
  if (initialSavePromise) {
    const initialSaveStart = performance.now()

    try {
      await initialSavePromise
      perfTime('initial chat persistence awaited', initialSaveStart)
    } catch (error) {
      console.error('Initial chat persistence failed:', error)

      if (initialUserMessage) {
        const fallbackStart = performance.now()

        try {
          await createChatWithFirstMessage(
            chatId,
            initialUserMessage,
            userId,
            DEFAULT_CHAT_TITLE
          )

          perfTime(
            'initial chat persistence fallback completed',
            fallbackStart
          )
        } catch (fallbackError) {
          const isDuplicateKey =
            fallbackError instanceof Error &&
            (fallbackError.message.includes('duplicate key') ||
              fallbackError.message.includes('unique constraint'))

          if (isDuplicateKey) {
            console.log(
              'Chat already exists (duplicate key), continuing with response save'
            )

            perfTime(
              'initial chat persistence duplicate handled',
              fallbackStart
            )
          } else {
            console.error('Fallback chat creation failed:', fallbackError)
            return
          }
        }
      } else {
        return
      }
    }
  }

  // Save AI response message
  const saveStart = performance.now()

  try {
    await upsertMessage(chatId, responseMessage, userId)

    perfTime('upsertMessage completed', saveStart)
  } catch (error) {
    console.error('Error saving message:', error)

    try {
      await retryDatabaseOperation(
        () => upsertMessage(chatId, responseMessage, userId),
        'save message'
      )

      perfTime('upsertMessage retry completed', saveStart)
    } catch (retryError) {
      console.error('Failed to save after retries:', retryError)
    }
  }

  // Update title if generated
  if (chatTitle && chatTitle !== DEFAULT_CHAT_TITLE) {
    try {
      await updateChatTitle(chatId, chatTitle, userId)
    } catch (error) {
      console.error('Error updating title:', error)
    }
  }
}
