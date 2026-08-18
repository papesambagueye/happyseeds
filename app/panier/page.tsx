'use client'

import Link from 'next/link'
import Image from 'next/image'
import { StoreShell } from '@/components/store/shell'
import { Button } from '@/components/ui/button'
import { useCart } from '@/lib/stores/cart'
import { formatPrice } from '@/lib/utils'

export default function CartPage() {
  const items = useCart((state) => state.items)
  const remove = useCart((state) => state.remove)
  const setQuantity = useCart((state) => state.setQuantity)
  const subtotal = useCart((state) => state.total())

  const placeWhatsAppOrder = async () => {
    // Preferred business WhatsApp number (international, no plus). Fallback to site default.
    const defaultNumber = '221787301886'

    // Build a readable order summary
    const lines: string[] = []
    lines.push('Bonjour, je souhaite passer commande :')
    lines.push('')
    for (const it of items) {
      const line = `${it.quantity} × ${it.name} — ${formatPrice(it.unitPrice, it.currency)}`
      lines.push(line)
    }
    lines.push('')
    lines.push(`Sous-total : ${formatPrice(subtotal, 'FCFA')}`)
    lines.push('Merci !')

    const text = encodeURIComponent(lines.join('\n'))

    // Open WhatsApp Web / mobile link
    const url = `https://wa.me/${defaultNumber}?text=${text}`
    window.open(url, '_blank')
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
              <Button className="mt-6 w-full" onClick={placeWhatsAppOrder}>Commander sur WhatsApp</Button>
            </aside>
          </div>
        )}
      </div>
    </StoreShell>
  )
}
