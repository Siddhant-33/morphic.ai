import { SearchResults } from '@/lib/types'
import { sanitizeUrl } from '@/lib/utils'

import { BaseSearchProvider } from './base'

const CLOUD_EXCLUDED_DOMAINS = ['instagram.com']

export class TavilySearchProvider extends BaseSearchProvider {
  async search(
    query: string,
    maxResults: number = 10,
    searchDepth: 'basic' | 'advanced' = 'basic',
    includeDomains: string[] = [],
    excludeDomains: string[] = []
  ): Promise<SearchResults> {
    const apiKey = process.env.TAVILY_API_KEY

    this.validateApiKey(apiKey, 'TAVILY')

    const filledQuery =
      query.length < 5
        ? query + ' '.repeat(5 - query.length)
        : query

    const isCloudDeployment =
      process.env.MORPHIC_CLOUD_DEPLOYMENT === 'true'

    const effectiveExcludeDomains = isCloudDeployment
      ? [...new Set([...excludeDomains, ...CLOUD_EXCLUDED_DOMAINS])]
      : excludeDomains

    const response = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        api_key: apiKey,
        query: filledQuery,
        search_depth: searchDepth,
        max_results: Math.max(maxResults, 5),

        // ✅ FIXED
        include_domains: includeDomains || [],
        exclude_domains: effectiveExcludeDomains || [],

        // ✅ SAFE
        include_answer: true,
        include_images: true,

        // ✅ PREVENT ERRORS
        include_raw_content: false
      })
    })

    if (!response.ok) {
      const errorText = await response.text()

      console.error(
        `Tavily API error: ${response.status}`,
        errorText
      )

      throw new Error('Tavily search failed')
    }

    const data = await response.json()

    const resultTitleToUrl = new Map<string, string>()

    for (const r of (data.results ?? []) as Array<{
      title?: string
      url?: string
    }>) {
      if (r.title && r.url) {
        resultTitleToUrl.set(r.title, r.url)
      }
    }

    const processedImages = Array.isArray(data.images)
      ? data.images
          .map(
            (image: {
              url: string
              title?: string
              description?: string
            }) => {
              const sourceUrl = image.title
                ? resultTitleToUrl.get(image.title)
                : undefined

              return {
                url: sanitizeUrl(image.url),
                description: image.description ?? '',
                ...(image.title
                  ? { title: image.title }
                  : {}),
                ...(sourceUrl
                  ? { sourceUrl }
                  : {})
              }
            }
          )
          .filter(Boolean)
      : []

    return {
      ...data,
      images: processedImages
    }
  }
}
