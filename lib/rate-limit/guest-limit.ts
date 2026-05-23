import { Redis } from '@upstash/redis'

// Limits
const GUEST_DAILY_CHAT_LIMIT = 6
const GUEST_DAILY_IMAGE_LIMIT = 1

function getGuestDailyLimit(): number {
  const raw = process.env.GUEST_CHAT_DAILY_LIMIT
  const parsed = raw ? Number(raw) : GUEST_DAILY_CHAT_LIMIT
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return GUEST_DAILY_CHAT_LIMIT
  }
  return Math.floor(parsed)
}

function getSecondsUntilMidnight(): number {
  const now = new Date()
  const midnight = new Date(now)
  midnight.setUTCHours(24, 0, 0, 0)
  return Math.floor((midnight.getTime() - now.getTime()) / 1000)
}

function getNextMidnightTimestamp(): number {
  const now = new Date()
  const midnight = new Date(now)
  midnight.setUTCHours(24, 0, 0, 0)
  return midnight.getTime()
}

async function checkGuestLimit(): Promise<{
  allowed: boolean
  remaining: number
  resetAt: number
  limit: number
}> {
  if (process.env.MORPHIC_CLOUD_DEPLOYMENT !== 'true') {
    return { allowed: true, remaining: Infinity, resetAt: 0, limit: 0 }
  }

  if (
    !process.env.UPSTASH_REDIS_REST_URL ||
    !process.env.UPSTASH_REDIS_REST_TOKEN
  ) {
    return { allowed: true, remaining: Infinity, resetAt: 0, limit: 0 }
  }

  try {
    const redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN
    })

    const dateKey = new Date().toISOString().split('T')[0]
    const guestId =
      crypto.randomUUID?.() || Math.random().toString(36).slice(2)
    const key = `rl:guest:chat:${guestId}:${dateKey}`
    
    // Increment request count
    const count = await Promise.race([
      redis.incr(key),
      new Promise<number>((_, reject) =>
        setTimeout(() => reject(new Error('Redis timeout')), 3000)
      )
    ])

    if (count === 1) {
      const secondsUntilMidnight = getSecondsUntilMidnight()
      await redis.expire(key, secondsUntilMidnight)
    }

    const limit = getGuestDailyLimit()
    const remaining = Math.max(0, limit - count)
    const resetAt = getNextMidnightTimestamp()

    return {
      allowed: count <= limit,
      remaining,
      resetAt,
      limit
    }
  } catch (error) {
    console.error('Guest rate limit check failed:', error)
    return { allowed: true, remaining: Infinity, resetAt: 0, limit: 0 }
  }
}

export async function checkAndEnforceGuestLimit(): Promise<Response | null> {
  const result = await checkGuestLimit()
  if (!result.allowed) {
    return new Response(
      JSON.stringify({
        error: 'FREE_LIMIT_REACHED',
        message:
          'Free limit reached. Upgrade to Pro for unlimited chats and image generation.'
      }),
      {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'X-RateLimit-Limit': String(result.limit),
          'X-RateLimit-Remaining': String(result.remaining),
          'X-RateLimit-Reset': String(result.resetAt)
        }
      }
    )
  }

  return null
}
