import Link from 'next/link'
import { StoreShell } from '@/components/store/shell'
import { ProductCard } from '@/components/store/product-card'
import { getPublishedCategories, searchProducts } from '@/lib/services/catalog'

export default async function CataloguePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string; sort?: string }>
}) {
  const params = await searchParams
  const q = typeof params.q === 'string' ? params.q.trim() : ''
  const category = typeof params.category === 'string' ? params.category : ''
  const sort = typeof params.sort === 'string' ? params.sort : 'newest'

  const [products, categories] = await Promise.all([
    searchProducts({
      q: q || undefined,
      categoryId: category || undefined,
      sort: sort === 'price_asc' || sort === 'price_desc' ? sort : 'newest',
    }),
    getPublishedCategories(),
  ])

  return (
    <StoreShell>
      <div className="mx-auto max-w-7xl px-4 py-10">
        <div className="mb-6 flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-primary">Catalogue</p>
            <h1 className="mt-2 text-3xl font-bold">Toute la boutique</h1>
          </div>
          <Link href="/" className="text-sm font-medium text-primary hover:underline">
            Retour à l’accueil
          </Link>
        </div>

        <form method="get" className="mb-6 grid gap-3 rounded-2xl border bg-card p-4 md:grid-cols-[1.3fr_0.9fr_0.8fr_auto]">
          <input
            name="q"
            defaultValue={q}
            placeholder="Rechercher un produit"
            className="h-10 rounded-md border bg-background px-3 text-sm outline-none ring-offset-background focus:ring-2 focus:ring-primary"
          />
          <select
            name="category"
            defaultValue={category}
            className="h-10 rounded-md border bg-background px-3 text-sm outline-none ring-offset-background focus:ring-2 focus:ring-primary"
          >
            <option value="">Toutes catégories</option>
            {categories.map((item) => (
              <option key={item.id} value={item.id}>{item.name}</option>
            ))}
          </select>
          <select
            name="sort"
            defaultValue={sort}
            className="h-10 rounded-md border bg-background px-3 text-sm outline-none ring-offset-background focus:ring-2 focus:ring-primary"
          >
            <option value="newest">Nouveautés</option>
            <option value="price_asc">Prix croissant</option>
            <option value="price_desc">Prix décroissant</option>
          </select>
          <button type="submit" className="h-10 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground">
            Filtrer
          </button>
        </form>

        {products.length === 0 ? (
          <div className="rounded-2xl border bg-card p-8 text-center text-muted-foreground">
            Aucun produit disponible pour le moment.
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-5 lg:grid-cols-4">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </StoreShell>
  )
}
