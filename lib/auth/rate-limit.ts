const RATE_LIMIT_STORE = new Map<string, number[]>()

export function getClientIp(request: Request): string {
  const forwardedFor = request.headers.get('x-forwarded-for') ?? ''
  const realIp = request.headers.get('x-real-ip') ?? ''
  return (forwardedFor.split(',')[0] || realIp || 'unknown').trim()
}

type RateLimitOptions = {
  limit: number
  windowMs: number
}

export function consumeRateLimit(key: string, options: RateLimitOptions) {
  const { limit, windowMs } = options
  const now = Date.now()
  const bucket = RATE_LIMIT_STORE.get(key) ?? []
  const valid = bucket.filter((timestamp) => now - timestamp < windowMs)

  valid.push(now)
  RATE_LIMIT_STORE.set(key, valid)

  const allowed = valid.length <= limit
  return {
    allowed,
    remaining: Math.max(0, limit - valid.length),
    resetAt: valid[0] ? valid[0] + windowMs : now + windowMs,
  }
}

export function clearRateLimit(key: string) {
  RATE_LIMIT_STORE.delete(key)
}
