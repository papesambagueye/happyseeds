import Link from 'next/link'
import { StoreShell } from '@/components/store/shell'
import { ProductCard } from '@/components/store/product-card'
import { getPromotionalProducts } from '@/lib/services/catalog'

export const dynamic = 'force-dynamic'

export default async function PromosPage() {
  let promotions: Awaited<ReturnType<typeof getPromotionalProducts>> = []

  try {
    promotions = await getPromotionalProducts()
  } catch {
    promotions = []
  }

  return (
    <StoreShell>
      <div className="mx-auto max-w-7xl px-4 py-10">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-primary">Promos</p>
            <h1 className="mt-2 text-3xl font-bold">Promotions</h1>
          </div>
          <Link href="/catalogue" className="text-sm font-medium text-primary hover:underline">
            Voir le catalogue
          </Link>
        </div>

        {promotions.length === 0 ? (
          <div className="rounded-2xl border bg-card p-8 text-center text-muted-foreground">
            Aucun produit en promotion pour le moment.
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-5 lg:grid-cols-4">
            {promotions.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </StoreShell>
  )
}
