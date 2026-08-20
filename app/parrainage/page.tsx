import { redirect } from 'next/navigation'
import { StoreShell } from '@/components/store/shell'
import { ReferralPanel } from '@/components/store/referral-panel'
import { getCurrentUser } from '@/lib/auth/session'
import { getReferralOverview } from '@/lib/services/referrals'

export default async function ReferralPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/login')

  const overview = await getReferralOverview(user.id)
  const referralCode = overview.code
  const referralLink = overview.link

  return (
    <StoreShell>
      <div className="mx-auto max-w-4xl px-4 py-10">
        <div className="mb-6">
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-primary">Parrainage</p>
          <h1 className="mt-2 text-3xl font-bold">Invitez vos amis</h1>
        </div>

        <ReferralPanel code={referralCode} link={referralLink} />
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl border bg-card p-4"><p className="text-2xl font-bold">{overview.referredCount}</p><p className="text-sm text-muted-foreground">Filleuls inscrits</p></div>
          <div className="rounded-xl border bg-card p-4"><p className="text-2xl font-bold">{overview.qualifyingAirpodReferrals}/{overview.airpodReferralThreshold}</p><p className="text-sm text-muted-foreground">Filleuls à 5 000 FCFA pour l’offre AirPod</p></div>
          <div className="rounded-xl border bg-card p-4"><p className="text-2xl font-bold">{overview.airpodRewarded ? 'Obtenu' : 'En cours'}</p><p className="text-sm text-muted-foreground">Maximum : 1 AirPod par parrain</p></div>
        </div>
      </div>
    </StoreShell>
  )
}
