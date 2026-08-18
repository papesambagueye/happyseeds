'use client'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type CartItem = {
  productId: string
  name: string
  nameEn: string
  unitPrice: number
  currency: string
  image?: string | null
  stock: number
  quantity: number
}

type CartState = {
  items: CartItem[]
  add: (item: Omit<CartItem, 'quantity'>, quantity?: number) => void
  remove: (productId: string) => void
  setQuantity: (productId: string, quantity: number) => void
  clear: () => void
  total: () => number
  count: () => number
}

import { getSessionToken } from '@/lib/auth/token-store'

export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      add: (item, quantity = 1) => {
        const existing = get().items.find((i) => i.productId === item.productId)
        if (existing) {
          set({
            items: get().items.map((i) =>
              i.productId === item.productId
                ? { ...i, quantity: Math.min(i.quantity + quantity, i.stock || 99) }
                : i
            ),
          })
        } else {
          set({
            items: [
              ...get().items,
              { ...item, quantity: Math.min(quantity, item.stock || 99) },
            ],
          })
        }
      },
      remove: (productId) =>
        set({ items: get().items.filter((i) => i.productId !== productId) }),
      setQuantity: (productId, quantity) =>
        set({
          items: get().items.map((i) =>
            i.productId === productId
              ? { ...i, quantity: Math.max(1, Math.min(quantity, i.stock || 99)) }
              : i
          ),
        }),
      clear: () => set({ items: [] }),
      total: () =>
        get().items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0),
      count: () => get().items.reduce((sum, i) => sum + i.quantity, 0),
    }),
    {
      name: 'tec221_cart',
      // Use a storage wrapper that scopes the persisted key to the current
      // session token so each user has their own cart in localStorage.
      // Cast to any to satisfy Persist types — runtime behavior is a localStorage
      // wrapper that prefixes keys with the current session token.
      storage: (function () {
        return {
          getItem: (name: string) => {
            try {
              if (typeof window === 'undefined' || !window.localStorage) return null
              const token = getSessionToken() ?? 'anon'
              return window.localStorage.getItem(`${name}_${token}`)
            } catch {
              return null
            }
          },
          setItem: (name: string, value: string) => {
            try {
              if (typeof window === 'undefined' || !window.localStorage) return
              const token = getSessionToken() ?? 'anon'
              window.localStorage.setItem(`${name}_${token}`, value)
            } catch {
              // ignore
            }
          },
          removeItem: (name: string) => {
            try {
              if (typeof window === 'undefined' || !window.localStorage) return
              const token = getSessionToken() ?? 'anon'
              window.localStorage.removeItem(`${name}_${token}`)
            } catch {
              // ignore
            }
          },
        }
      })() as any,
    }
  )
)

// Listen for session token changes and reload the persisted cart for the
// new token, or clear the cart when signed out. This ensures that switching
// accounts in the same browser updates the in-memory cart immediately.
if (typeof window !== 'undefined') {
  window.addEventListener('tec221:session', () => {
    try {
      const token = getSessionToken() ?? 'anon'
      const key = `tec221_cart_${token}`
      const raw = window.localStorage.getItem(key)
      const parsed = raw ? JSON.parse(raw) : null
      const store = useCart.getState()
      if (parsed && Array.isArray(parsed.state?.items)) {
        // Replace items with persisted value for the new token
        useCart.setState({ items: parsed.state.items })
      } else {
        // No persisted cart for this token — clear.
        store.clear()
      }
    } catch {
      // best-effort
      useCart.getState().clear()
    }
  })

  // Also react to cross-tab storage changes (other tab changed session token).
  window.addEventListener('storage', (e) => {
    if (!e.key) return
    // If session key changed in another tab, trigger the same session event.
    if (e.key === 'tec221_token') {
      window.dispatchEvent(new CustomEvent('tec221:session', { detail: { token: e.newValue } }))
    }
  })
}
