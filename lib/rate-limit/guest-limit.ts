import { Redis } from '@upstash/redis'

const redis = Redis.fromEnv()

const DAILY_LIMIT = 6

function getTodayKey() {
  return new Date().toISOString().split('T')[0]
}

function getSecondsUntilTomorrow() {
  const now = new Date()

  const tomorrow = new Date()
  tomorrow.setUTCHours(24, 0, 0, 0)

  return Math.floor((tomorrow.getTime() - now.getTime()) / 1000)
}

export async function checkAndEnforceGuestLimit(
  identifier: string
): Promise<Response | null> {
  try {
    const key = `guest-limit:${identifier}:${getTodayKey()}`

    const current = (await redis.get<number>(key)) || 0

    if (current >= DAILY_LIMIT) {
      return new Response(
        JSON.stringify({
          error: 'RATE_LIMIT_EXCEEDED',
          message:
            'Free plan limit reached. Upgrade to Pro for unlimited chats and image generation.',
          showPricing: true
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      )
    }

    const newValue = await redis.incr(key)

    if (newValue === 1) {
      await redis.expire(key, getSecondsUntilTomorrow())
    }

    return null
  } catch (err) {
    console.error('Rate limit error:', err)

    return null
  }
}
