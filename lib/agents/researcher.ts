import { stepCountIs, tool, ToolLoopAgent } from 'ai'
import type { ResearcherTools } from '@/lib/types/agent'
import { type Model } from '@/lib/types/models'
import { fetchTool } from '../tools/fetch'
import { createQuestionTool } from '../tools/question'
import { createSearchTool } from '../tools/search'
import { createTodoTools } from '../tools/todo'
import { SearchMode } from '../types/search'
import { getModel } from '../utils/registry'
import { isTracingEnabled } from '../utils/telemetry'
import {
  getAdaptiveModePrompt,
  QUICK_MODE_PROMPT
} from './prompts/search-mode-prompts'

// Quick mode wrapper
function wrapSearchToolForQuickMode<T extends ReturnType<typeof createSearchTool>>(originalTool: T): T {
  return tool({
    description: originalTool.description,
    inputSchema: originalTool.inputSchema,
    async *execute(params, context) {
      const executeFunc = originalTool.execute
      if (!executeFunc) throw new Error('Search tool execute function is not defined')

      const modifiedParams = { ...params, type: 'optimized' as const }
      const result = executeFunc(modifiedParams, context)

      if (result && typeof result === 'object' && Symbol.asyncIterator in result) {
        for await (const chunk of result) {
          yield chunk
        }
      } else {
        const finalResult = await result
        yield finalResult || { state: 'complete' as const, results: [], images: [], query: params.query, number_of_results: 0 }
      }
    }
  }) as T
}

export function createResearcher({
  model,
  modelConfig,
  parentTraceId,
  searchMode = 'adaptive'
}: {
  model: string
  modelConfig?: Model
  parentTraceId?: string
  searchMode?: SearchMode
}) {
  try {
    const currentDate = new Date().toLocaleString()

    const originalSearchTool = createSearchTool(model)
    const askQuestionTool = createQuestionTool(model)
    const todoTools = createTodoTools()

    let systemPrompt: string
    let activeToolsList: (keyof ResearcherTools)[] = []
    let maxSteps: number
    let searchTool = originalSearchTool

    switch (searchMode) {
      case 'quick':
        systemPrompt = QUICK_MODE_PROMPT
        activeToolsList = ['search', 'fetch']
        maxSteps = 20
        searchTool = wrapSearchToolForQuickMode(originalSearchTool)
        break

      case 'adaptive':
      default:
        systemPrompt = getAdaptiveModePrompt()
        activeToolsList = ['search', 'fetch', 'todoWrite']
        maxSteps = 50
        break
    }

    const tools: ResearcherTools = {
      search: searchTool,
      fetch: fetchTool,
      askQuestion: askQuestionTool,
      ...todoTools
    } as ResearcherTools

    const agent = new ToolLoopAgent({
      model: getModel(model),
      instructions: `${systemPrompt}\nCurrent date and time: ${currentDate}`,
      tools,
      activeTools: activeToolsList,
      stopWhen: stepCountIs(maxSteps),
      maxRetries: 0,
      experimental_telemetry: {
        isEnabled: isTracingEnabled(),
        functionId: 'research-agent',
        metadata: {
          modelId: model,
          agentType: 'researcher',
          searchMode,
          ...(parentTraceId && { langfuseTraceId: parentTraceId, langfuseUpdateParent: false })
        }
      }
    })

    return agent
  } catch (error) {
    console.error('Error in createResearcher:', error)
    throw error
  }
}

export function getResearcherTools(agent: ToolLoopAgent<never, ResearcherTools, never>): ResearcherTools {
  return agent.tools
}

export const researcher = createResearcher
