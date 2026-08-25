import Link from 'next/link'
import { redirect } from 'next/navigation'
import { StoreShell } from '@/components/store/shell'
import { getCurrentUser } from '@/lib/auth/session'
import { db } from '@/db'
import { products } from '@/db/schemas/core'
import { and, eq, gt, lte } from 'drizzle-orm'
import { getAccountSummary } from '@/lib/services/account'
import { LoyaltyRewardPicker } from '@/components/store/loyalty-reward-picker'

export default async function AccountPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/login')
  const [summary, rewardProducts] = await Promise.all([
    getAccountSummary(user.id),
    db.select({ id: products.id, name: products.name, price: products.price, currency: products.currency }).from(products).where(and(eq(products.published, 1), gt(products.stock, 0), lte(products.price, 1500000))).limit(30),
  ])
  const points = summary.points

  return (
    <StoreShell>
      <div className="mx-auto max-w-4xl px-4 py-10">
        <div className="mb-6">
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-primary">Compte</p>
          <h1 className="mt-2 text-3xl font-bold">Mon compte</h1>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <div className="rounded-2xl border bg-card p-6">
            <h2 className="text-lg font-semibold">Informations</h2>
            <dl className="mt-4 space-y-3 text-sm text-muted-foreground">
              <div><dt className="font-medium text-foreground">Nom</dt><dd>{user.name ?? '—'}</dd></div>
              <div><dt className="font-medium text-foreground">Email</dt><dd>{user.email}</dd></div>
              <div><dt className="font-medium text-foreground">Rôle</dt><dd className="capitalize">{user.role}</dd></div>
            </dl>
          </div>

          <div className="rounded-2xl border bg-card p-6">
            <h2 className="text-lg font-semibold">Accès rapide</h2>
            <div className="mt-4 flex flex-col gap-3">
              <Link href="/favoris" className="rounded-md border px-3 py-2 text-sm hover:bg-muted">Mes favoris</Link>
              <Link href="/commandes" className="rounded-md border px-3 py-2 text-sm hover:bg-muted">Mes commandes</Link>
              <Link href="/parrainage" className="rounded-md border px-3 py-2 text-sm hover:bg-muted">Parrainage</Link>
            </div>
          </div>
        </div>

        <div className="mt-6 grid gap-6 md:grid-cols-2">
          <LoyaltyRewardPicker points={points} products={rewardProducts} />
          <div className="rounded-2xl border bg-card p-6">
            <h2 className="text-lg font-semibold">Comment gagner des points</h2>
            <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
              <li><strong className="text-foreground">5 points</strong> à l’inscription.</li>
              <li><strong className="text-foreground">3 points</strong> bonus sur la première commande de 6 500 FCFA ou plus. Exemple : une commande de 7 000 FCFA rapporte 7 points + 3 points bonus = 10 points.</li>
              <li><strong className="text-foreground">1 point</strong> par tranche de 1 000 FCFA sur une commande validée.</li>
              <li><strong className="text-foreground">3 points</strong> le jour de votre anniversaire, une fois par an.</li>
              <li><strong className="text-foreground">4 points</strong> attribués une seule fois si 3 filleuls créent leur compte via votre lien de parrainage.</li>
              <li><strong className="text-foreground">5 points</strong> attribués une seule fois lorsque 3 filleuls cumulent ensemble 10 000 FCFA d’achats validés.</li>
              <li><strong className="text-foreground">10 points</strong> si, après un échange de cadeau, votre solde descend sous 10 points et 5 nouveaux filleuls créent leur compte via votre lien.</li>
              <li><strong className="text-foreground">30 / 50 / 100 points</strong> donnent respectivement un cadeau d’une valeur ≤ 6 000 / 12 000 / 23 000 FCFA.</li>
              <li><strong className="text-foreground">Tirage mensuel</strong> : les 10 clients les plus acheteurs participent automatiquement ; 3 gagnants remportent chacun un AirPod 3 ou AirPod Pro au choix.</li>
            </ul>
            <Link href="/parrainage" className="mt-5 inline-flex text-sm font-medium text-primary hover:underline">Inviter un proche</Link>
          </div>
        </div>
      </div>
    </StoreShell>
  )
}
