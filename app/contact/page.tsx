'use client'

import { useState } from 'react'
import { StoreShell } from '@/components/store/shell'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'

export default function ContactPage() {
  const [sent, setSent] = useState(false)

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setSent(true)
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
                  <Input placeholder="Votre nom" required />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">E-mail</label>
                  <Input type="email" placeholder="votre@email.com" required />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Objet</label>
                <Input placeholder="Objet du message" required />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Message</label>
                <Textarea rows={6} placeholder="Décrivez votre demande..." required />
              </div>
              <Button type="submit" className="w-full sm:w-auto">Envoyer</Button>
            </form>
          )}
        </div>
      </div>
    </StoreShell>
  )
}
