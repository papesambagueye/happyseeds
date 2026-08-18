'use client'
import { Download } from 'lucide-react'
import { toast } from 'sonner'
import { AdminShell } from '@/components/admin/admin-shell'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

export default function AdminReports() {
  const download = async () => {
    try {
      const res = await fetch('/api/admin/reports', { credentials: 'include' })
      if (!res.ok) { toast.error('Impossible de générer le rapport'); return }
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'rapport_financier.csv'
      a.click()
      URL.revokeObjectURL(url)
      toast.success('Rapport téléchargé')
    } catch {
      toast.error('Erreur lors du téléchargement')
    }
  }

  return (
    <AdminShell>
      <h1 className="text-2xl font-bold">Rapports</h1>
      <p className="mt-1 text-sm text-muted-foreground">Exportez le rapport financier de vos commandes au format CSV.</p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <Card className="p-6">
          <h2 className="font-semibold">Rapport financier (CSV)</h2>
          <p className="mt-1 text-sm text-muted-foreground">Détail des commandes : date, numéro, client, statut, montant.</p>
          <Button onClick={download} className="mt-4"><Download className="mr-2 h-4 w-4" /> Télécharger le CSV</Button>
        </Card>
      </div>
    </AdminShell>
  )
}
