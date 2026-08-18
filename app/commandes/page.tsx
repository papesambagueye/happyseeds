import { redirect } from 'next/navigation'
import { StoreShell } from '@/components/store/shell'
import { getCurrentUser } from '@/lib/auth/session'

export default async function OrdersPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/login')

  return (
    <StoreShell>
      <div className="mx-auto max-w-4xl px-4 py-10">
        <div className="mb-6">
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-primary">Commandes</p>
          <h1 className="mt-2 text-3xl font-bold">Mes commandes</h1>
        </div>

        <div className="rounded-2xl border bg-card p-8 text-center text-muted-foreground">
          Aucune commande pour le moment. Dès que vous passez une commande, elle apparaîtra ici.
        </div>
      </div>
    </StoreShell>
  )
}
