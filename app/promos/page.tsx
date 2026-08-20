import Link from 'next/link'
import Image from 'next/image'
import { StoreShell } from '@/components/store/shell'
import { Button } from '@/components/ui/button'
import { getFlashSaleProducts } from '@/lib/services/catalog'
import { formatPrice } from '@/lib/utils'

export default async function PromosPage() {
  let sales: Awaited<ReturnType<typeof getFlashSaleProducts>> = []

  try {
    sales = await getFlashSaleProducts()
  } catch {
    sales = []
  }

  return (
    <StoreShell>
      <div className="mx-auto max-w-7xl px-4 py-10">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-primary">Promos</p>
            <h1 className="mt-2 text-3xl font-bold">Ventes flash</h1>
          </div>
          <Link href="/catalogue" className="text-sm font-medium text-primary hover:underline">
            Voir le catalogue
          </Link>
        </div>

        {sales.length === 0 ? (
          <div className="rounded-2xl border bg-card p-8 text-center text-muted-foreground">
            Aucune vente flash pour le moment.
          </div>
        ) : (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {sales.map(({ product }: { product: { id: string; name: string; price: number; compareAtPrice: number | null; currency: string; image?: string | null; slug: string } }) => (
              <div key={product.id} className="overflow-hidden rounded-2xl border bg-card">
                <div className="relative h-56 w-full">
                  {product.image && (
                    <Image src={product.image} alt={product.name} fill className="object-cover" unoptimized />
                  )}
                </div>
                <div className="p-4">
                  <div className="inline-flex rounded-full bg-red-500/10 px-2 py-1 text-xs font-semibold text-red-600">
                    Flash sale
                  </div>
                  <h2 className="mt-3 text-xl font-semibold">{product.name}</h2>
                  <div className="mt-2 flex items-center gap-2">
                    <span className="text-xl font-bold text-primary">{formatPrice(product.price, product.currency)}</span>
                    <span className="text-sm text-muted-foreground line-through">{formatPrice(product.compareAtPrice ?? product.price, product.currency)}</span>
                  </div>
                  <Button asChild className="mt-4 w-full">
                    <Link href={`/produit/${product.slug}`}>Voir l’offre</Link>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </StoreShell>
  )
}
