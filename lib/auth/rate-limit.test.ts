import test from 'node:test'
import assert from 'node:assert/strict'

import { consumeRateLimit } from './rate-limit'

test('login rate limit blocks repeated attempts after the configured threshold', () => {
  const key = 'login:test@example.com'

  assert.equal(consumeRateLimit(key, { limit: 3, windowMs: 60_000 }).allowed, true)
  assert.equal(consumeRateLimit(key, { limit: 3, windowMs: 60_000 }).allowed, true)
  assert.equal(consumeRateLimit(key, { limit: 3, windowMs: 60_000 }).allowed, true)
  assert.equal(consumeRateLimit(key, { limit: 3, windowMs: 60_000 }).allowed, false)
})
