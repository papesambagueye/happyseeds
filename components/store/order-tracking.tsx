'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { CheckCircle2, Clock } from 'lucide-react'
import { StoreShell } from '@/components/store/shell'
import { apiClient } from '@/lib/request'
import { useI18n } from '@/lib/i18n'
import { formatDate, formatPrice } from '@/lib/utils'
import { Button } from '@/components/ui/button'

type OrderDetail = {
  order: { id: string; orderNumber: string; status: 'pending' | 'validated' | 'cancelled' | 'on_hold'; total: number; currency: string; customerName: string; customerPhone: string; createdAt: string }
  items: { id: string; productName: string; quantity: number; unitPrice: number }[]
}

export function OrderTracking({ id }: { id: string }) {
  const { t } = useI18n()
  const [detail, setDetail] = useState<OrderDetail | null | false>(null)

  useEffect(() => {
    apiClient.get<OrderDetail>(`/api/orders/${id}`).then((res) => {
      setDetail(res.success ? res.data : false)
    })
  }, [id])

  if (detail === false) {
    return (
      <StoreShell>
        <div className="mx-auto max-w-md px-4 py-24 text-center text-muted-foreground">Commande introuvable.</div>
      </StoreShell>
    )
  }

  if (!detail) {
    return (
      <StoreShell>
        <div className="mx-auto max-w-md px-4 py-24 text-center text-muted-foreground">…</div>
      </StoreShell>
    )
  }

  const { order, items } = detail
  const StatusIcon = order.status === 'validated' ? CheckCircle2 : order.status === 'cancelled' ? Clock : Clock

  return (
    <StoreShell>
      <div className="mx-auto max-w-2xl px-4 py-8">
        <h1 className="text-3xl font-bold">{t('order_track')}</h1>

        <div className="mt-6 rounded-2xl border bg-card p-5">
          <div className="flex items-center justify-between">
            <span className="text-lg font-semibold">#{order.orderNumber}</span>
            <span className="inline-flex items-center gap-2 rounded-full bg-muted px-3 py-1 text-sm font-medium">
              <StatusIcon className="h-4 w-4 text-primary" />
              {order.status === 'pending' && t('order_status_pending')}
              {order.status === 'validated' && t('order_status_validated')}
              {order.status === 'cancelled' && t('order_status_cancelled')}
              {order.status === 'on_hold' && 'Mis en attente'}
            </span>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {order.customerName} · {formatDate(order.createdAt)}
          </p>

          <ul className="mt-4 space-y-2 border-t pt-4 text-sm">
            {items.map((i) => (
              <li key={i.id} className="flex justify-between gap-2">
                <span className="line-clamp-1">{i.productName} × {i.quantity}</span>
                <span>{formatPrice(i.unitPrice * i.quantity, order.currency)}</span>
              </li>
            ))}
          </ul>
          <div className="mt-4 flex items-center justify-between border-t pt-3 font-semibold">
            <span>{t('cart_total')}</span>
            <span className="text-primary">{formatPrice(order.total, order.currency)}</span>
          </div>
        </div>

        <Button asChild variant="outline" className="mt-4"><Link href="/catalogue">{t('continue_shopping')}</Link></Button>
      </div>
    </StoreShell>
  )
}
