'use client'
import { useCallback, useEffect, useState } from 'react'
import { Mail, MailOpen } from 'lucide-react'
import { AdminShell } from '@/components/admin/admin-shell'
import { SearchInput } from '@/components/admin/search-input'
import { apiClient } from '@/lib/request'
import { formatDate } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'

type Message = { id: string; name: string; email: string; subject: string; message: string; read: number; createdAt: string | Date }

export default function AdminMessages() {
  const [messages, setMessages] = useState<Message[]>([])
  const [open, setOpen] = useState(false)
  const [current, setCurrent] = useState<Message | null>(null)
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    const res = await apiClient.get<Message[]>(`/api/admin/messages${query ? `?q=${encodeURIComponent(query)}` : ''}`)
    if (res.success) setMessages(res.data)
    setLoading(false)
  }, [query])

  useEffect(() => { load() }, [load])

  const openMsg = async (m: Message) => {
    setCurrent(m); setOpen(true)
    if (m.read !== 1) {
      await apiClient.patch(`/api/admin/messages?id=${m.id}`, { read: 1 })
      load()
    }
  }

  const unread = messages.filter((m) => m.read !== 1).length

  return (
    <AdminShell>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Messages reçus</h1>
        <div className="flex items-center gap-3">
          {unread > 0 && <Badge className="bg-amber-500">{unread} non lu{unread > 1 ? 's' : ''}</Badge>}
          <SearchInput value={query} onSearch={setQuery} placeholder="Rechercher…" className="w-56 sm:w-72" />
        </div>
      </div>

      <div className="mt-4 text-sm text-muted-foreground">{loading ? 'Chargement…' : `${messages.length} message(s)`}</div>

      <div className="mt-2 space-y-2">
        {messages.length === 0 ? (
          <p className="py-10 text-center text-muted-foreground">{query ? 'Aucun message ne correspond à la recherche.' : 'Aucun message.'}</p>
        ) : messages.map((m) => (
          <button key={m.id} onClick={() => openMsg(m)}
            className="flex w-full min-w-0 items-center justify-between gap-3 rounded-xl border bg-card px-4 py-3 text-left hover:border-primary">
            <div className="flex items-center gap-3">
              {m.read === 1 ? <MailOpen className="h-5 w-5 text-muted-foreground" /> : <Mail className="h-5 w-5 text-primary" />}
              <div className="min-w-0">
                <div className="break-words font-medium">{m.subject} <span className="text-muted-foreground">— {m.name}</span></div>
                <div className="break-words text-sm text-muted-foreground">{m.email} · {formatDate(m.createdAt)}</div>
              </div>
            </div>
            {m.read !== 1 && <Badge variant="secondary">Non lu</Badge>}
          </button>
        ))}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{current?.subject}</DialogTitle></DialogHeader>
          {current && (
            <div className="space-y-4">
              <div className="rounded-lg bg-muted/50 p-3 text-sm">
                <div><strong>{current.name}</strong> · {current.email}</div>
                <div className="text-muted-foreground">Reçu le {formatDate(current.createdAt)}</div>
              </div>
              <p className="whitespace-pre-wrap text-sm leading-relaxed">{current.message}</p>
              <Button asChild variant="outline"><a href={`mailto:${current.email}`}>Répondre par e-mail</a></Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AdminShell>
  )
}
