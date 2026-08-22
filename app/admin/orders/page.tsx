'use client'
import { useCallback, useEffect, useState } from 'react'
import { Check, X, Eye } from 'lucide-react'
import { toast } from 'sonner'
import { AdminShell } from '@/components/admin/admin-shell'
import { SearchInput } from '@/components/admin/search-input'
import { apiClient } from '@/lib/request'
import { formatPrice } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'

type Order = {
  id: string; orderNumber: string; status: 'pending' | 'validated' | 'cancelled' | 'on_hold'
  total: number; currency: string; createdAt: string | Date
  customerName: string | null; customerPhone: string | null
  itemSummary: string | null
}
type OrderDetail = {
  order: Order | null
  items: { id: string; productId: string | null; productName: string | null; quantity: number; price: number; currency: string }[]
  whatsappMessage: string | null
}

type OrderStatus = Order['status']

const statusStyles: Record<string, 'secondary' | 'default' | 'destructive'> = {
  pending: 'secondary', on_hold: 'secondary', validated: 'default', cancelled: 'destructive',
}
const statusLabels: Record<string, string> = {
  pending: 'En attente', on_hold: 'Mis en attente', validated: 'Validée', cancelled: 'Annulée',
}

export default function AdminOrders() {
  const [orders, setOrders] = useState<Order[]>([])
  const [filter, setFilter] = useState('')
  const [query, setQuery] = useState('')
  const [detail, setDetail] = useState<OrderDetail | null>(null)
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  const load = useCallback(async (status = filter) => {
    setLoading(true)
    const params = new URLSearchParams()
    if (status) params.set('status', status)
    if (query) params.set('q', query)
    const qs = params.toString() ? `?${params.toString()}` : ''
    const res = await apiClient.get<Order[]>(`/api/admin/orders${qs}`)
    if (res.success) setOrders(res.data)
    setLoading(false)
  }, [filter, query])

  useEffect(() => { load() }, [load])

  const setTab = (key: string) => { setFilter(key) }

  const openDetail = async (id: string) => {
    const res = await apiClient.get<OrderDetail>(`/api/admin/orders/${id}`)
    if (res.success) { setDetail(res.data); setOpen(true) }
    else toast.error(res.error)
  }

  const act = async (id: string, status: OrderStatus) => {
    const res = await apiClient.patch(`/api/admin/orders/${id}`, { status })
    if (res.success) {
      toast.success(`Commande ${statusLabels[status].toLowerCase()}`)
      setOpen(false)
      load()
    } else toast.error(res.error)
  }

  const tabs = [
    { key: '', label: 'Toutes' },
    { key: 'pending', label: 'En attente' },
    { key: 'on_hold', label: 'Mis en attente' },
    { key: 'validated', label: 'Validées' },
    { key: 'cancelled', label: 'Annulées' },
  ]

  return (
    <AdminShell>
      <div className="flex min-w-0 flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Commandes</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {loading ? 'Chargement…' : `${orders.length} commande(s)`}
          </p>
        </div>
        <SearchInput value={query} onSearch={setQuery} placeholder="Rechercher (nom, téléphone, n° commande)…" className="w-64 sm:w-80" />
      </div>

      <div className="mt-4 flex gap-1 rounded-lg border bg-muted/40 p-1 w-fit">
        {tabs.map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`cursor-pointer rounded-md px-3 py-1 text-sm transition hover:shadow-sm ${filter === t.key ? 'bg-primary text-primary-foreground shadow-sm' : 'hover:bg-muted'}`}>
            {t.label}
          </button>
        ))}
      </div>

      <div className="mt-4 overflow-hidden rounded-2xl border bg-card">
        <Table>
          <TableHeader>
            <TableRow><TableHead>N°</TableHead><TableHead>Client</TableHead><TableHead>Total</TableHead><TableHead>Statut</TableHead><TableHead>Date</TableHead><TableHead /></TableRow>
          </TableHeader>
          <TableBody>
            {orders.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="py-10 text-center text-muted-foreground">{query ? 'Aucune commande ne correspond à la recherche.' : 'Aucune commande.'}</TableCell></TableRow>
            ) : orders.map((o) => (
              <TableRow key={o.id}>
                <TableCell className="font-medium">#{o.orderNumber}</TableCell>
                <TableCell>{o.customerName || '—'}</TableCell>
                <TableCell>{formatPrice(o.total, o.currency)}</TableCell>
                <TableCell><Badge variant={statusStyles[o.status]}>{statusLabels[o.status]}</Badge></TableCell>
                <TableCell>{formatDateTime(o.createdAt)}</TableCell>
                <TableCell><Button title="Voir les détails de la commande" variant="ghost" size="icon" onClick={() => openDetail(o.id)}><Eye className="h-4 w-4" /></Button></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Commande #{detail?.order?.orderNumber}</DialogTitle></DialogHeader>
          {detail?.order && (
            <>
              <div className="flex items-center gap-2">
                <Badge variant={statusStyles[detail.order.status]}>{statusLabels[detail.order.status]}</Badge>
                <span className="text-sm text-muted-foreground">le {formatDateTime(detail.order.createdAt)}</span>
              </div>

              <div className="rounded-xl border p-3 text-sm">
                <div><strong>{detail.order.customerName ?? 'Sans nom'}</strong></div>
                <div>{detail.order.customerPhone}</div>
              </div>

              <div className="min-w-0 space-y-2">
                {detail.items.map((it) => (
                  <div key={it.id} className="flex min-w-0 flex-wrap items-center justify-between gap-x-3 gap-y-1 rounded-lg border px-3 py-2 text-sm">
                    <span className="min-w-0 break-words">{it.productName ?? 'Produit'}</span>
                    <span className="shrink-0 font-medium">{it.quantity} × {formatPrice(it.price, it.currency)}</span>
                  </div>
                ))}
                <div className="flex justify-between gap-2 border-t pt-2 font-semibold">
                  <span>Total ({detail.order.currency})</span>
                  <span>{formatPrice(detail.order.total, detail.order.currency)}</span>
                </div>
              </div>

              {detail.whatsappMessage && (
                <div className="rounded-xl bg-muted/60 p-3 text-xs text-muted-foreground">
                  <div className="mb-1 font-semibold text-foreground">Message WhatsApp lié :</div>
                  {detail.whatsappMessage}
                </div>
              )}

              <div className="space-y-2">
                <p className="text-sm font-medium">Changer le statut</p>
                <div className="flex flex-wrap gap-2">
                  {(['pending', 'on_hold', 'validated', 'cancelled'] as OrderStatus[]).map((status) => (
                    <Button
                      key={status}
                      variant={status === 'cancelled' ? 'destructive' : status === detail.order!.status ? 'default' : 'outline'}
                      disabled={status === detail.order!.status}
                      className="max-w-full"
                      onClick={() => act(detail.order!.id, status)}
                    >
                      {status === 'validated' && <Check className="mr-1 h-4 w-4" />}
                      {status === 'cancelled' && <X className="mr-1 h-4 w-4" />}
                      {statusLabels[status]}
                    </Button>
                  ))}
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </AdminShell>
  )
}

function formatDateTime(value: string | Date) {
  return new Intl.DateTimeFormat('fr-FR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(value))
}
