'use client'
import { useCallback, useEffect, useState } from 'react'
import Image from 'next/image'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { AdminShell } from '@/components/admin/admin-shell'
import { apiClient } from '@/lib/request'
import { formatPrice } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'

type FlashRow = {
  id: string
  productId: string
  salePrice: number
  active: number
  label: string | null
  startsAt: string | null
  endsAt: string | null
  productName: string
  productPrice: number
  productImage: string | null
}

type ProductOption = { id: string; name: string; price: number; image: string | null }
type ProductRow = { product: ProductOption }

const emptyForm = { productId: '', salePrice: '0', active: true, label: '', startsAt: '', endsAt: '' }

export default function AdminPromos() {
  const [rows, setRows] = useState<FlashRow[]>([])
  const [products, setProducts] = useState<ProductOption[]>([])
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<string | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    const [flashRes, prodRes] = await Promise.all([
      apiClient.get<FlashRow[]>('/api/admin/flash-sales'),
      apiClient.get<ProductRow[]>('/api/admin/products'),
    ])
    if (flashRes.success) setRows(flashRes.data)
    if (prodRes.success) {
      const opts = prodRes.data.map((r) => ({
        id: r.product.id,
        name: r.product.name,
        price: r.product.price,
        image: r.product.image,
      }))
      setProducts(opts)
    }
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const openNew = () => { setEditing(null); setForm(emptyForm); setOpen(true) }
  const openEdit = (r: FlashRow) => {
    setEditing(r.id)
    setForm({
      productId: r.productId,
      salePrice: String(r.salePrice),
      active: r.active === 1,
      label: r.label ?? '',
      startsAt: r.startsAt ? toLocal(r.startsAt) : '',
      endsAt: r.endsAt ? toLocal(r.endsAt) : '',
    })
    setOpen(true)
  }

  const save = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.productId) { toast.error('Choisissez un produit'); return }
    setSaving(true)
    const payload = {
      id: editing ?? undefined,
      productId: form.productId,
      salePrice: Number(form.salePrice) || 0,
      active: form.active ? 1 : 0,
      label: form.label || null,
      startsAt: form.startsAt ? form.startsAt : null,
      endsAt: form.endsAt ? form.endsAt : null,
    }
    const res = await apiClient.post('/api/admin/flash-sales', payload)
    setSaving(false)
    if (res.success) { toast.success(editing ? 'Vente flash mise à jour' : 'Vente flash créée'); setOpen(false); load() }
    else toast.error(res.error)
  }

  const remove = async (id: string) => {
    if (!confirm('Supprimer cette vente flash ?')) return
    const res = await apiClient.delete(`/api/admin/flash-sales?id=${id}`)
    if (res.success) { toast.success('Vente flash supprimée'); load() }
    else toast.error(res.error)
  }

  const activeCount = rows.filter((r) => r.active === 1).length

  return (
    <AdminShell>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Ventes flash</h1>
          <p className="mt-1 text-sm text-muted-foreground">{loading ? 'Chargement…' : `${activeCount} active(s) sur ${rows.length}`}</p>
        </div>
        <Button onClick={openNew}><Plus className="mr-1 h-4 w-4" /> Nouvelle vente flash</Button>
      </div>

      <div className="mt-6 overflow-hidden rounded-2xl border bg-card">
        <Table>
          <TableHeader>
            <TableRow><TableHead>Produit</TableHead><TableHead>Prix flash</TableHead><TableHead>Prix normal</TableHead><TableHead>Statut</TableHead><TableHead className="text-right">Actions</TableHead></TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow><TableCell colSpan={5} className="py-10 text-center text-muted-foreground">Aucune vente flash. Créez-en une pour afficher des promotions.</TableCell></TableRow>
            ) : rows.map((r) => (
              <TableRow key={r.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div className="relative h-10 w-10 overflow-hidden rounded-md bg-muted">
                      {r.productImage && <Image src={r.productImage} alt={r.productName} fill className="object-cover" unoptimized />}
                    </div>
                    <div>
                      <div className="font-medium">{r.productName}</div>
                      {r.label && <div className="text-xs text-muted-foreground">{r.label}</div>}
                    </div>
                  </div>
                </TableCell>
                <TableCell className="font-semibold text-primary">{formatPrice(r.salePrice, 'FCFA')}</TableCell>
                <TableCell className="text-muted-foreground line-through">{formatPrice(r.productPrice, 'FCFA')}</TableCell>
                <TableCell>{r.active === 1 ? <Badge className="bg-red-500">En promo</Badge> : <Badge variant="secondary">Inactif</Badge>}</TableCell>
                <TableCell>
                  <div className="flex justify-end gap-1">
                    <Button variant="ghost" size="icon" onClick={() => openEdit(r)}><Pencil className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => remove(r.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing ? 'Modifier la vente flash' : 'Nouvelle vente flash'}</DialogTitle></DialogHeader>
          <form onSubmit={save} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Produit</Label>
              <select
                value={form.productId}
                onChange={(e) => setForm({ ...form, productId: e.target.value })}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              >
                <option value="">Choisir un produit</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>{p.name} — {formatPrice(p.price, 'FCFA')}</option>
                ))}
              </select>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5"><Label>Prix en promo (FCFA)</Label><Input type="number" value={form.salePrice} onChange={(e) => setForm({ ...form, salePrice: e.target.value })} required /></div>
              <div className="space-y-1.5"><Label>Libellé (optionnel)</Label><Input value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} placeholder="Ex. -40% ce weekend" /></div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5"><Label>Début (optionnel)</Label><Input type="datetime-local" value={form.startsAt} onChange={(e) => setForm({ ...form, startsAt: e.target.value })} /></div>
              <div className="space-y-1.5"><Label>Fin (optionnel)</Label><Input type="datetime-local" value={form.endsAt} onChange={(e) => setForm({ ...form, endsAt: e.target.value })} /></div>
            </div>
            <label className="flex items-center gap-2 text-sm"><Switch checked={form.active} onCheckedChange={(v) => setForm({ ...form, active: v })} /> Active</label>
            <Button type="submit" disabled={saving} className="w-full">{saving ? '…' : 'Enregistrer'}</Button>
          </form>
        </DialogContent>
      </Dialog>
    </AdminShell>
  )
}

function toLocal(iso: string) {
  const d = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}
