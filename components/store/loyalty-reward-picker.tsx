'use client'

import { useEffect, useState } from 'react'
import { Gift } from 'lucide-react'
import { toast } from 'sonner'
import { apiClient } from '@/lib/request'
import { Button } from '@/components/ui/button'
import { formatPrice } from '@/lib/utils'
import { REWARD_TIERS } from '@/lib/reward-tiers'

type Product = { id: string; name: string; price: number; currency: string }
type SavedReward = { productName: string; voucherCode: string; pointsUsed: number; status: 'pending' | 'contacted' | 'claimed' }

export function LoyaltyRewardPicker({ points, products }: { points: number; products: Product[] }) {
  const [selected, setSelected] = useState('')
  const [loading, setLoading] = useState(false)
  const [reward, setReward] = useState<{ productName: string; voucherCode: string; remainingPoints: number; pointsUsed: number } | null>(null)
  const ready = points >= 30

  useEffect(() => {
    apiClient.get<SavedReward[]>('/api/rewards/redeem').then((res) => {
      const saved = res.success ? res.data[0] : null
      if (saved) setReward({ ...saved, remainingPoints: points })
    })
  }, [points])

  const redeem = async () => {
    if (!selected) return
    setLoading(true)
    const res = await apiClient.post<{ productName: string; voucherCode: string; remainingPoints: number; pointsUsed: number }>('/api/rewards/redeem', { productId: selected })
    setLoading(false)
    if (!res.success) {
      toast.error(res.error ?? 'Échange impossible.')
      return
    }
    setReward(res.data)
    toast.success('Échange confirmé. Nous vous contacterons dans les plus brefs délais concernant votre cadeau fidélité.')
  }

  return (
    <div className="rounded-2xl border bg-card p-6">
      <div className="flex items-center gap-2"><Gift className="h-5 w-5 text-primary" /><h2 className="text-lg font-semibold">Vos points</h2></div>
      <p className="mt-2 text-3xl font-bold text-primary">{points} <span className="text-sm font-normal text-muted-foreground">points</span></p>
      <p className="mt-2 text-sm text-muted-foreground">Échangez vos points contre un produit gratuit selon trois paliers. Les points sont gagnés avec les commandes validées et le parrainage.</p>
      {ready && products.length > 0 && !reward && (
        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          <select value={selected} onChange={(event) => setSelected(event.target.value)} className="h-10 flex-1 rounded-md border bg-background px-3 text-sm">
            <option value="">Choisir une récompense</option>
            {products.map((product) => {
              const tier = REWARD_TIERS.find((item) => product.price <= item.maxPrice)
              return tier ? <option key={product.id} value={product.id} disabled={points < tier.points}>{product.name} - {formatPrice(product.price, product.currency)} ({tier.points} points)</option> : null
            })}
          </select>
          <Button type="button" disabled={!selected || loading} onClick={redeem}>{loading ? 'Validation…' : 'Échanger mes points'}</Button>
        </div>
      )}
      {!ready && <div className="mt-4 rounded-lg bg-muted p-3 text-sm">Encore {30 - points} point{30 - points === 1 ? '' : 's'} avant le premier palier.</div>}
      {ready && products.length === 0 && <p className="mt-4 text-sm text-muted-foreground">Aucun produit éligible disponible actuellement.</p>}
      {reward && (
        <div className="mt-4 space-y-2 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800">
          <p><strong>{reward.productName}</strong> est réservé pour vous.</p>
          <p>{reward.pointsUsed} points ont été échangés. Solde restant : <strong>{reward.remainingPoints} Pts</strong>.</p>
          <p>Présentez ce code à l’équipe TECH 221 : <strong className="font-mono">{reward.voucherCode}</strong>. L’équipe vous contactera pour convenir du retrait ou de la livraison.</p>
        </div>
      )}
    </div>
  )
}