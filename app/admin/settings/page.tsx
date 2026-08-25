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
import { Textarea } from '@/components/ui/textarea'
import { Skeleton } from '@/components/ui/skeleton'
import { ImageUploadField } from '@/components/admin/image-upload-field'

type HomeContent = {
  bannerImage: string
  heroImage: string
  heroEyebrow: string
  heroTitle: string
  heroDescription: string
  heroButton: string
  promoButton: string
  benefits: Array<{ title: string; text: string }>
  categoriesTitle: string
  categoriesLink: string
  categories: Array<{ title: string; titleEn: string }>
  featuredTitle: string
  featuredLink: string
}

const defaultHomeContent: HomeContent = {
  bannerImage: '', heroImage: '', heroEyebrow: 'TECH 221', heroTitle: "La tech qu'on aime, au bon prix.",
  heroDescription: 'Smartphones, audio, accessoires et gadgets premium conçus pour faciliter votre quotidien.',
  heroButton: 'Découvrir la boutique', promoButton: 'Voir les promos',
  benefits: [
    { title: 'Livraison rapide', text: 'Expédition fiable et suivi simple.' },
    { title: 'Paiement sécurisé', text: 'Détails de commande envoyés via WhatsApp.' },
    { title: 'Produits sélectionnés', text: 'Une gamme pensée pour le quotidien et le style.' },
  ],
  categoriesTitle: 'Nos catégories', categoriesLink: 'Voir tout',
  categories: [
    { title: 'Téléphones', titleEn: 'Phones' }, { title: 'Accessoires', titleEn: 'Accessories' },
    { title: 'Audio', titleEn: 'Audio' }, { title: 'Ordinateurs', titleEn: 'Computers' },
  ],
  featuredTitle: 'Produits en vedette', featuredLink: 'Tout explorer',
}

export default function AdminSettings() {
  const [config, setConfig] = useState<Record<string, string> | null>(null)
  const [whatsapp, setWhatsapp] = useState('')
  const [siteName, setSiteName] = useState('')
  const [logo, setLogo] = useState<string | null>(null)
  const [homeContent, setHomeContent] = useState<HomeContent>(defaultHomeContent)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    apiClient.get<Record<string, string>>('/api/admin/config').then((res) => {
      if (res.success) {
        setConfig(res.data)
        setWhatsapp(res.data.whatsapp_number ?? '')
        setSiteName(res.data.site_name ?? '')
        setLogo(res.data.logo_url ?? null)
        try {
          setHomeContent({ ...defaultHomeContent, ...(res.data.home_content ? JSON.parse(res.data.home_content) : {}) })
        } catch { setHomeContent(defaultHomeContent) }
      }
    })
  }, [])

  const save = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    const payload: Record<string, string> = { whatsapp_number: whatsapp.trim() }
    if (siteName != null) payload.site_name = siteName.trim()
    payload.logo_url = logo ?? ''
    payload.home_content = JSON.stringify(homeContent)

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

          <Card className="space-y-4 p-5">
            <h2 className="font-semibold">Bannière au-dessus des avantages</h2>
            <ImageUploadField label="Image de la bannière" value={homeContent.bannerImage || null} onChange={(value) => setHomeContent({ ...homeContent, bannerImage: value ?? '' })} />
          </Card>

          <Card className="space-y-4 p-5">
            <h2 className="font-semibold">Façade : bloc principal</h2>
            <ImageUploadField label="Image principale" value={homeContent.heroImage || null} onChange={(value) => setHomeContent({ ...homeContent, heroImage: value ?? '' })} />
            <div className="space-y-1.5"><Label>Petit titre</Label><Input value={homeContent.heroEyebrow} onChange={(e) => setHomeContent({ ...homeContent, heroEyebrow: e.target.value })} /></div>
            <div className="space-y-1.5"><Label>Titre principal</Label><Input value={homeContent.heroTitle} onChange={(e) => setHomeContent({ ...homeContent, heroTitle: e.target.value })} /></div>
            <div className="space-y-1.5"><Label>Sous-titre principal</Label><Textarea value={homeContent.heroDescription} onChange={(e) => setHomeContent({ ...homeContent, heroDescription: e.target.value })} rows={3} /></div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5"><Label>Bouton principal</Label><Input value={homeContent.heroButton} onChange={(e) => setHomeContent({ ...homeContent, heroButton: e.target.value })} /></div>
              <div className="space-y-1.5"><Label>Bouton promotions</Label><Input value={homeContent.promoButton} onChange={(e) => setHomeContent({ ...homeContent, promoButton: e.target.value })} /></div>
            </div>
          </Card>

          <Card className="space-y-4 p-5">
            <h2 className="font-semibold">Façade : avantages</h2>
            {homeContent.benefits.map((benefit, index) => (
              <div key={index} className="grid gap-3 border-t pt-3 sm:grid-cols-2">
                <div className="space-y-1.5"><Label>Titre {index + 1}</Label><Input value={benefit.title} onChange={(e) => { const benefits = [...homeContent.benefits]; benefits[index] = { ...benefit, title: e.target.value }; setHomeContent({ ...homeContent, benefits }) }} /></div>
                <div className="space-y-1.5"><Label>Sous-titre {index + 1}</Label><Input value={benefit.text} onChange={(e) => { const benefits = [...homeContent.benefits]; benefits[index] = { ...benefit, text: e.target.value }; setHomeContent({ ...homeContent, benefits }) }} /></div>
              </div>
            ))}
          </Card>

          <Card className="space-y-4 p-5">
            <h2 className="font-semibold">Façade : catégories et produits</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5"><Label>Titre catégories</Label><Input value={homeContent.categoriesTitle} onChange={(e) => setHomeContent({ ...homeContent, categoriesTitle: e.target.value })} /></div>
              <div className="space-y-1.5"><Label>Lien catégories</Label><Input value={homeContent.categoriesLink} onChange={(e) => setHomeContent({ ...homeContent, categoriesLink: e.target.value })} /></div>
            </div>
            {homeContent.categories.map((category, index) => (
              <div key={index} className="grid gap-3 border-t pt-3 sm:grid-cols-2">
                <div className="space-y-1.5"><Label>Catégorie {index + 1} (FR)</Label><Input value={category.title} onChange={(e) => { const categories = [...homeContent.categories]; categories[index] = { ...category, title: e.target.value }; setHomeContent({ ...homeContent, categories }) }} /></div>
                <div className="space-y-1.5"><Label>Catégorie {index + 1} (EN)</Label><Input value={category.titleEn} onChange={(e) => { const categories = [...homeContent.categories]; categories[index] = { ...category, titleEn: e.target.value }; setHomeContent({ ...homeContent, categories }) }} /></div>
              </div>
            ))}
            <div className="grid gap-3 border-t pt-3 sm:grid-cols-2">
              <div className="space-y-1.5"><Label>Titre produits en vedette</Label><Input value={homeContent.featuredTitle} onChange={(e) => setHomeContent({ ...homeContent, featuredTitle: e.target.value })} /></div>
              <div className="space-y-1.5"><Label>Lien produits en vedette</Label><Input value={homeContent.featuredLink} onChange={(e) => setHomeContent({ ...homeContent, featuredLink: e.target.value })} /></div>
            </div>
          </Card>

          <Button type="submit" disabled={saving}><Save className="mr-2 h-4 w-4" /> Enregistrer</Button>
        </form>
      )}
    </AdminShell>
  )
}
