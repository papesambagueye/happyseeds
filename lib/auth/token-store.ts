// Client-safe helpers for the bearer session token.
//
// The login/register APIs also return the raw session token. We keep it in
// localStorage so the app can authenticate even when the browser drops the
// HttpOnly cookie in the embedded preview iframe (cross-origin context).
// `request()` attaches it as `Authorization: Bearer <token>`; the server accepts
// either the cookie or this header.

const TOKEN_KEY = 'tec221_token'
const USER_ID_KEY = 'tec221_user_id'

export function getSessionToken(): string | null {
  if (typeof window === 'undefined') return null
  try {
    return window.localStorage.getItem(TOKEN_KEY)
  } catch {
    return null
  }
}

export function setSessionToken(token: string | null): void {
  if (typeof window === 'undefined') return
  try {
    if (token) window.localStorage.setItem(TOKEN_KEY, token)
    else {
      window.localStorage.removeItem(TOKEN_KEY)
      window.localStorage.removeItem(USER_ID_KEY)
    }

    try {
      // Notify the current window that the session token changed so in-memory
      // stores (cart, etc.) can react immediately. Other tabs receive the
      // standard storage event, but the current tab does not — so dispatch a
      // custom event as well.
      window.dispatchEvent(new CustomEvent('tec221:session', { detail: { token } }))
    } catch {
      /* best-effort */
    }
  } catch {
    // Storage may be unavailable in restricted contexts; the cookie still works.
  }
}

export function getSessionUserId(): string | null {
  if (typeof window === 'undefined') return null
  try {
    return window.localStorage.getItem(USER_ID_KEY)
  } catch {
    return null
  }
}

export function setSessionUserId(userId: string | null): void {
  if (typeof window === 'undefined') return
  try {
    if (userId) window.localStorage.setItem(USER_ID_KEY, userId)
    else window.localStorage.removeItem(USER_ID_KEY)
  } catch {
    // Storage may be unavailable; the cookie still authenticates the session.
  }
}
