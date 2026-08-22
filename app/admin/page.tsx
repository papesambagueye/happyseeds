'use client'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { AlertTriangle, Euro, Package, Search, ShoppingCart, TrendingUp } from 'lucide-react'
import { AdminShell } from '@/components/admin/admin-shell'
import { apiClient } from '@/lib/request'
import { formatPrice } from '@/lib/utils'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

type Stats = {
  revenue: number
  orderCount: number
  pendingOrders: number
  validatedOrders: number
  cancelledOrders: number
  lowStockCount: number
  lowStock: { id: string; name: string; nameEn: string; stock: number }[]
  daily: { day: string; revenue: number; count: number }[]
  popular: { name: string; quantity: number; revenue: number }[]
  loyalty: {
    vouchersIssued: number
    voucherUses: number
    referralRewards: number
    referralBonus: number
    discountGiven: number
    loyaltyEventCount: number
  }
}

const RANGES = [
  { value: 7, label: '7 jours' },
  { value: 14, label: '14 jours' },
  { value: 30, label: '30 jours' },
]

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [days, setDays] = useState(7)
  const [popular, setPopular] = useState('')

  useEffect(() => {
    apiClient.get<Stats>(`/api/admin/stats?days=${days}`).then((res) => {
      if (res.success) setStats(res.data)
    })
  }, [days])

  const maxRevenue = stats?.daily.reduce((m, d) => Math.max(m, d.revenue), 1) ?? 1
  const filteredPopular = stats?.popular.filter((p) =>
    p.name.toLowerCase().includes(popular.toLowerCase())
  ) ?? []

  return (
    <AdminShell>
      <div className="flex min-w-0 flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Tableau de bord</h1>
        <div className="flex gap-1 rounded-lg border bg-muted/40 p-1">
          {RANGES.map((r) => (
            <button key={r.value} onClick={() => setDays(r.value)}
              className={`cursor-pointer rounded-md px-3 py-1 text-sm transition hover:shadow-sm ${days === r.value ? 'bg-primary text-primary-foreground shadow-sm' : 'hover:bg-muted'}`}>
              {r.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard icon={Euro} label="Chiffre d'affaires" value={stats ? formatPrice(stats.revenue, 'FCFA') : '…'} />
        <StatCard icon={ShoppingCart} label="Commandes" value={stats?.orderCount?.toString() ?? '…'} />
        <StatCard icon={Package} label="En attente" value={stats?.pendingOrders?.toString() ?? '…'} />
        <StatCard icon={TrendingUp} label="Validées" value={stats?.validatedOrders?.toString() ?? '…'} />
      </div>

      {stats?.loyalty && (
        <div className="mt-4 rounded-2xl border p-4">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">Fidélité & récompenses</h2>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
            <SmallStat label="Codes promo créés" value={stats.loyalty.vouchersIssued} />
            <SmallStat label="Utilisations de codes" value={stats.loyalty.voucherUses} />
            <SmallStat label="Bons parrainage émis" value={stats.loyalty.referralRewards} />
            <SmallStat label="Total bonus parrainage" value={formatPrice(stats.loyalty.referralBonus, 'FCFA')} />
            <SmallStat label="Réductions accordées" value={formatPrice(stats.loyalty.discountGiven, 'FCFA')} />
          </div>
        </div>
      )}

      {stats && stats.lowStock.length > 0 && (
        <div className="mt-6 rounded-2xl border border-amber-300 bg-amber-50 p-4 dark:bg-amber-950/30">
          <div className="flex items-center gap-2 font-semibold text-amber-700 dark:text-amber-300">
            <AlertTriangle className="h-5 w-5" />
            Alertes rupture de stock
          </div>
          <ul className="mt-2 space-y-1 text-sm">
            {stats.lowStock.map((p) => (
              <li key={p.id} className="flex items-center justify-between">
                <span>{p.name}</span> <Badge variant="destructive">Stock : {p.stock}</Badge>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card className="p-5">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-semibold">Ventes (jours sélectionnés)</h2>
          </div>
          {stats ? (
            <div className="mt-4 flex h-40 items-end gap-2">
              {stats.daily.map((d) => (
                <div key={d.day} className="flex flex-1 flex-col items-center gap-1">
                  <span className="text-[10px] text-muted-foreground">{d.count || ''}</span>
                  <div className="w-full rounded-t bg-primary/80" style={{ height: `${Math.max(4, (d.revenue / maxRevenue) * 120)}px` }} />
                  <span className="text-[10px] text-muted-foreground">{d.day.slice(5)}</span>
                </div>
              ))}
            </div>
          ) : <p className="mt-4 text-muted-foreground">…</p>}
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-semibold">Produits populaires</h2>
            <div className="relative min-w-0 max-w-full">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <input
                value={popular}
                onChange={(e) => setPopular(e.target.value)}
                placeholder="Filtrer…"
                className="h-8 w-full max-w-36 rounded-md border border-input pl-8 pr-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              />
            </div>
          </div>
          {filteredPopular.length ? (
            <ul className="mt-4 space-y-2">
              {filteredPopular.map((p, i) => (
                <li key={i} className="flex items-center justify-between text-sm">
                  <span className="line-clamp-1">{p.name} <span className="text-muted-foreground">×{p.quantity}</span></span>
                  <span className="font-medium">{formatPrice(p.revenue, 'FCFA')}</span>
                </li>
              ))}
            </ul>
          ) : <p className="mt-4 text-muted-foreground">{popular ? 'Aucun produit ne correspond.' : 'Aucune vente pour le moment.'}</p>}
        </Card>
      </div>

      <div className="mt-6">
        <Button asChild variant="outline"><Link href="/admin/orders">Gérer les commandes</Link></Button>
      </div>
    </AdminShell>
  )
}

function StatCard({ icon: Icon, label, value }: { icon: typeof Euro; label: string; value: string }) {
  return (
    <Card className="p-4">
      <div className="flex items-center gap-2 text-muted-foreground">
        <Icon className="h-4 w-4 text-primary" /> <span className="text-xs">{label}</span>
      </div>
      <div className="mt-2 text-2xl font-bold">{value}</div>
    </Card>
  )
}

function SmallStat({ label, value }: { label: string; value: string | number }) {
  return (
    <div>
      <div className="text-xl font-bold">{value}</div>
      <div className="mt-0.5 text-xs text-muted-foreground">{label}</div>
    </div>
  )
}
