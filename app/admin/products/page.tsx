'use client'
import { useCallback, useEffect, useState } from 'react'
import Image from 'next/image'
import { Plus, Pencil, Trash2, Star } from 'lucide-react'
import { toast } from 'sonner'
import { AdminShell } from '@/components/admin/admin-shell'
import { SearchInput } from '@/components/admin/search-input'
import { ImageUploadField } from '@/components/admin/image-upload-field'
import { apiClient } from '@/lib/request'
import { formatPrice } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'

type Category = { id: string; name: string; nameEn: string }
type ProductRow = {
  product: {
    id: string; name: string; nameEn: string
    description: string | null; descriptionEn: string | null
    price: number; compareAtPrice: number | null; stock: number
    image: string | null; featured: number; published: number
    currency: string; categoryId: string | null
  }
  categoryName: string | null
}

const emptyForm = {
  name: '', nameEn: '', description: '', descriptionEn: '',
  price: '0', compareAtPrice: '', stock: '0', image: '',
  categoryId: '', featured: false, published: true,
}

export default function AdminProducts() {
  const [rows, setRows] = useState<ProductRow[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<string | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)

  const load = useCallback(async (q: string) => {
    setLoading(true)
    const params = new URLSearchParams()
    if (q) params.set('q', q)
    const qs = params.toString() ? `?${params.toString()}` : ''
    const [prodRes, catRes] = await Promise.all([
      apiClient.get<ProductRow[]>(`/api/admin/products${qs}`),
      apiClient.get<Category[]>('/api/admin/categories'),
    ])
    if (prodRes.success) setRows(prodRes.data)
    if (catRes.success) setCategories(catRes.data)
    setLoading(false)
  }, [])

  useEffect(() => { load('') }, [load])

  const openNew = () => { setEditing(null); setForm(emptyForm); setOpen(true) }
  const openEdit = (row: ProductRow) => {
    setEditing(row.product.id)
    setForm({
      name: row.product.name,
      nameEn: row.product.nameEn,
      description: row.product.description ?? '',
      descriptionEn: row.product.descriptionEn ?? '',
      price: String(row.product.price),
      compareAtPrice: row.product.compareAtPrice ? String(row.product.compareAtPrice) : '',
      stock: String(row.product.stock),
      image: row.product.image ?? '',
      categoryId: row.product.categoryId ?? '',
      featured: row.product.featured === 1,
      published: row.product.published === 1,
    })
    setOpen(true)
  }

  const save = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    const payload = {
      name: form.name,
      nameEn: form.nameEn || form.name,
      description: form.description,
      descriptionEn: form.descriptionEn,
      price: Number(form.price) || 0,
      compareAtPrice: form.compareAtPrice ? Number(form.compareAtPrice) : null,
      stock: Number(form.stock) || 0,
      image: form.image || null,
      currency: 'FCFA',
      categoryId: form.categoryId || null,
      featured: form.featured ? 1 : 0,
      published: form.published ? 1 : 0,
    }
    const res = editing
      ? await apiClient.put(`/api/admin/products/${editing}`, payload)
      : await apiClient.post('/api/admin/products', payload)
    setSaving(false)
    if (res.success) {
      toast.success(editing ? 'Produit mis à jour' : 'Produit créé')
      setOpen(false)
      load(query)
    } else {
      toast.error(res.error)
    }
  }

  const deleteProduct = async (id: string) => {
    if (!confirm('Supprimer ce produit ?')) return
    const res = await apiClient.delete(`/api/admin/products/${id}`)
    if (res.success) { toast.success('Produit supprimé'); load(query) }
    else toast.error(res.error)
  }

  const set = (key: keyof typeof emptyForm) => (value: string | boolean) =>
    setForm((f) => ({ ...f, [key]: value }))

  function Field({ label, children }: { label: string; children: React.ReactNode }) {
    return (
      <label className="block space-y-2 text-sm font-medium">
        <span>{label}</span>
        {children}
      </label>
    )
  }

  return (
    <AdminShell>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Produits</h1>
        <div className="flex items-center gap-3">
          <SearchInput value={query} onSearch={load} placeholder="Rechercher produits…" className="w-56 sm:w-72" />
          <Button onClick={openNew}><Plus className="mr-1 h-4 w-4" /> Nouveau produit</Button>
        </div>
      </div>

      <div className="mt-4 h-5 text-sm text-muted-foreground">
        {loading ? 'Chargement…' : `${rows.length} produit(s)`}
      </div>

      <div className="mt-2 overflow-hidden rounded-2xl border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Produit</TableHead>
              <TableHead>Prix</TableHead>
              <TableHead>Stock</TableHead>
              <TableHead>Catégorie</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow><TableCell colSpan={5} className="py-10 text-center text-muted-foreground">{query ? 'Aucun produit ne correspond à la recherche.' : 'Aucun produit.'}</TableCell></TableRow>
            ) : rows.map((row) => (
              <TableRow key={row.product.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div className="relative h-10 w-10 overflow-hidden rounded-md bg-muted">
                      {row.product.image && <Image src={row.product.image} alt={row.product.name} fill className="object-cover" unoptimized />}
                    </div>
                    <div>
                      <div className="flex items-center gap-1 font-medium">
                        {row.product.name}
                        {row.product.featured === 1 && <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />}
                      </div>
                      {row.product.published === 0 && <Badge variant="secondary">Brouillon</Badge>}
                    </div>
                  </div>
                </TableCell>
                <TableCell>{formatPrice(row.product.price, row.product.currency)}</TableCell>
                <TableCell><Badge variant={row.product.stock <= 5 ? 'destructive' : 'secondary'}>{row.product.stock}</Badge></TableCell>
                <TableCell>{row.categoryName ?? '—'}</TableCell>
                <TableCell>
                  <div className="flex justify-end gap-1">
                    <Button variant="ghost" size="icon" onClick={() => openEdit(row)}><Pencil className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => deleteProduct(row.product.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing ? 'Modifier le produit' : 'Nouveau produit'}</DialogTitle></DialogHeader>
          <form onSubmit={save} className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Nom (FR)"><Input value={form.name} onChange={(e) => set('name')(e.target.value)} required /></Field>
              <Field label="Nom (EN)"><Input value={form.nameEn} onChange={(e) => set('nameEn')(e.target.value)} /></Field>
            </div>
            <Field label="Description (FR)"><Textarea value={form.description} onChange={(e) => set('description')(e.target.value)} rows={2} /></Field>
            <Field label="Description (EN)"><Textarea value={form.descriptionEn} onChange={(e) => set('descriptionEn')(e.target.value)} rows={2} /></Field>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Prix (FCFA, en unité)"><Input type="number" value={form.price} onChange={(e) => set('price')(e.target.value)} required /></Field>
              <Field label="Ancien prix (optionnel)"><Input type="number" value={form.compareAtPrice} onChange={(e) => set('compareAtPrice')(e.target.value)} /></Field>
              <Field label="Stock (unité)"><Input type="number" value={form.stock} onChange={(e) => set('stock')(e.target.value)} /></Field>
              <Field label="Catégorie">
                <Select value={form.categoryId} onValueChange={(v) => set('categoryId')(v)}>
                  <SelectTrigger><SelectValue placeholder="Aucune" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Aucune</SelectItem>
                    {categories.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </Field>
            </div>
            <ImageUploadField label="Image produit" value={form.image || null} onChange={(v) => set('image')(v ?? '')} />
            <div className="flex items-center gap-6">
              <label className="flex items-center gap-2 text-sm"><Switch checked={form.featured} onCheckedChange={(v) => set('featured')(v)} /> En vedette</label>
              <label className="flex items-center gap-2 text-sm"><Switch checked={form.published} onCheckedChange={(v) => set('published')(v)} /> Publié</label>
            </div>
            <Button type="submit" disabled={saving} className="w-full">{saving ? '…' : 'Enregistrer'}</Button>
          </form>
        </DialogContent>
      </Dialog>
    </AdminShell>
  )
}
