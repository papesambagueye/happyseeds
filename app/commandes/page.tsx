import { redirect } from 'next/navigation'
import { StoreShell } from '@/components/store/shell'
import { getCurrentUser } from '@/lib/auth/session'
import { listUserOrders } from '@/lib/services/orders'
import { formatDate, formatPrice } from '@/lib/utils'

export default async function OrdersPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/login')
  const orders = await listUserOrders(user.id)

  return (
    <StoreShell>
      <div className="mx-auto max-w-4xl px-4 py-10">
        <div className="mb-6">
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-primary">Commandes</p>
          <h1 className="mt-2 text-3xl font-bold">Mes commandes</h1>
        </div>

        {orders.length === 0 ? <div className="rounded-2xl border bg-card p-8 text-center text-muted-foreground">Aucune commande pour le moment.</div> : (
          <div className="space-y-3">
            {orders.map((order: typeof orders[number]) => (
              <div key={order.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border bg-card p-4">
                <div><p className="font-semibold">#{order.orderNumber}</p><p className="text-sm text-muted-foreground">{formatDate(order.createdAt)}</p></div>
                <div className="text-right"><p className="font-semibold">{formatPrice(order.total, order.currency)}</p><p className="text-sm capitalize text-muted-foreground">{order.status.replace('_', ' ')}</p></div>
              </div>
            ))}
          </div>
        )}
      </div>
    </StoreShell>
  )
}
