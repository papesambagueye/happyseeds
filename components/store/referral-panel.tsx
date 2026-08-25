'use client'

import { Copy, Gift, Share2 } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'

export function ReferralPanel({ code, link }: { code: string; link: string }) {
  const [copied, setCopied] = useState<'code' | 'link' | null>(null)

  const copy = async (value: string, kind: 'code' | 'link') => {
    await navigator.clipboard.writeText(value)
    setCopied(kind)
    toast.success(kind === 'code' ? 'Code copié.' : 'Lien copié.')
    window.setTimeout(() => setCopied(null), 1800)
  }

  return (
    <div className="space-y-5 rounded-2xl border bg-card p-6">
      <div className="flex gap-3">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary"><Gift className="h-5 w-5" /></div>
        <div>
          <h2 className="font-semibold">Comment ça marche ?</h2>
          <p className="mt-1 text-sm text-muted-foreground">Invitez 3 filleuls pour gagner 4 points, puis 5 points lorsque 3 filleuls cumulent 10 000 FCFA d’achats validés. Si vous échangez un cadeau et que votre solde tombe sous 10 points, 5 nouveaux filleuls via votre lien vous octroient directement 10 points.</p>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Step number="1" text="Copiez votre code ou votre lien." />
        <Step number="2" text="Votre proche l’utilise à l’inscription." />
        <Step number="3" text="Les paliers se déclenchent automatiquement à 3 filleuls." />
      </div>

      <div className="rounded-xl bg-primary/5 p-4">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-primary">Votre code de parrainage</p>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <p className="font-mono text-2xl font-bold tracking-[0.2em]">{code}</p>
          <Button type="button" size="sm" variant="outline" onClick={() => copy(code, 'code')}>
            <Copy className="mr-1 h-4 w-4" /> {copied === 'code' ? 'Copié' : 'Copier'}
          </Button>
        </div>
      </div>

      <div className="rounded-xl border p-4">
        <p className="text-sm font-medium">Lien d’invitation</p>
        <div className="mt-2 flex flex-col gap-2 sm:flex-row">
          <input readOnly value={link} aria-label="Lien d’invitation" className="h-10 min-w-0 flex-1 rounded-md border bg-background px-3 text-sm" />
          <Button type="button" onClick={() => copy(new URL(link, window.location.origin).toString(), 'link')}>
            <Share2 className="mr-1 h-4 w-4" /> {copied === 'link' ? 'Copié' : 'Copier le lien'}
          </Button>
        </div>
      </div>

      <p className="text-sm text-muted-foreground">Chaque commande validée rapporte 1 point par tranche de 1 000 FCFA. Après un cadeau, 5 nouveaux filleuls peuvent relancer le parrainage pour 10 points si votre solde est inférieur à 10.</p>
    </div>
  )
}

function Step({ number, text }: { number: string; text: string }) {
  return <div className="rounded-xl border p-3 text-sm"><span className="mr-2 inline-grid h-6 w-6 place-items-center rounded-full bg-primary text-xs font-bold text-primary-foreground">{number}</span>{text}</div>
}