'use client'
import { useCallback, useEffect, useState } from 'react'
import { Share2 } from 'lucide-react'
import { AdminShell } from '@/components/admin/admin-shell'
import { apiClient } from '@/lib/request'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'

type Row = {
  id: string
  email: string
  name: string | null
  referralCode: string | null
  rewardedCount: number
  rewardCode: string | null
}

type Dashboard = {
  totalReferrers: number
  totalRewards: number
  totalRewardedPoints: number
  rows: Row[]
}

export default function AdminReferrals() {
  const [data, setData] = useState<Dashboard | null>(null)

  const load = useCallback(async () => {
    const res = await apiClient.get<Dashboard>('/api/admin/referrals')
    if (res.success) setData(res.data)
  }, [])

  useEffect(() => { load() }, [load])

  return (
    <AdminShell>
      <div>
        <h1 className="text-2xl font-bold text-primary">Programme de parrainage</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Un bonus en bon d&apos;achat est accordé au parrain à chaque première commande validée d&apos;un filleul.
        </p>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <Card className="p-5">
          <div className="text-3xl font-bold">{data?.totalReferrers ?? '—'}</div>
          <div className="mt-1 text-sm text-muted-foreground">Parrains actifs</div>
        </Card>
        <Card className="p-5">
          <div className="text-3xl font-bold">{data?.totalRewards ?? '—'}</div>
          <div className="mt-1 text-sm text-muted-foreground">Récompenses octroyées</div>
        </Card>
        <Card className="p-5">
          <div className="text-3xl font-bold text-emerald-600">{data?.totalRewardedPoints ?? 0} Pts</div>
          <div className="mt-1 text-sm text-muted-foreground">Points attribués</div>
        </Card>
      </div>

      <div className="mt-6 overflow-hidden rounded-2xl border bg-card">
        <Table>
          <TableHeader>
            <TableRow><TableHead>Parrain</TableHead><TableHead>Code</TableHead><TableHead>Récompensés</TableHead><TableHead>Dernier bon</TableHead></TableRow>
          </TableHeader>
          <TableBody>
            {!data?.rows.length ? (
              <TableRow><TableCell colSpan={4} className="py-10 text-center text-muted-foreground">Aucun parrain pour le moment.</TableCell></TableRow>
            ) : data.rows.map((r) => (
              <TableRow key={r.id}>
                <TableCell>
                  <div className="font-medium">{r.name || '—'}</div>
                  <div className="text-xs text-muted-foreground">{r.email}</div>
                </TableCell>
                <TableCell className="font-mono">{r.referralCode ?? '—'}</TableCell>
                <TableCell>{r.rewardedCount > 0 ? <Badge className="bg-emerald-600">{r.rewardedCount}</Badge> : <Badge variant="secondary">0</Badge>}</TableCell>
                <TableCell className="font-mono text-xs">{r.rewardCode ?? '—'}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
        <Share2 className="h-4 w-4" /> Le code bonus s&apos;applique comme un bon d&apos;achat à la caisse (page « Parrainage » du client).
      </div>
    </AdminShell>
  )
}
