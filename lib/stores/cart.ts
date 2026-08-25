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
    }
  )
)

// The cart is intentionally independent from the session token. Session tokens
// are rotated on login, so scoping the key to a token would lose the cart.
if (typeof window !== 'undefined') {
  window.addEventListener('storage', () => {
    useCart.persist.rehydrate()
  })
}
