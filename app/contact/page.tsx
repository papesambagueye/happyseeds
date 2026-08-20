'use client'

import { useState } from 'react'
import { StoreShell } from '@/components/store/shell'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { apiClient } from '@/lib/request'

export default function ContactPage() {
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' })

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    const res = await apiClient.post('/api/contact', form)
    setLoading(false)
    if (res.success) setSent(true)
    else setError(res.error)
  }

  return (
    <StoreShell>
      <div className="mx-auto max-w-3xl px-4 py-10">
        <h1 className="text-3xl font-bold">Nous contacter</h1>
        <p className="mt-2 text-muted-foreground">
          Vous avez une question sur un produit, une commande ou une livraison ?
        </p>

        <div className="mt-8 rounded-2xl border bg-card p-6">
          {sent ? (
            <div className="text-center">
              <p className="text-lg font-semibold">Message envoyé !</p>
              <p className="mt-2 text-sm text-muted-foreground">
                Nous vous répondrons rapidement par WhatsApp ou par e-mail.
              </p>
            </div>
          ) : (
            <form onSubmit={onSubmit} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium">Nom</label>
                    <Input placeholder="Votre nom" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">E-mail</label>
                    <Input type="email" placeholder="votre@email.com" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Objet</label>
                <Input placeholder="Objet du message" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} required />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Message</label>
                <Textarea rows={6} placeholder="Décrivez votre demande..." value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} required />
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <Button type="submit" disabled={loading} className="w-full sm:w-auto">{loading ? 'Envoi…' : 'Envoyer'}</Button>
            </form>
          )}
        </div>
      </div>
    </StoreShell>
  )
}
