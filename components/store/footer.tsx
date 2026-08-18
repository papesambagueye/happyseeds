'use client'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { Store, MessageCircle } from 'lucide-react'
import { toast } from 'sonner'
import { useI18n } from '@/lib/i18n'
import { apiClient } from '@/lib/request'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export function Footer() {
  const { t, locale } = useI18n()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [year, setYear] = useState<number | null>(null)

  useEffect(() => {
    setYear(new Date().getFullYear())
  }, [])

  const subscribe = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const res = await apiClient.post('/api/newsletter', { email, locale })
    setLoading(false)
    if (res.success) {
      toast.success(locale === 'fr' ? 'Inscription confirmée !' : 'Subscribed!')
      setEmail('')
    } else {
      toast.error(res.error)
    }
  }

  return (
    <footer className="mt-16 border-t bg-card">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <div className="flex items-center gap-2 font-bold text-lg">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-primary text-primary-foreground">
              <Store className="h-5 w-5" />
            </span>
            TECH&nbsp;221
          </div>
          <p className="mt-3 text-sm text-muted-foreground">
            {locale === 'fr'
              ? 'Votre boutique en ligne de référence. Qualité, service et livraison en toute confiance.'
              : 'Your trusted online store. Quality, service and reliable delivery.'}
          </p>
        </div>

        <div>
          <h4 className="font-semibold">{locale === 'fr' ? 'Navigation' : 'Navigation'}</h4>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li><Link href="/" className="hover:text-primary">{t('nav_home')}</Link></li>
            <li><Link href="/catalogue" className="hover:text-primary">{t('nav_shop')}</Link></li>
            <li><Link href="/favoris" className="hover:text-primary">{t('nav_wishlist')}</Link></li>
            <li><Link href="/contact" className="hover:text-primary">{t('contact_title')}</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="font-semibold">{locale === 'fr' ? 'Assistance' : 'Support'}</h4>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li>
              <a href="https://wa.me/221787301886" target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 hover:text-primary">
                <MessageCircle className="h-4 w-4" /> WhatsApp
              </a>
            </li>
            <li>
              <Link href="/contact" className="hover:text-primary">{locale === 'fr' ? 'Nous écrire' : 'Contact us'}</Link>
            </li>
          </ul>
        </div>

        <div>
          <h4 className="font-semibold">{t('newsletter_title')}</h4>
          <p className="mt-2 text-sm text-muted-foreground">{t('newsletter_sub')}</p>
          <form onSubmit={subscribe} className="mt-3 flex gap-2">
            <Input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t('newsletter_placeholder')}
            />
            <Button type="submit" disabled={loading}>{t('newsletter_cta')}</Button>
          </form>
        </div>
      </div>
      <div className="border-t py-4 text-center text-xs text-muted-foreground">
        © {year ?? 2026} TECH&nbsp;221 · {t('footer_rights')}
      </div>
    </footer>
  )
}
