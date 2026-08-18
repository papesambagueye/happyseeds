'use client'
import { useCallback, useEffect, useState } from 'react'
import { AdminShell } from '@/components/admin/admin-shell'
import { SearchInput } from '@/components/admin/search-input'
import { apiClient } from '@/lib/request'
import { formatDate } from '@/lib/utils'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'

type Sub = { id: string; email: string; createdAt: string | Date; active: number }

export default function AdminNewsletter() {
  const [subs, setSubs] = useState<Sub[] | null>(null)
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    const res = await apiClient.get<Sub[]>(`/api/admin/newsletter${query ? `?q=${encodeURIComponent(query)}` : ''}`)
    if (res.success) setSubs(res.data)
    setLoading(false)
  }, [query])

  useEffect(() => { load() }, [load])

  return (
    <AdminShell>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Newsletter — abonnés</h1>
          <p className="mt-1 text-sm text-muted-foreground">{loading ? 'Chargement…' : `${subs?.length ?? 0} abonné(s)`}</p>
        </div>
        <SearchInput value={query} onSearch={setQuery} placeholder="Rechercher e-mail…" className="w-64 sm:w-80" />
      </div>

      <div className="mt-6 overflow-hidden rounded-2xl border bg-card">
        <Table>
          <TableHeader>
            <TableRow><TableHead>E-mail</TableHead><TableHead>Inscrit le</TableHead><TableHead>Statut</TableHead></TableRow>
          </TableHeader>
          <TableBody>
            {!subs ? (
              <TableRow><TableCell colSpan={3} className="py-10 text-center text-muted-foreground">…</TableCell></TableRow>
            ) : subs.length === 0 ? (
              <TableRow><TableCell colSpan={3} className="py-10 text-center text-muted-foreground">{query ? 'Aucun abonné ne correspond à la recherche.' : 'Aucun abonné.'}</TableCell></TableRow>
            ) : subs.map((s) => (
              <TableRow key={s.id}>
                <TableCell>{s.email}</TableCell>
                <TableCell>{formatDate(s.createdAt)}</TableCell>
                <TableCell>{s.active === 1 ? <Badge>Actif</Badge> : <Badge variant="secondary">Désactivé</Badge>}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </AdminShell>
  )
}
