'use client'

import { useCallback, useEffect, useState } from 'react'
import Image from 'next/image'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { AdminShell } from '@/components/admin/admin-shell'
import { ImageUploadField } from '@/components/admin/image-upload-field'
import { apiClient } from '@/lib/request'
import { formatPrice } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

type Product = { id: string; name: string; price: number; stock: number; image: string | null }
type ProductRow = { product: Product }
type Offer = {
  id: string
  productId: string
  active: number
  startsAt: string | null
  endsAt: string | null
  productName: string
  productPrice: number
  productImage: string | null
  promotionalPrice?: number
  salePrice?: number
}
type Form = { productId: string; price: string; active: boolean; startsAt: string; endsAt: string }
type FlashForm = Form & { productName: string; description: string; image: string; originalPrice: string }

const blank: Form = { productId: '', price: '', active: true, startsAt: '', endsAt: '' }
const blankFlash: FlashForm = { ...blank, productName: '', description: '', image: '', originalPrice: '' }

export function OfferManager({ kind }: { kind: 'promotion' | 'flash' }) {
  const isPromotion = kind === 'promotion'
  const [rows, setRows] = useState<Offer[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [form, setForm] = useState<Form>(blank)
  const [flashForm, setFlashForm] = useState<FlashForm>(blankFlash)
  const [editing, setEditing] = useState<string | null>(null)
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const endpoint = isPromotion ? '/api/admin/promotions' : '/api/admin/flash-sales'
  const title = isPromotion ? 'Promotions' : 'Ventes flash'
  const singular = isPromotion ? 'promotion' : 'vente flash'

  const load = useCallback(async () => {
    const [offers, productResult] = await Promise.all([
      apiClient.get<Offer[]>(endpoint),
      apiClient.get<ProductRow[]>('/api/admin/products'),
    ])
    if (offers.success) setRows(offers.data)
    if (productResult.success) setProducts(productResult.data.map(({ product }) => product))
  }, [endpoint])

  useEffect(() => { load() }, [load])

  const openNew = () => { setEditing(null); setForm(blank); setFlashForm(blankFlash); setOpen(true) }
  const openEdit = (row: Offer) => {
    setEditing(row.id)
    setForm({
      productId: row.productId,
      price: String(row.promotionalPrice ?? row.salePrice ?? ''),
      active: row.active === 1,
      startsAt: row.startsAt ? toLocal(row.startsAt) : '',
      endsAt: row.endsAt ? toLocal(row.endsAt) : '',
    })
    setFlashForm({ ...blankFlash, productId: row.productId, price: String(row.salePrice ?? row.promotionalPrice ?? ''), active: row.active === 1, startsAt: row.startsAt ? toLocal(row.startsAt) : '', endsAt: row.endsAt ? toLocal(row.endsAt) : '' })
    setOpen(true)
  }

  const save = async (event: React.FormEvent) => {
    event.preventDefault()
    if (isPromotion && !form.productId) { toast.error('Choisissez un produit'); return }
    if (!isPromotion && !editing && !flashForm.productName.trim()) { toast.error('Saisissez le nom du produit'); return }
    const currentForm = isPromotion ? form : flashForm
    if (currentForm.startsAt && currentForm.endsAt && new Date(currentForm.endsAt) <= new Date(currentForm.startsAt)) { toast.error('La fin doit être après le début'); return }
    setSaving(true)
    const payload = isPromotion
      ? { id: editing ?? undefined, productId: form.productId, promotionalPrice: Number(form.price), active: form.active ? 1 : 0, startsAt: form.startsAt || null, endsAt: form.endsAt || null }
      : { id: editing ?? undefined, productId: editing ? flashForm.productId : undefined, productName: editing ? undefined : flashForm.productName, description: flashForm.description, image: flashForm.image || null, originalPrice: Number(flashForm.originalPrice), price: Number(flashForm.price), salePrice: Number(flashForm.price), active: flashForm.active ? 1 : 0, label: 'Produit d’occasion', startsAt: flashForm.startsAt || null, endsAt: flashForm.endsAt || null }
    const result = await apiClient.post(endpoint, payload)
    setSaving(false)
    if (result.success) { toast.success('Enregistrement effectué'); setOpen(false); load() } else toast.error(result.error)
  }

  const remove = async (id: string) => {
    if (!confirm(`Supprimer cette ${singular} ?`)) return
    const result = await apiClient.delete(`${endpoint}?id=${id}`)
    if (result.success) { toast.success('Suppression effectuée'); load() } else toast.error(result.error)
  }

  return (
    <AdminShell>
      <div className="flex min-w-0 flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">{title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{isPromotion ? 'Réductions temporaires sur les produits du catalogue.' : 'Articles d’occasion uniques, disponibles en stock de 1.'}</p>
        </div>
        <Button onClick={openNew}><Plus className="mr-1 h-4 w-4" /> Nouvelle {singular}</Button>
      </div>
      <div className="mt-6 overflow-x-auto rounded-2xl border bg-card">
        <Table>
          <TableHeader><TableRow><TableHead>Produit</TableHead><TableHead>Nouveau prix</TableHead><TableHead>Prix actuel</TableHead><TableHead>Début</TableHead><TableHead>Fin</TableHead><TableHead>Statut</TableHead><TableHead /></TableRow></TableHeader>
          <TableBody>
            {rows.length === 0 ? <TableRow><TableCell colSpan={7} className="py-10 text-center text-muted-foreground">Aucune {singular}.</TableCell></TableRow> : rows.map((row) => <TableRow key={row.id}>
              <TableCell><div className="flex items-center gap-3"><div className="relative h-10 w-10 overflow-hidden rounded-md bg-muted">{row.productImage && <Image src={row.productImage} alt={row.productName} fill className="object-cover" unoptimized />}</div><span className="font-medium">{row.productName}</span></div></TableCell>
              <TableCell className="font-semibold text-primary">{formatPrice(row.promotionalPrice ?? row.salePrice ?? 0, 'FCFA')}</TableCell>
              <TableCell className="text-muted-foreground line-through">{formatPrice(row.productPrice, 'FCFA')}</TableCell>
              <TableCell className="text-xs">{row.startsAt ? toLocal(row.startsAt).replace('T', ' ') : 'Immédiate'}</TableCell>
              <TableCell className="text-xs">{row.endsAt ? toLocal(row.endsAt).replace('T', ' ') : 'Sans fin'}</TableCell>
              <TableCell>{row.active === 1 ? <Badge className={isPromotion ? '' : 'bg-red-600'}>Active</Badge> : <Badge variant="secondary">Inactive</Badge>}</TableCell>
              <TableCell><div className="flex justify-end gap-1"><Button title="Modifier" variant="ghost" size="icon" onClick={() => openEdit(row)}><Pencil className="h-4 w-4" /></Button><Button title="Supprimer" variant="ghost" size="icon" onClick={() => remove(row.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button></div></TableCell>
            </TableRow>)}
          </TableBody>
        </Table>
      </div>
      <Dialog open={open} onOpenChange={setOpen}><DialogContent className="max-h-[90vh] overflow-y-auto"><DialogHeader><DialogTitle>{editing ? 'Modifier' : 'Nouvelle'} {singular}</DialogTitle></DialogHeader><form onSubmit={save} className="space-y-4">
        {isPromotion || editing ? <div className="space-y-1.5"><Label>Produit</Label><select value={isPromotion ? form.productId : flashForm.productId} onChange={(event) => isPromotion ? setForm({ ...form, productId: event.target.value }) : setFlashForm({ ...flashForm, productId: event.target.value })} className="h-10 w-full rounded-md border bg-background px-3 text-sm"><option value="">Choisir un produit</option>{products.filter((product) => isPromotion || product.stock === 1).map((product) => <option key={product.id} value={product.id}>{product.name} - {formatPrice(product.price, 'FCFA')}</option>)}</select></div> : <><div className="space-y-1.5"><Label>Nom du produit d’occasion</Label><Input value={flashForm.productName} onChange={(event) => setFlashForm({ ...flashForm, productName: event.target.value })} required /></div><div className="space-y-1.5"><Label>Description</Label><Input value={flashForm.description} onChange={(event) => setFlashForm({ ...flashForm, description: event.target.value })} /></div><ImageUploadField label="Image du produit d’occasion" value={flashForm.image || null} onChange={(image) => setFlashForm({ ...flashForm, image: image ?? '' })} /></>}
        <div className="grid gap-3 sm:grid-cols-2">{!isPromotion && !editing && <div className="space-y-1.5"><Label>Prix de référence (FCFA)</Label><Input type="number" min="1" value={flashForm.originalPrice} onChange={(event) => setFlashForm({ ...flashForm, originalPrice: event.target.value })} required /></div>}<div className="space-y-1.5"><Label>{isPromotion ? 'Nouveau prix' : 'Prix de vente'} (FCFA)</Label><Input type="number" min="1" value={isPromotion ? form.price : flashForm.price} onChange={(event) => isPromotion ? setForm({ ...form, price: event.target.value }) : setFlashForm({ ...flashForm, price: event.target.value })} required /></div></div>
        <div className="grid gap-3 sm:grid-cols-2"><div className="space-y-1.5"><Label>Date et heure de début</Label><Input type="datetime-local" value={isPromotion ? form.startsAt : flashForm.startsAt} onChange={(event) => isPromotion ? setForm({ ...form, startsAt: event.target.value }) : setFlashForm({ ...flashForm, startsAt: event.target.value })} /></div><div className="space-y-1.5"><Label>Date et heure de fin</Label><Input type="datetime-local" value={isPromotion ? form.endsAt : flashForm.endsAt} onChange={(event) => isPromotion ? setForm({ ...form, endsAt: event.target.value }) : setFlashForm({ ...flashForm, endsAt: event.target.value })} /></div></div>
        <label className="flex items-center gap-2 text-sm"><Switch checked={isPromotion ? form.active : flashForm.active} onCheckedChange={(active) => isPromotion ? setForm({ ...form, active }) : setFlashForm({ ...flashForm, active })} /> Active</label><Button type="submit" disabled={saving} className="w-full">{saving ? '…' : 'Enregistrer'}</Button>
      </form></DialogContent></Dialog>
    </AdminShell>
  )
}

function toLocal(value: string) {
  const date = new Date(value)
  const pad = (part: number) => String(part).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}
