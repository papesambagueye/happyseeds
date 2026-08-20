'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useState } from 'react'
import { StoreShell } from '@/components/store/shell'
import { Button } from '@/components/ui/button'
import { useCart } from '@/lib/stores/cart'
import { apiClient } from '@/lib/request'
import { formatPrice } from '@/lib/utils'

export default function CartPage() {
  const items = useCart((state) => state.items)
  const remove = useCart((state) => state.remove)
  const setQuantity = useCart((state) => state.setQuantity)
  const clear = useCart((state) => state.clear)
  const subtotal = useCart((state) => state.total())
  const [customerName, setCustomerName] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const placeWhatsAppOrder = async () => {
    if (!customerName.trim() || !customerPhone.trim()) {
      setError('Veuillez renseigner votre nom et votre téléphone.')
      return
    }

    const whatsappWindow = window.open('about:blank', '_blank')
    setSubmitting(true)
    setError('')
    const res = await apiClient.post<{ order: { id: string }; whatsappUrl: string }>('/api/orders', {
      customerName,
      customerPhone,
      items,
    })
    setSubmitting(false)

    if (!res.success) {
      whatsappWindow?.close()
      setError(res.error)
      return
    }

    clear()
    if (whatsappWindow) {
      whatsappWindow.location.href = res.data.whatsappUrl
    } else {
      window.location.href = res.data.whatsappUrl
    }
  }

  return (
    <StoreShell>
      <div className="mx-auto max-w-6xl px-4 py-10">
        <h1 className="text-3xl font-bold">Mon panier</h1>

        {items.length === 0 ? (
          <div className="mt-8 rounded-2xl border bg-card p-8 text-center text-muted-foreground">
            Votre panier est vide.
            <div className="mt-4">
              <Button asChild>
                <Link href="/catalogue">Continuer mes achats</Link>
              </Button>
            </div>
          </div>
        ) : (
          <div className="mt-8 grid gap-6 lg:grid-cols-[1.5fr_0.8fr]">
            <div className="space-y-4">
              {items.map((item) => (
                <div key={item.productId} className="flex gap-4 rounded-2xl border bg-card p-3">
                  <div className="relative h-24 w-24 overflow-hidden rounded-xl border bg-muted">
                    {item.image && (
                      <Image src={item.image} alt={item.name} fill className="object-cover" unoptimized />
                    )}
                  </div>
                  <div className="flex flex-1 items-center justify-between gap-3">
                    <div>
                      <div className="font-semibold">{item.name}</div>
                      <div className="text-sm text-muted-foreground">{formatPrice(item.unitPrice, item.currency)}</div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center rounded-lg border">
                        <button onClick={() => setQuantity(item.productId, Math.max(1, item.quantity - 1))} className="px-2 py-1">−</button>
                        <span className="min-w-8 text-center">{item.quantity}</span>
                        <button onClick={() => setQuantity(item.productId, item.quantity + 1)} className="px-2 py-1">+</button>
                      </div>
                      <Button variant="outline" onClick={() => remove(item.productId)}>Supprimer</Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <aside className="rounded-2xl border bg-card p-5">
              <h2 className="text-xl font-semibold">Résumé</h2>
              <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
                <span>Sous-total</span>
                <span>{formatPrice(subtotal, 'FCFA')}</span>
              </div>
              <div className="mt-2 flex items-center justify-between text-sm text-muted-foreground">
                <span>Livraison</span>
                <span>Offerte</span>
              </div>
              <div className="mt-4 border-t pt-4 flex items-center justify-between text-lg font-bold">
                <span>Total</span>
                <span>{formatPrice(subtotal, 'FCFA')}</span>
              </div>
              <div className="mt-6 space-y-3">
                <input
                  value={customerName}
                  onChange={(event) => setCustomerName(event.target.value)}
                  placeholder="Votre nom"
                  className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                />
                <input
                  value={customerPhone}
                  onChange={(event) => setCustomerPhone(event.target.value)}
                  placeholder="Votre téléphone (WhatsApp)"
                  type="tel"
                  className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                />
                {error && <p className="text-sm text-destructive">{error}</p>}
                <Button className="w-full" onClick={placeWhatsAppOrder} disabled={submitting}>
                  {submitting ? 'Enregistrement…' : 'Commander sur WhatsApp'}
                </Button>
              </div>
            </aside>
          </div>
        )}
      </div>
    </StoreShell>
  )
}
