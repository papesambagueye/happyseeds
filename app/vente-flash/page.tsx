import Link from 'next/link'
import { StoreShell } from '@/components/store/shell'
import { ProductCard } from '@/components/store/product-card'
import { getFlashSaleProducts } from '@/lib/services/catalog'

export const dynamic = 'force-dynamic'

export default async function FlashSalesPage() {
  let sales: Awaited<ReturnType<typeof getFlashSaleProducts>> = []
  try {
    sales = await getFlashSaleProducts()
  } catch {
    sales = []
  }

  return (
    <StoreShell>
      <div className="mx-auto max-w-7xl px-4 py-10">
        <div className="mb-6 flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-red-600">Occasion unique</p>
            <h1 className="mt-2 text-3xl font-bold">Vente flash</h1>
            <p className="mt-2 text-sm text-muted-foreground">Articles d’occasion uniques, disponibles en quantité limitée.</p>
          </div>
          <Link href="/promos" className="text-sm font-medium text-primary hover:underline">Voir les promotions</Link>
        </div>
        {sales.length === 0 ? (
          <div className="rounded-2xl border bg-card p-8 text-center text-muted-foreground">Aucune vente flash pour le moment.</div>
        ) : (
          <div className="grid grid-cols-2 gap-5 lg:grid-cols-4">
            {sales.map(({ product }) => <ProductCard key={product.id} product={product} />)}
          </div>
        )}
      </div>
    </StoreShell>
  )
}