'use client'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { getSessionToken, getSessionUserId, setSessionUserId } from '@/lib/auth/token-store'

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
      storage: {
        getItem: (name: string): string | null => {
          try {
            if (typeof window === 'undefined') return null
            const userId = getSessionUserId() ?? 'anon'
            return window.localStorage.getItem(`${name}_${userId}`)
          } catch {
            return null
          }
        },
        setItem: (name: string, value: string): void => {
          try {
            if (typeof window === 'undefined') return
            const userId = getSessionUserId() ?? 'anon'
            window.localStorage.setItem(`${name}_${userId}`, value)
          } catch {
            // Ignore unavailable browser storage.
          }
        },
        removeItem: (name: string): void => {
          try {
            if (typeof window === 'undefined') return
            const userId = getSessionUserId() ?? 'anon'
            window.localStorage.removeItem(`${name}_${userId}`)
          } catch {
            // Ignore unavailable browser storage.
          }
        },
      } as any,
    }
  )
)

if (typeof window !== 'undefined') {
  window.addEventListener('tec221:session', () => {
    const userId = getSessionUserId()
    if (userId) {
      const accountKey = `tec221_cart_${userId}`
      const legacyCart = window.localStorage.getItem('tec221_cart')
      if (!window.localStorage.getItem(accountKey) && legacyCart) {
        window.localStorage.setItem(accountKey, legacyCart)
        window.localStorage.removeItem('tec221_cart')
      }
    }
    useCart.persist.rehydrate()
  })
  window.addEventListener('storage', (event) => {
    if (event.key === 'tec221_user_id') useCart.persist.rehydrate()
  })

  if (getSessionToken() && !getSessionUserId()) {
    fetch('/api/auth/me', {
      headers: { Authorization: `Bearer ${getSessionToken()}` },
      credentials: 'include',
    })
      .then((response) => response.ok ? response.json() : null)
      .then((payload: { success?: boolean; data?: { id?: string } } | null) => {
        const userId = payload?.success ? payload.data?.id : undefined
        if (!userId) return
        setSessionUserId(userId)
        window.dispatchEvent(new CustomEvent('tec221:session'))
      })
      .catch(() => {})
  }
}
