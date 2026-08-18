'use client'
import { useCallback, useEffect, useState } from 'react'
import Image from 'next/image'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { AdminShell } from '@/components/admin/admin-shell'
import { SearchInput } from '@/components/admin/search-input'
import { ImageUploadField } from '@/components/admin/image-upload-field'
import { apiClient } from '@/lib/request'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'

type Slide = {
  id: string; title: string; titleEn: string; subtitle: string | null
  subtitleEn: string | null; image: string | null; link: string | null
  active: number; sortOrder: number
}

const empty = { title: '', titleEn: '', subtitle: '', subtitleEn: '', image: '', link: '', active: true, sortOrder: '0' }

export default function AdminSlides() {
  const [slides, setSlides] = useState<Slide[]>([])
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<string | null>(null)
  const [form, setForm] = useState(empty)
  const [saving, setSaving] = useState(false)
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    const res = await apiClient.get<Slide[]>(`/api/admin/slides${query ? `?q=${encodeURIComponent(query)}` : ''}`)
    if (res.success) setSlides(res.data)
    setLoading(false)
  }, [query])

  useEffect(() => { load() }, [load])

  const openNew = () => { setEditing(null); setForm(empty); setOpen(true) }
  const openEdit = (s: Slide) => {
    setEditing(s.id)
    setForm({ title: s.title, titleEn: s.titleEn, subtitle: s.subtitle ?? '', subtitleEn: s.subtitleEn ?? '', image: s.image ?? '', link: s.link ?? '', active: s.active === 1, sortOrder: String(s.sortOrder) })
    setOpen(true)
  }

  const save = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    const payload = {
      id: editing ?? undefined,
      title: form.title,
      titleEn: form.titleEn || form.title,
      subtitle: form.subtitle || undefined,
      subtitleEn: form.subtitleEn || undefined,
      image: form.image,
      link: form.link || null,
      active: form.active ? 1 : 0,
      sortOrder: Number(form.sortOrder) || 0,
    }
    const res = await apiClient.post('/api/admin/slides', payload)
    setSaving(false)
    if (res.success) { toast.success('Slide enregistré'); setOpen(false); load() }
    else toast.error(res.error)
  }

  const remove = async (id: string) => {
    if (!confirm('Supprimer ce slide ?')) return
    const res = await apiClient.delete(`/api/admin/slides/${id}`)
    if (res.success) { toast.success('Slide supprimé'); load() }
    else toast.error(res.error)
  }

  return (
    <AdminShell>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Slides publicitaires</h1>
          <p className="mt-1 text-sm text-muted-foreground">{loading ? 'Chargement…' : `${slides.length} slide(s)`}</p>
        </div>
        <div className="flex items-center gap-3">
          <SearchInput value={query} onSearch={setQuery} placeholder="Rechercher…" className="w-56 sm:w-72" />
          <Button onClick={openNew}><Plus className="mr-1 h-4 w-4" /> Nouveau slide</Button>
        </div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {slides.length === 0 ? (
          <p className="col-span-full py-10 text-center text-muted-foreground">{query ? 'Aucun slide ne correspond à la recherche.' : 'Aucun slide.'}</p>
        ) : slides.map((s) => (
          <div key={s.id} className="overflow-hidden rounded-2xl border bg-card">
            <div className="relative h-36 bg-muted">
              {s.image && <Image src={s.image} alt={s.title} fill className="object-cover" unoptimized />}
            </div>
            <div className="p-4">
              <div className="flex items-center justify-between gap-2">
                <div className="font-semibold">{s.title}</div>
                {s.active === 1 ? <Badge>Actif</Badge> : <Badge variant="secondary">Inactif</Badge>}
              </div>
              {s.subtitle && <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{s.subtitle}</p>}
              <div className="mt-3 flex gap-1">
                <Button variant="outline" size="sm" onClick={() => openEdit(s)}><Pencil className="mr-1 h-3.5 w-3.5" /> Modifier</Button>
                <Button variant="outline" size="sm" onClick={() => remove(s.id)}><Trash2 className="mr-1 h-3.5 w-3.5 text-destructive" /> Suppr.</Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing ? 'Modifier le slide' : 'Nouveau slide'}</DialogTitle></DialogHeader>
          <form onSubmit={save} className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5"><Label>Titre (FR)</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required /></div>
              <div className="space-y-1.5"><Label>Titre (EN)</Label><Input value={form.titleEn} onChange={(e) => setForm({ ...form, titleEn: e.target.value })} /></div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5"><Label>Sous-titre (FR)</Label><Textarea value={form.subtitle} onChange={(e) => setForm({ ...form, subtitle: e.target.value })} rows={2} /></div>
              <div className="space-y-1.5"><Label>Sous-titre (EN)</Label><Textarea value={form.subtitleEn} onChange={(e) => setForm({ ...form, subtitleEn: e.target.value })} rows={2} /></div>
            </div>
            <ImageUploadField label="Image du slide" value={form.image || null} onChange={(v) => setForm({ ...form, image: v ?? '' })} />
            <div className="space-y-1.5"><Label>Lien (optionnel, ex. /catalogue)</Label><Input value={form.link} onChange={(e) => setForm({ ...form, link: e.target.value })} /></div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5"><Label>Ordre</Label><Input type="number" value={form.sortOrder} onChange={(e) => setForm({ ...form, sortOrder: e.target.value })} /></div>
              <label className="flex items-end gap-2 pb-1 text-sm"><Switch checked={form.active} onCheckedChange={(v) => setForm({ ...form, active: v })} /> Actif</label>
            </div>
            <Button type="submit" disabled={saving} className="w-full">{saving ? '…' : 'Enregistrer'}</Button>
          </form>
        </DialogContent>
      </Dialog>
    </AdminShell>
  )
}
