import 'server-only'
import { eq, sql } from 'drizzle-orm'
import { cookies, headers } from 'next/headers'
import { db } from '@/db'
import { sessions, users } from '@/db/schemas/core'

const SESSION_COOKIE = 'tec221_session'
const SESSION_DAYS = 30

export type AuthUser = {
  id: string
  email: string
  name: string | null
  role: 'superadmin' | 'admin' | 'user'
}

async function sha256Hex(value: string): Promise<string> {
  const buf = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(value)
  )
  return [...new Uint8Array(buf)]
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

function generateToken(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(32))
  return [...bytes].map((b) => b.toString(16).padStart(2, '0')).join('')
}

/**
 * Build cookie options for the session cookie.
 *
 * The app is served in an embedded/HTTPS preview and deployed to Cloudflare.
 * Both are served over HTTPS and, in the preview, the app runs inside an iframe
 * whose top-level context can differ from the app origin. In that case a plain
 * `SameSite=Lax` cookie is dropped by the browser (third-party/embedded
 * context), which is exactly why the app kept asking users to log in again.
 *
 * So by default we use `SameSite=None; Secure`: accepted over HTTPS, survives
 * the embedded preview, and works on Cloudflare. Developers running plain-HTTP
 * localhost can set `SESSION_INSECURE_LOCAL=1` to fall back to `SameSite=Lax`
 * without `Secure` (a non-Secure `SameSite=None` cookie would be rejected).
 */
async function sessionCookieOptions(token: string, maxAge: number) {
  const insecureLocal = process.env.SESSION_INSECURE_LOCAL === '1'
  const isHttps = !insecureLocal

  return {
    httpOnly: true,
    sameSite: (isHttps ? 'none' : 'lax') as 'none' | 'lax',
    secure: isHttps,
    path: '/',
    maxAge,
  }
}

/**
 * Creates a session and returns the raw session token.
 *
 * The token is set as an HttpOnly cookie and ALSO returned to the caller. The
 * client stores it (in localStorage) and echoes it back via an
 * `Authorization: Bearer <token>` header. This dual mechanism guarantees login
 * survives even when the app runs inside the embedded preview iframe where the
 * browser may drop/block cookies (cross-origin / third-party context).
 *
 * getCurrentUser() accepts the session from either the cookie or the header, so
 * production (cookie-based) and the sandboxed preview (header-based) both work.
 */
export async function createSession(userId: string): Promise<string> {
  const token = generateToken()
  const tokenHash = await sha256Hex(token)

  await db.insert(sessions).values({
    userId,
    tokenHash,
    expiresAt: sql`now() + interval '30 days'`,
  })

  const cookieStore = await cookies()
  cookieStore.set(SESSION_COOKIE, token, {
    ...(await sessionCookieOptions(token, SESSION_DAYS * 24 * 60 * 60)),
  })

  return token
}

/** Resolve a user from a raw session token, or null when invalid/expired. */
async function getUserByToken(token: string): Promise<AuthUser | null> {
  const tokenHash = await sha256Hex(token)
  const rows = await db
    .select({
      id: users.id,
      email: users.email,
      name: users.name,
      role: users.role,
    })
    .from(sessions)
    .innerJoin(users, eq(sessions.userId, users.id))
    .where(
      sql`${sessions.tokenHash} = ${tokenHash} AND ${sessions.expiresAt} > now()`
    )

  if (rows.length === 0) return null
  return rows[0] as AuthUser
}

/**
 * Returns the current authenticated user, or null.
 *
 * Checks the session cookie first, then any `Authorization: Bearer` header so
 * the same code authenticates requests from the preview iframe (where cookies
 * may be blocked) and from production (cookie-based).
 */
export async function getCurrentUser(): Promise<AuthUser | null> {
  const cookieStore = await cookies()
  const cookieToken = cookieStore.get(SESSION_COOKIE)?.value

  const headerList = await headers()
  const authHeader = headerList.get('authorization')
  const bearerToken = authHeader?.startsWith('Bearer ')
    ? authHeader.slice('Bearer '.length).trim()
    : ''

  const token = cookieToken || bearerToken
  if (!token) return null

  return getUserByToken(token)
}

/** Deletes a session row by its raw token. */
async function destroySessionByToken(token: string): Promise<void> {
  const tokenHash = await sha256Hex(token)
  await db.delete(sessions).where(eq(sessions.tokenHash, tokenHash)).catch(() => {})
}

export async function destroySession(): Promise<void> {
  const cookieStore = await cookies()
  const cookieToken = cookieStore.get(SESSION_COOKIE)?.value

  const headerList = await headers()
  const authHeader = headerList.get('authorization')
  const bearerToken = authHeader?.startsWith('Bearer ')
    ? authHeader.slice('Bearer '.length).trim()
    : ''

  if (cookieToken) await destroySessionByToken(cookieToken)
  if (bearerToken && bearerToken !== cookieToken) {
    await destroySessionByToken(bearerToken)
  }

  cookieStore.set(SESSION_COOKIE, '', {
    ...(await sessionCookieOptions('', 0)),
  })
}

export { SESSION_COOKIE }
