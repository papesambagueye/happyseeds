'use client'
import { useEffect, useState } from 'react'
import { Save } from 'lucide-react'
import { toast } from 'sonner'
import { AdminShell } from '@/components/admin/admin-shell'
import { apiClient } from '@/lib/request'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { ImageUploadField } from '@/components/admin/image-upload-field'

export default function AdminSettings() {
  const [config, setConfig] = useState<Record<string, string> | null>(null)
  const [whatsapp, setWhatsapp] = useState('')
  const [siteName, setSiteName] = useState('')
  const [logo, setLogo] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    apiClient.get<Record<string, string>>('/api/admin/config').then((res) => {
      if (res.success) {
        setConfig(res.data)
        setWhatsapp(res.data.whatsapp_number ?? '')
        setSiteName(res.data.site_name ?? '')
        setLogo(res.data.logo_url ?? null)
      }
    })
  }, [])

  const save = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    const payload: Record<string, string> = { whatsapp_number: whatsapp.trim() }
    if (siteName != null) payload.site_name = siteName.trim()
    payload.logo_url = logo ?? ''

    const res = await apiClient.put<Record<string, string>>('/api/admin/config', payload)
    setSaving(false)
    if (res.success) { toast.success('Configuration enregistrée'); setConfig(res.data); setSiteName(res.data.site_name ?? ''); setLogo(res.data.logo_url ?? null) }
    else toast.error(res.error)
  }

  return (
    <AdminShell>
      <h1 className="text-2xl font-bold">Paramètres de la boutique</h1>

      {!config ? (
        <div className="mt-6 space-y-3"><Skeleton className="h-12 w-full" /><Skeleton className="h-12 w-full" /></div>
      ) : (
        <form onSubmit={save} className="mt-6 max-w-xl space-y-4">
          <Card className="p-5 space-y-4">
            <h2 className="font-semibold">Informations générales</h2>
            <div className="space-y-1.5">
              <Label htmlFor="siteName">Nom du site</Label>
              <Input id="siteName" value={siteName} onChange={(e) => setSiteName(e.target.value)} placeholder="Nom de la boutique" />
            </div>

            <ImageUploadField label="Logo du site" value={logo} onChange={(v) => setLogo(v)} />
          </Card>

          <Card className="p-5">
            <h2 className="font-semibold">Commandes WhatsApp</h2>
            <p className="mt-1 text-sm text-muted-foreground">Numéro utilisé pour la validation des commandes par WhatsApp (format international, ex. 2376XXXXXXXX).</p>
            <div className="mt-3 space-y-1.5">
              <Label htmlFor="whatsapp">Numéro WhatsApp</Label>
              <Input id="whatsapp" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} placeholder="2376XXXXXXXX" />
            </div>
          </Card>

          <Button type="submit" disabled={saving}><Save className="mr-2 h-4 w-4" /> Enregistrer</Button>
        </form>
      )}
    </AdminShell>
  )
}
