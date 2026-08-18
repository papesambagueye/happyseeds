import Link from 'next/link'
import Image from 'next/image'
import { StoreShell } from '@/components/store/shell'
import { Button } from '@/components/ui/button'
import { getCurrentUser } from '@/lib/auth/session'
import { listWishlist } from '@/lib/services/wishlist'

export default async function FavoritesPage() {
  const user = await getCurrentUser()

  if (!user) {
    return (
      <StoreShell>
        <div className="mx-auto max-w-xl px-4 py-16 text-center">
          <h1 className="text-3xl font-bold">Mes favoris</h1>
          <p className="mt-3 text-muted-foreground">Connectez-vous pour sauvegarder vos produits préférés.</p>
          <div className="mt-6">
            <Button asChild>
              <Link href="/login">Se connecter</Link>
            </Button>
          </div>
        </div>
      </StoreShell>
    )
  }

  const items: Awaited<ReturnType<typeof listWishlist>> = await listWishlist(user.id).catch(() => [])

  return (
    <StoreShell>
      <div className="mx-auto max-w-6xl px-4 py-10">
        <h1 className="text-3xl font-bold">Mes favoris</h1>

        {items.length === 0 ? (
          <div className="mt-8 rounded-2xl border bg-card p-8 text-center text-muted-foreground">
            Aucun produit dans votre liste de favoris.
          </div>
        ) : (
          <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {items.map((item: Awaited<ReturnType<typeof listWishlist>>[number]) => (
              <div key={item.product.id} className="overflow-hidden rounded-2xl border bg-card">
                <div className="relative h-52 w-full">
                  {item.product.image && (
                    <Image src={item.product.image} alt={item.product.name} fill className="object-cover" unoptimized />
                  )}
                </div>
                <div className="p-4">
                  <h2 className="text-lg font-semibold">{item.product.name}</h2>
                  <div className="mt-2 text-primary font-semibold">{(item.product.price / 100).toLocaleString('fr-FR')} FCFA</div>
                  <Button asChild className="mt-4 w-full">
                    <Link href={`/produit/${item.product.slug}`}>Voir le produit</Link>
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
