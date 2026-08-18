import Link from 'next/link'
import { redirect } from 'next/navigation'
import { StoreShell } from '@/components/store/shell'
import { getCurrentUser } from '@/lib/auth/session'

export default async function AccountPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/login')

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
      </div>
    </StoreShell>
  )
}
