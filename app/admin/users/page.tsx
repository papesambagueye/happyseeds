'use client'
import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'
import { AdminShell } from '@/components/admin/admin-shell'
import { SearchInput } from '@/components/admin/search-input'
import { apiClient } from '@/lib/request'
import { formatDate } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'

type User = { id: string; email: string; name: string | null; role: 'superadmin' | 'admin' | 'user'; status: 'active' | 'suspended' | 'banned' | 'disabled'; suspensionUntil: string | Date | null; suspensionReason: string | null; createdAt: string | Date; orderCount: number }

export default function AdminUsers() {
  const [users, setUsers] = useState<User[] | null>(null)
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    const res = await apiClient.get<User[]>(`/api/admin/users${query ? `?q=${encodeURIComponent(query)}` : ''}`)
    if (res.success) setUsers(res.data)
    setLoading(false)
  }, [query])

  useEffect(() => { load() }, [load])

  const changeRole = async (id: string, role: string) => {
    const res = await apiClient.patch(`/api/admin/users?id=${id}`, { role })
    if (res.success) { toast.success('Rôle mis à jour'); load() }
    else toast.error(res.error)
  }

  const changeSanction = async (id: string, value: string) => {
    if (value === 'active') {
      const res = await apiClient.patch(`/api/admin/users?id=${id}`, { sanction: 'active' })
      if (res.success) { toast.success('Compte réactivé'); load() } else toast.error(res.error)
      return
    }
    const reason = window.prompt('Motif de la sanction (facultatif)') ?? ''
    const [sanction, duration] = value.split(':')
    const res = await apiClient.patch(`/api/admin/users?id=${id}`, { sanction, duration, reason })
    if (res.success) { toast.success(sanction === 'banned' ? 'Compte banni' : 'Compte suspendu'); load() } else toast.error(res.error)
  }

  return (
    <AdminShell>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Utilisateurs</h1>
          <p className="mt-1 text-sm text-muted-foreground">{loading ? 'Chargement…' : `${users?.length ?? 0} compte(s)`}</p>
        </div>
        <SearchInput value={query} onSearch={setQuery} placeholder="Rechercher (nom, e-mail)…" className="w-64 sm:w-80" />
      </div>

      <div className="mt-6 overflow-hidden rounded-2xl border bg-card">
        <Table>
          <TableHeader>
            <TableRow><TableHead>Utilisateur</TableHead><TableHead>E-mail</TableHead><TableHead>Rôle</TableHead><TableHead>Statut</TableHead><TableHead>Sanction</TableHead><TableHead>Commandes</TableHead><TableHead>Inscrit</TableHead></TableRow>
          </TableHeader>
          <TableBody>
            {!users ? (
              <TableRow><TableCell colSpan={7} className="py-10 text-center text-muted-foreground">…</TableCell></TableRow>
            ) : users.length === 0 ? (
              <TableRow><TableCell colSpan={7} className="py-10 text-center text-muted-foreground">{query ? 'Aucun utilisateur ne correspond à la recherche.' : 'Aucun utilisateur.'}</TableCell></TableRow>
            ) : users.map((u) => (
              <TableRow key={u.id}>
                <TableCell>{u.name ?? '—'}</TableCell>
                <TableCell>{u.email}</TableCell>
                <TableCell>
                  <Select value={u.role} onValueChange={(v) => changeRole(u.id, v)}>
                    <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="user">Client</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="superadmin">Superadmin</SelectItem>
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell>
                  {u.status === 'active' && <Badge>Actif</Badge>}
                  {u.status === 'suspended' && <Badge variant="secondary">Suspendu{u.suspensionUntil ? ` jusqu’au ${formatDate(u.suspensionUntil)}` : ''}</Badge>}
                  {(u.status === 'banned' || u.status === 'disabled') && <Badge variant="destructive">Banni</Badge>}
                </TableCell>
                <TableCell>
                  {u.role === 'superadmin' ? <span className="text-xs text-muted-foreground">Protégé</span> : (
                    <Select value={u.status === 'active' ? 'active' : u.status === 'banned' ? 'banned' : 'active'} onValueChange={(v) => changeSanction(u.id, v)}>
                      <SelectTrigger className="w-44"><SelectValue placeholder="Choisir" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Réactiver</SelectItem>
                        <SelectItem value="suspended:3_days">Suspendre 3 jours</SelectItem>
                        <SelectItem value="suspended:1_month">Suspendre 1 mois</SelectItem>
                        <SelectItem value="suspended:3_months">Suspendre 3 mois</SelectItem>
                        <SelectItem value="banned">Bannir définitivement</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                </TableCell>
                <TableCell>{u.orderCount}</TableCell>
                <TableCell>{formatDate(u.createdAt)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </AdminShell>
  )
}
