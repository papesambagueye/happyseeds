'use client'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import {
  ShoppingCart,
  Heart,
  User,
  Search,
  Menu,
  X,
  Store,
  LogOut,
  LayoutDashboard,
} from 'lucide-react'
import { useI18n } from '@/lib/i18n'
import { useCart } from '@/lib/stores/cart'
import { apiClient } from '@/lib/request'
import { setSessionToken } from '@/lib/auth/token-store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

type Me = { id: string; email: string; name: string | null; role: string } | null

export function Header() {
  const { t, locale, setLocale } = useI18n()
  const cartCount = useCart((s) => s.count())
  const pathname = usePathname()
  const router = useRouter()
  const [me, setMe] = useState<Me>(null)
  const [loaded, setLoaded] = useState(false)
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [siteName, setSiteName] = useState<string | null>(null)
  const [logoUrl, setLogoUrl] = useState<string | null>(null)

  useEffect(() => {
    apiClient.get<Me>('/api/auth/me').then((res) => {
      if (res.success) setMe(res.data)
      setLoaded(true)
    })
  }, [pathname])

  useEffect(() => {
    // Fetch public shop config (site name, logo)
    apiClient.get<Record<string, string>>('/api/config').then((res) => {
      if (res.success && res.data) {
        setSiteName(res.data.site_name ?? null)
        setLogoUrl(res.data.logo_url ?? null)
      }
    })
  }, [])

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault()
    router.push(`/catalogue?q=${encodeURIComponent(query)}`)
    setOpen(false)
  }

  const logout = async () => {
    await apiClient.post('/api/auth/logout', {})
    setSessionToken(null)
    setMe(null)
    router.refresh()
  }

  const adminHref = me?.role === 'superadmin' || me?.role === 'admin' ? '/admin' : null

  return (
    <header
      className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur"
      style={{
        paddingTop: 'calc(env(safe-area-inset-top, 0px) + 0.25rem)',
        paddingLeft: 'calc(env(safe-area-inset-left, 0px) + 0.5rem)',
        paddingRight: 'calc(env(safe-area-inset-right, 0px) + 0.5rem)',
      }}
    >
      <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3">
        <Link href="/" className="flex items-center gap-2 font-bold text-lg">
          {logoUrl ? (
            <div className="relative h-9 w-9 overflow-hidden rounded-xl bg-transparent">
              <Image src={logoUrl} alt={siteName ?? 'Logo'} fill className="object-cover" unoptimized />
            </div>
          ) : (
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-primary text-primary-foreground">
              <Store className="h-5 w-5" />
            </span>
          )}
          <span>{siteName ?? 'TECH\u00A0221'}</span>
        </Link>

        <form onSubmit={submitSearch} className="ml-2 hidden flex-1 items-center gap-2 md:flex">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t('search_placeholder')}
              className="pl-9"
            />
          </div>
        </form>

        <div className="ml-auto flex items-center gap-1.5">
          <button
            onClick={() => setLocale(locale === 'fr' ? 'en' : 'fr')}
            className="rounded-md px-2 py-1 text-sm font-medium text-muted-foreground hover:bg-muted"
            aria-label="Toggle language"
          >
            {locale === 'fr' ? 'EN' : 'FR'}
          </button>

          <Link
            href="/favoris"
            className="relative grid h-9 w-9 place-items-center rounded-md hover:bg-muted"
            aria-label={t('nav_wishlist')}
          >
            <Heart className="h-5 w-5" />
          </Link>

          <Link
            href="/panier"
            className="relative grid h-9 w-9 place-items-center rounded-md hover:bg-muted"
            aria-label={t('cart_title')}
          >
            <ShoppingCart className="h-5 w-5" />
            {cartCount > 0 && (
              <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
                {cartCount}
              </span>
            )}
          </Link>

          {loaded ? (
            me ? (
              <div className="flex items-center gap-1">
                {adminHref && (
                  <Link href={adminHref} className="grid h-9 w-9 place-items-center rounded-md hover:bg-muted" aria-label={t('nav_admin')}>
                    <LayoutDashboard className="h-5 w-5" />
                  </Link>
                )}
                <Link href="/compte" className="hidden items-center gap-1.5 rounded-md px-2 py-1.5 text-sm hover:bg-muted sm:flex">
                  <User className="h-4 w-4" />
                  <span className="max-w-28 truncate">{me.name ?? me.email}</span>
                </Link>
                <button onClick={logout} className="grid h-9 w-9 place-items-center rounded-md hover:bg-muted" aria-label={t('nav_logout')}>
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <Button asChild variant="default" size="sm" className="hidden sm:inline-flex">
                <Link href="/login">{t('nav_login')}</Link>
              </Button>
            )
          ) : null}

          <button onClick={() => setOpen((v) => !v)} className="grid h-9 w-9 place-items-center rounded-md hover:bg-muted md:hidden" aria-label="Menu">
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      <div className="border-t px-4 py-2 md:hidden">
        <Link href="/catalogue" className="flex items-center justify-center gap-2 rounded-md bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground">
          <Store className="h-4 w-4" />
          Voir les produits
        </Link>
      </div>

      <nav className="hidden border-t md:flex">
        <div className="mx-auto flex max-w-7xl items-center gap-1 px-4 py-0.5 text-sm">
          <NavLink href="/" label={t('nav_home')} active={pathname === '/'} />
          <NavLink href="/catalogue" label={t('nav_shop')} active={pathname.startsWith('/catalogue')} />
          <NavLink href="/promos" label={t('nav_promos')} active={pathname.startsWith('/promos')} />
          {me && <NavLink href="/parrainage" label={t('nav_referral')} active={pathname.startsWith('/parrainage')} />}
          {me && <NavLink href="/commandes" label={t('nav_orders')} active={pathname.startsWith('/commandes')} />}
          <NavLink href="/contact" label={t('contact_title')} active={pathname.startsWith('/contact')} />
        </div>
      </nav>

      {open && (
        <div className="border-t bg-background p-4 md:hidden">
          <form onSubmit={submitSearch} className="mb-3">
            <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t('search_placeholder')} />
          </form>
          <div className="flex flex-col gap-1 text-sm">
            <MobileLink href="/" label={t('nav_home')} onNavigate={() => setOpen(false)} />
            <MobileLink href="/catalogue" label={t('nav_shop')} onNavigate={() => setOpen(false)} />
            <MobileLink href="/promos" label={t('nav_promos')} onNavigate={() => setOpen(false)} />
            {me && <MobileLink href="/parrainage" label={t('nav_referral')} onNavigate={() => setOpen(false)} />}
            {me && <MobileLink href="/commandes" label={t('nav_orders')} onNavigate={() => setOpen(false)} />}
            <MobileLink href="/contact" label={t('contact_title')} onNavigate={() => setOpen(false)} />
            <MobileLink href="/favoris" label={t('nav_wishlist')} onNavigate={() => setOpen(false)} />
            {me && <MobileLink href="/compte" label="Mon compte" onNavigate={() => setOpen(false)} />}
            {!me && (
              <div className="mt-2 flex gap-2">
                <Button asChild className="flex-1"><Link href="/login" onClick={() => setOpen(false)}>{t('nav_login')}</Link></Button>
                <Button asChild variant="outline" className="flex-1"><Link href="/register" onClick={() => setOpen(false)}>{t('nav_register')}</Link></Button>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  )
}

function NavLink({ href, label, active }: { href: string; label: string; active: boolean }) {
  return (
    <Link href={href} className={`rounded-md px-3 py-2 font-medium hover:bg-muted ${active ? 'text-primary' : ''}`}>
      {label}
    </Link>
  )
}

function MobileLink({ href, label, onNavigate }: { href: string; label: string; onNavigate: () => void }) {
  return (
    <Link href={href} onClick={onNavigate} className="rounded-md px-3 py-2 font-medium hover:bg-muted">
      {label}
    </Link>
  )
}
