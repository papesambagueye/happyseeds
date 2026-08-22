'use client'
import Link from 'next/link'
import Image from 'next/image'
import { useEffect, useState } from 'react'
import { Heart, ShoppingCart } from 'lucide-react'
import { toast } from 'sonner'
import { pickLocal, useI18n } from '@/lib/i18n'
import { useCart } from '@/lib/stores/cart'
import { apiClient } from '@/lib/request'
import type { StoreProduct } from '@/lib/services/catalog'
import { formatPrice } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export function ProductCard({ product }: { product: StoreProduct }) {
  const { locale, t } = useI18n()
  const add = useCart((s) => s.add)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [wishlisted, setWishlisted] = useState(false)
  const [pending, setPending] = useState(false)

  useEffect(() => {
    let active = true
    apiClient.get<{ id: string } | null>('/api/auth/me').then((res) => {
      if (!active) return
      setIsLoggedIn(Boolean(res.success && res.data))
    })
    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    if (!isLoggedIn) {
      setWishlisted(false)
      return
    }

    let active = true
    apiClient.get<{ wishlisted: boolean }>(`/api/wishlist?productId=${product.id}`).then((res) => {
      if (!active || !res.success) return
      setWishlisted(Boolean(res.data?.wishlisted))
    })
    return () => {
      active = false
    }
  }, [isLoggedIn, product.id])

  const localName = pickLocal(locale, product.name, product.nameEn)
  const price = formatPrice(product.price, product.currency)
  const out = product.stock <= 0
  const hasPromo = product.compareAtPrice != null && product.compareAtPrice > product.price

  const toggleWishlist = async () => {
    if (!isLoggedIn) {
      toast.error(locale === 'fr' ? 'Connectez-vous pour ajouter ce produit aux favoris.' : 'Please sign in to save this product.')
      return
    }

    setPending(true)
    const res = wishlisted
      ? await apiClient.delete('/api/wishlist', { body: JSON.stringify({ productId: product.id }) })
      : await apiClient.post('/api/wishlist', { productId: product.id })
    setPending(false)

    if (!res.success) {
      toast.error(res.error ?? 'Action impossible.')
      return
    }

    setWishlisted((value) => !value)
  }

  return (
    <div className="group relative flex flex-col overflow-hidden rounded-xl border border-[#D9D9D9] bg-white shadow-[0_8px_24px_rgba(0,0,0,0.05)] transition-all duration-200 hover:-translate-y-1 hover:border-[#007BFF]/40 hover:shadow-[0_16px_34px_rgba(0,123,255,0.14)]">
      <Link href={`/produit/${product.slug}`} className="block">
        <div className="relative aspect-square overflow-hidden bg-[#F2F2F2]">
          {product.image ? (
            <Image
              src={product.image}
              alt={localName}
              fill
              sizes="(max-width: 768px) 50vw, 25vw"
              className="object-cover transition-transform duration-500 group-hover:scale-105"
              unoptimized
            />
          ) : (
            <div className="grid h-full w-full place-items-center text-muted-foreground">TECH&nbsp;221</div>
          )}
          {hasPromo && (
            <span className="absolute left-2 top-2 rounded-md bg-[#E30613] px-2 py-1 text-xs font-bold text-white shadow-sm">
              {t('promo')}
            </span>
          )}
          {product.isFlashSale && (
            <span className="absolute bottom-2 left-2 rounded-md bg-[#E30613] px-2 py-1 text-xs font-bold text-white shadow-sm">
              Vente flash
            </span>
          )}
          {!out && (
            <span className="absolute right-2 top-2 rounded-md bg-white/95 px-2 py-1 text-xs font-semibold text-black shadow-sm">
              {t('in_stock')}
            </span>
          )}
        </div>
      </Link>

      <div className="flex min-w-0 flex-1 flex-col p-3 sm:p-4">
        <Link href={`/produit/${product.slug}`}>
          <h3 className="line-clamp-2 break-words leading-snug font-semibold text-black">{localName}</h3>
        </Link>
        <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1">
          <span className="font-bold text-[#007BFF]">{price}</span>
          {hasPromo && (
            <span className="text-sm text-muted-foreground line-through">
              {formatPrice(product.compareAtPrice!, product.currency)}
            </span>
          )}
        </div>
        <div className="mt-auto flex min-w-0 items-center gap-2 pt-2">
          <Button
            size="sm"
            disabled={out}
            className="min-w-0 flex-1 whitespace-normal px-2 text-xs leading-tight sm:text-sm"
            onClick={() => {
              if (out) return
              add({
                productId: product.id,
                name: product.name,
                nameEn: product.nameEn,
                unitPrice: product.price,
                currency: product.currency,
                image: product.image,
                stock: product.stock,
              })
              toast.success(locale === 'fr' ? 'Ajouté au panier' : 'Added to cart')
            }}
          >
            <ShoppingCart className="mr-1 h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4" />
            <span className="text-center">{t('add_to_cart')}</span>
          </Button>
          <button
            type="button"
            onClick={toggleWishlist}
            className={cn(
              'grid h-8 w-8 place-items-center rounded-md border transition-colors hover:bg-muted',
              wishlisted && 'bg-primary/10 text-primary border-primary/30'
            )}
            aria-label={t('add_to_wishlist')}
            disabled={pending}
          >
            <Heart className={cn('h-4 w-4', wishlisted && 'fill-current')} />
          </button>
        </div>
      </div>
    </div>
  )
}
