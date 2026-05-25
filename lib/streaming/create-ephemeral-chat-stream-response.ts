import type { UIMessage } from 'ai'
import {
  consumeStream,
  convertToModelMessages,
  pruneMessages,
  smoothStream
} from 'ai'
import { randomUUID } from 'crypto'
import { Langfuse } from 'langfuse'

import { researcher } from '@/lib/agents/researcher'
import { isTracingEnabled } from '@/lib/utils/telemetry'

import {
  getMaxAllowedTokens,
  shouldTruncateMessages,
  truncateMessages
} from '../utils/context-window'

import { stripReasoningParts } from './helpers/strip-reasoning-parts'
import { stripSpecFromMessages } from './helpers/strip-spec-from-messages'
import { BaseStreamConfig } from './types'

type EphemeralStreamConfig = Pick<
  BaseStreamConfig,
  'model' | 'abortSignal' | 'searchMode'
> & {
  messages: UIMessage[]
  chatId?: string
}

export async function createEphemeralChatStreamResponse(
  config: EphemeralStreamConfig
): Promise<Response> {
  const { messages, model, abortSignal, searchMode, chatId } = config

  if (!messages || messages.length === 0) {
    return new Response('messages are required', {
      status: 400,
      statusText: 'Bad Request'
    })
  }

  // Create parent trace ID for grouping all operations
  let parentTraceId: string | undefined
  let langfuse: Langfuse | undefined

  if (isTracingEnabled()) {
    parentTraceId = randomUUID()
    langfuse = new Langfuse()

    langfuse.trace({
      id: parentTraceId,
      name: 'research',
      metadata: {
        chatId,
        userId: 'guest',
        modelId: `${model.providerId}:${model.id}`,
        trigger: 'submit-message'
      }
    })
  }

  try {
    const isOpenAI = `${model.providerId}:${model.id}`.startsWith('openai:')
    const messagesWithoutSpec = stripSpecFromMessages(messages)
    const messagesToConvert = isOpenAI
      ? stripReasoningParts(messagesWithoutSpec)
      : messagesWithoutSpec

    let modelMessages = await convertToModelMessages(messagesToConvert)

    modelMessages = pruneMessages({
      messages: modelMessages,
      reasoning: 'before-last-message',
      toolCalls: 'before-last-2-messages',
      emptyMessages: 'remove'
    })

    if (shouldTruncateMessages(modelMessages, model)) {
      const maxTokens = getMaxAllowedTokens(model)
      modelMessages = truncateMessages(modelMessages, maxTokens, model.id)
    }

    const researchAgent = researcher({
      model: `${model.providerId}:${model.id}`,
      modelConfig: model,
      parentTraceId,
      searchMode
    })

    const result = await researchAgent.stream({
      messages: modelMessages,
      abortSignal,
      experimental_transform: smoothStream({ chunking: 'word' })
    })
    result.consumeStream()

    return result.toUIMessageStreamResponse({
      messageMetadata: ({ part }) => {
        if (part.type === 'start') {
          return {
            traceId: parentTraceId,
            searchMode,
            modelId: `${model.providerId}:${model.id}`
          }
        }
      },
      onFinish: async () => {
        if (langfuse) {
          await langfuse.flushAsync()
        }
      },
      onError: (error: unknown) => {
        return error instanceof Error ? error.message : String(error)
      },
      consumeSseStream: consumeStream
    })
  } catch (error) {
    if (langfuse) {
      await langfuse.flushAsync()
    }

    const errorMessage =
      error instanceof Error
        ? error.message.toLowerCase()
        : String(error).toLowerCase()

    // Hide Gemini quota/rate-limit errors
    if (
      errorMessage.includes('quota') ||
      errorMessage.includes('429') ||
      errorMessage.includes('resource_exhausted') ||
      errorMessage.includes('free_tier') ||
      errorMessage.includes('rate limit') ||
      errorMessage.includes('too many requests') ||
      errorMessage.includes('exceeded your current quota') ||
      errorMessage.includes('generate_content_free_tier_requests')
    ) {
      return new Response(
        JSON.stringify({
          error: 'RATE_LIMIT',
          message:
            'You have reached your limit,Upgrade your plan to continue.'
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      )
    }

    console.error('Ephemeral stream error:', error)

    return new Response(
      JSON.stringify({
        error: 'SERVER_ERROR',
        message: 'Something went wrong. Please try again.'
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    )
  }
}
