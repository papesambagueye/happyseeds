'use client'
import { useCallback, useEffect, useState } from 'react'
import { Plus, Pencil, Trash2, Gift } from 'lucide-react'
import { toast } from 'sonner'
import { AdminShell } from '@/components/admin/admin-shell'
import { apiClient } from '@/lib/request'
import { formatDate, formatPrice } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'

type Voucher = {
  id: string
  code: string
  type: 'percent' | 'fixed'
  amount: number
  maxUses: number
  usedCount: number
  active: number
  title: string | null
  expiresAt: string | null
  createdAt: string | Date
}

type RewardClaim = {
  id: string; clientName: string | null; email: string; phone: string | null; productName: string
  points: number; voucherCode: string; status: 'pending' | 'contacted' | 'claimed'; createdAt: string | Date
}

const emptyForm = { code: '', type: 'percent' as 'percent' | 'fixed', amount: '10', maxUses: '1', active: true, title: '', expiresAt: '' }

export default function AdminVouchers() {
  const [rows, setRows] = useState<Voucher[] | null>(null)
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<string | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(false)
  const [claims, setClaims] = useState<RewardClaim[]>([])

  const load = useCallback(async () => {
    setLoading(true)
    const res = await apiClient.get<Voucher[]>('/api/admin/vouchers')
    if (res.success) setRows(res.data)
    const claimsRes = await apiClient.get<RewardClaim[]>('/api/admin/rewards')
    if (claimsRes.success) setClaims(claimsRes.data)
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const openNew = () => { setEditing(null); setForm(emptyForm); setOpen(true) }
  const openEdit = (v: Voucher) => {
    setEditing(v.id)
    setForm({
      code: v.code,
      type: v.type,
      amount: String(v.amount),
      maxUses: String(v.maxUses),
      active: v.active === 1,
      title: v.title ?? '',
      expiresAt: v.expiresAt ? toLocal(v.expiresAt) : '',
    })
    setOpen(true)
  }

  const save = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    const payload = {
      id: editing ?? undefined,
      code: form.code,
      type: form.type,
      amount: Number(form.amount) || 0,
      maxUses: Number(form.maxUses) || 1,
      active: form.active ? 1 : 0,
      title: form.title || null,
      expiresAt: form.expiresAt ? form.expiresAt : null,
    }
    const res = await apiClient.post('/api/admin/vouchers', payload)
    setSaving(false)
    if (res.success) { toast.success(editing ? 'Bon mis à jour' : 'Code promo créé'); setOpen(false); load() }
    else toast.error(res.error)
  }

  const remove = async (id: string) => {
    if (!confirm('Supprimer ce code promo ?')) return
    const res = await apiClient.delete(`/api/admin/vouchers?id=${id}`)
    if (res.success) { toast.success('Code promo supprimé'); load() }
    else toast.error(res.error)
  }

  const updateClaim = async (id: string, status: RewardClaim['status']) => {
    const res = await apiClient.patch('/api/admin/rewards', { id, status })
    if (res.success) { toast.success('Statut du cadeau mis à jour'); load() } else toast.error(res.error)
  }

  const contactClaim = (claim: RewardClaim) => {
    if (!claim.phone) {
      toast.error('Aucun téléphone associé à ce gain.')
      return
    }
    const phone = claim.phone.replace(/\D/g, '')
    const message = `Bonjour ${claim.clientName ?? ''}, votre cadeau TECH 221 (${claim.productName}) est disponible. Votre code est ${claim.voucherCode}. Nous pouvons organiser le retrait ou la livraison.`
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, '_blank', 'noopener,noreferrer')
    updateClaim(claim.id, 'contacted')
  }

  return (
    <AdminShell>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Bons d&apos;achat &amp; fidélité</h1>
          <p className="mt-1 text-sm text-muted-foreground">{loading ? 'Chargement…' : `${rows?.length ?? 0} code(s) promo`}</p>
        </div>
        <Button onClick={openNew}><Plus className="mr-1 h-4 w-4" /> Nouveau code</Button>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <Card className="p-5 lg:col-span-2">
          <h2 className="font-semibold">Codes promo</h2>
          <div className="mt-3 overflow-hidden rounded-2xl border bg-card">
            <Table>
              <TableHeader>
                <TableRow><TableHead>Code</TableHead><TableHead>Réduction</TableHead><TableHead>Uses</TableHead><TableHead>Statut</TableHead><TableHead>Expire</TableHead><TableHead className="text-right">Actions</TableHead></TableRow>
              </TableHeader>
              <TableBody>
                {!rows ? (
                  <TableRow><TableCell colSpan={6} className="py-10 text-center text-muted-foreground">…</TableCell></TableRow>
                ) : rows.length === 0 ? (
                  <TableRow><TableCell colSpan={6} className="py-10 text-center text-muted-foreground">Aucun code promo.</TableCell></TableRow>
                ) : rows.map((v) => (
                  <TableRow key={v.id}>
                    <TableCell className="font-mono font-medium">{v.code}</TableCell>
                    <TableCell>{v.type === 'percent' ? `${v.amount}%` : formatPrice(v.amount, 'FCFA')}</TableCell>
                    <TableCell>{v.usedCount}{v.maxUses !== -1 ? `/${v.maxUses}` : '/∞'}</TableCell>
                    <TableCell>{v.active === 1 ? <Badge>Actif</Badge> : <Badge variant="secondary">Inactif</Badge>}</TableCell>
                    <TableCell>{v.expiresAt ? formatDate(v.expiresAt) : '—'}</TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-1">
                        <Button title="Modifier ce code" variant="ghost" size="icon" onClick={() => openEdit(v)}><Pencil className="h-4 w-4" /></Button>
                        <Button title="Supprimer ce code" variant="ghost" size="icon" onClick={() => remove(v.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex items-center gap-2 font-semibold"><Gift className="h-4 w-4 text-primary" /> Récompense fidélité</div>
          <p className="mt-2 text-sm text-muted-foreground">
            Chaque client bénéficie automatiquement d&apos;une <strong className="text-foreground">réduction de 10%</strong> sur ses <strong className="text-foreground">5 premières commandes</strong>.
          </p>
          <p className="mt-3 text-sm text-muted-foreground">
            Créez ensuite des codes promo à appliquer en caisse (pourcentage ou montant fixe). Chaque code ne peut être utilisé qu&apos;une fois par client.
          </p>
        </Card>
      </div>

      <Card className="mt-6 p-5">
        <h2 className="font-semibold">Cadeaux à remettre</h2>
        <p className="mt-1 text-sm text-muted-foreground">Après un échange de points, contactez le client et organisez le retrait ou la livraison.</p>
        <div className="mt-3 overflow-x-auto rounded-xl border">
          <Table>
            <TableHeader><TableRow><TableHead>Client</TableHead><TableHead>Cadeau</TableHead><TableHead>Points</TableHead><TableHead>Code</TableHead><TableHead>Statut</TableHead><TableHead>Actions</TableHead></TableRow></TableHeader>
            <TableBody>
              {claims.length === 0 ? <TableRow><TableCell colSpan={6} className="py-8 text-center text-muted-foreground">Aucun cadeau à remettre.</TableCell></TableRow> : claims.map((claim) => (
                <TableRow key={claim.id}>
                  <TableCell><div className="font-medium">{claim.clientName ?? '—'}</div><div className="text-xs text-muted-foreground">{claim.email}{claim.phone ? ` · ${claim.phone}` : ''}</div></TableCell>
                  <TableCell>{claim.productName}</TableCell>
                  <TableCell>{claim.points} Pts</TableCell>
                  <TableCell className="font-mono text-xs">{claim.voucherCode}</TableCell>
                  <TableCell><Badge variant={claim.status === 'claimed' ? 'default' : claim.status === 'contacted' ? 'secondary' : 'destructive'}>{claim.status === 'claimed' ? 'Remis' : claim.status === 'contacted' ? 'Contacté' : 'À contacter'}</Badge></TableCell>
                  <TableCell><div className="flex gap-2"><Button size="sm" variant="outline" onClick={() => contactClaim(claim)} disabled={!claim.phone}>Contacter</Button>{claim.status !== 'claimed' && <Button size="sm" onClick={() => updateClaim(claim.id, 'claimed')}>Marquer remis</Button>}</div></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing ? 'Modifier le code promo' : 'Nouveau code promo'}</DialogTitle></DialogHeader>
          <form onSubmit={save} className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5"><Label>Code</Label><Input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} placeholder="Ex. BIENVENUE10" required /></div>
              <div className="space-y-1.5"><Label>Type</Label>
                <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v as 'percent' | 'fixed' })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percent">Pourcentage (%)</SelectItem>
                    <SelectItem value="fixed">Montant fixe (FCFA)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5"><Label>{form.type === 'percent' ? 'Valeur (%)' : 'Montant (FCFA)'}</Label><Input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} required /></div>
              <div className="space-y-1.5"><Label>Nb d&apos;utilisations (-1 = illimité)</Label><Input type="number" value={form.maxUses} onChange={(e) => setForm({ ...form, maxUses: e.target.value })} /></div>
            </div>
            <div className="space-y-1.5"><Label>Titre / libellé (optionnel)</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Ex. Merci pour votre fidélité" /></div>
            <div className="space-y-1.5"><Label>Expire le (optionnel)</Label><Input type="datetime-local" value={form.expiresAt} onChange={(e) => setForm({ ...form, expiresAt: e.target.value })} /></div>
            <label className="flex items-center gap-2 text-sm"><Switch checked={form.active} onCheckedChange={(v) => setForm({ ...form, active: v })} /> Actif</label>
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
