'use client'
import Image from 'next/image'
import { useEffect, useState } from 'react'
import { Heart, Truck } from 'lucide-react'
import { toast } from 'sonner'
import { pickLocal, useI18n } from '@/lib/i18n'
import { useCart } from '@/lib/stores/cart'
import { apiClient } from '@/lib/request'
import { formatPrice } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

export type Review = {
  id: string
  authorName: string
  rating: number
  comment: string | null
  createdAt: string | Date
}

type Props = {
  product: {
    id: string
    name: string
    nameEn: string
    description: string | null
    descriptionEn: string | null
    price: number
    compareAtPrice: number | null
    currency: string
    stock: number
    image: string | null
    images: string[] | null
    slug: string
    isFlashSale?: boolean
  }
  averageRating: number
  reviews: Review[]
  isLoggedIn: boolean
  userName: string | null
}

export function ProductDetail({ product, averageRating, reviews, isLoggedIn }: Props) {
  const { locale, t } = useI18n()
  const add = useCart((s) => s.add)
  const [imageIndex, setImageIndex] = useState(0)
  const [qty, setQty] = useState(1)
  const [wishlisted, setWishlisted] = useState(false)
  const [pending, setPending] = useState(false)

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

  const images = [product.image, ...(product.images ?? [])].filter(Boolean) as string[]
  const name = pickLocal(locale, product.name, product.nameEn)
  const desc = pickLocal(locale, product.description, product.descriptionEn)
  const out = product.stock <= 0
  const hasPromo = !product.isFlashSale && product.compareAtPrice != null && product.compareAtPrice > product.price

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
    if (res.success) {
      setWishlisted((v) => !v)
      return
    }
    toast.error(res.error ?? 'Action impossible.')
  }

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      {/* Images */}
      <div>
        <div className="relative aspect-square overflow-hidden rounded-2xl border bg-muted">
          {images[imageIndex] ? (
            <Image src={images[imageIndex]} alt={name} fill className="object-cover" sizes="(max-width: 1024px) 100vw, 50vw" unoptimized />
          ) : (
            <div className="grid h-full w-full place-items-center text-muted-foreground">TECH&nbsp;221</div>
          )}
          {hasPromo && <Badge className="absolute left-3 top-3">{t('promo')}</Badge>}
        </div>
        {images.length > 1 && (
          <div className="mt-3 grid grid-cols-5 gap-2">
            {images.map((img, i) => (
              <button key={i} onClick={() => setImageIndex(i)} className={`aspect-square overflow-hidden rounded-lg border ${i === imageIndex ? 'ring-2 ring-primary' : ''}`}>
                <Image src={img} alt="" width={120} height={120} className="h-full w-full object-cover" unoptimized />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Info */}
      <div>
        <h1 className="break-words text-3xl font-bold">{name}</h1>
        <div className="mt-2 flex items-center gap-2 text-sm">
          <span className="font-semibold text-primary">{averageRating > 0 ? `★ ${averageRating.toFixed(1)}` : '—'}</span>
          <span className="text-muted-foreground">({reviews.length} {t('reviews').toLowerCase()})</span>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1">
          <span className="text-2xl font-bold text-primary">{formatPrice(product.price, product.currency)}</span>
          {hasPromo && <span className="text-lg text-muted-foreground line-through">{formatPrice(product.compareAtPrice!, product.currency)}</span>}
        </div>

        <div className="mt-3">
          <Badge variant={product.isFlashSale ? 'default' : out ? 'destructive' : 'secondary'}>
            {product.isFlashSale ? 'Vente flash' : out ? t('out_of_stock') : `${t('stock_label')} : ${product.stock}`}
          </Badge>
        </div>

        <div className="mt-6 flex items-center gap-3">
          <div className="flex items-center rounded-lg border">
            <button onClick={() => setQty((q) => Math.max(1, q - 1))} className="px-3 py-2 text-lg" aria-label="Decrease">−</button>
            <span className="w-10 text-center font-medium">{qty}</span>
            <button onClick={() => setQty((q) => Math.min(product.stock || 99, q + 1))} className="px-3 py-2 text-lg" aria-label="Increase">+</button>
          </div>
          <Button
            size="lg"
            disabled={out}
            className="flex-1"
            onClick={() => {
              add(
                {
                  productId: product.id,
                  name: product.name,
                  nameEn: product.nameEn,
                  unitPrice: product.price,
                  currency: product.currency,
                  image: product.image,
                  stock: product.stock,
                },
                qty
              )
              toast.success(t('add_to_cart'))
            }}
          >
            {t('add_to_cart')}
          </Button>
          <Button variant={wishlisted ? 'default' : 'outline'} size="icon" className="h-12 w-12" onClick={toggleWishlist} disabled={pending} aria-label={t('add_to_wishlist')}>
            <Heart className={`h-5 w-5 ${wishlisted ? 'fill-current' : ''}`} />
          </Button>
        </div>

        <div className="mt-6 flex items-center gap-2 text-sm text-muted-foreground">
          <Truck className="h-4 w-4" />
          {locale === 'fr' ? 'Commande validée puis livraison rapide.' : 'Orders validated then fast delivery.'}
        </div>

        {desc && (
          <div className="mt-6">
            <h2 className="font-semibold">{t('description')}</h2>
            <p className="mt-2 whitespace-pre-line leading-relaxed text-muted-foreground">{desc}</p>
          </div>
        )}
      </div>
    </div>
  )
}
