import { redirect } from 'next/navigation'
import { StoreShell } from '@/components/store/shell'
import { getCurrentUser } from '@/lib/auth/session'

export default async function ReferralPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/login')

  const referralCode = user.email.split('@')[0].replace(/[^a-zA-Z0-9]/g, '').slice(0, 12).toUpperCase()
  const referralLink = `/register?ref=${encodeURIComponent(referralCode)}`

  return (
    <StoreShell>
      <div className="mx-auto max-w-4xl px-4 py-10">
        <div className="mb-6">
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-primary">Parrainage</p>
          <h1 className="mt-2 text-3xl font-bold">Invitez vos amis</h1>
        </div>

        <div className="rounded-2xl border bg-card p-6">
          <p className="text-sm text-muted-foreground">Partagez votre code et gagnez des avantages à chaque recommandation.</p>
          <div className="mt-4 rounded-xl bg-primary/5 p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-primary">Code de parrainage</p>
            <p className="mt-2 text-2xl font-bold tracking-[0.2em]">{referralCode}</p>
          </div>
          <div className="mt-4 rounded-xl border p-4">
            <p className="text-sm text-muted-foreground">Lien de partage</p>
            <a href={referralLink} className="mt-2 block break-all text-sm font-medium text-primary">{referralLink}</a>
          </div>
        </div>
      </div>
    </StoreShell>
  )
}
