'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  Image as ImageIcon,
  MessageSquare,
  Mail,
  BarChart3,
  Settings,
  Store,
  ArrowLeft,
  LogOut,
  Zap,
  Gift,
  Share2,
} from 'lucide-react'
import { apiClient } from '@/lib/request'
import { setSessionToken } from '@/lib/auth/token-store'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'

type Me = { id: string; email: string; name: string | null; role: string } | null

const staffNav = [
  { href: '/admin', label: 'Tableau de bord', icon: LayoutDashboard },
  { href: '/admin/products', label: 'Produits', icon: Package },
  { href: '/admin/orders', label: 'Commandes', icon: ShoppingCart },
  { href: '/admin/promos', label: 'Ventes flash', icon: Zap },
  { href: '/admin/referrals', label: 'Parrainage', icon: Share2 },
  { href: '/admin/vouchers', label: 'Bons & fidélité', icon: Gift },
  { href: '/admin/slides', label: 'Slides pub', icon: ImageIcon },
  { href: '/admin/messages', label: 'Messages reçus', icon: MessageSquare },
  { href: '/admin/newsletter', label: 'Newsletter', icon: Mail },
  { href: '/admin/reports', label: 'Rapports', icon: BarChart3 },
]

const superadminNav = [
  { href: '/admin/users', label: 'Utilisateurs', icon: Users },
  { href: '/admin/settings', label: 'Paramètres', icon: Settings },
]

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [me, setMe] = useState<Me>(null)
  const [status, setStatus] = useState<'loading' | 'denied' | 'ok'>('loading')

  useEffect(() => {
    apiClient.get<Me>('/api/auth/me').then((res) => {
      if (res.success && res.data && (res.data.role === 'superadmin' || res.data.role === 'admin')) {
        setMe(res.data)
        setStatus('ok')
      } else {
        setStatus('denied')
      }
    })
  }, [])

  if (status === 'loading') {
    return <div className="min-h-screen bg-muted/30 p-6"><Skeleton className="h-10 w-64" /><Skeleton className="mt-6 h-64 w-full" /></div>
  }

  if (status === 'denied') {
    return (
      <div className="grid min-h-screen place-items-center bg-muted/30 p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Accès réservé</h1>
          <p className="mt-2 text-muted-foreground">Vous devez être administrateur pour accéder à cette page.</p>
          <Button asChild className="mt-6"><Link href="/login">Se connecter</Link></Button>
        </div>
      </div>
    )
  }

  const canAccessSettings = me?.role === 'superadmin' || me?.role === 'admin'
  const nav = [...staffNav, ...(canAccessSettings ? superadminNav : [])]

  const logout = async () => {
    await apiClient.post('/api/auth/logout', {})
    setSessionToken(null)
    router.push('/')
  }

  return (
    <div className="min-h-screen bg-[#F2F2F2] lg:flex">
      <aside className="glass-panel border-b lg:min-h-screen lg:w-72 lg:border-b-0 lg:border-r lg:rounded-r-[28px] lg:shadow-[0_20px_60px_rgba(0,0,0,0.08)]">
        <div className="flex items-center justify-between px-4 py-4 lg:py-5">
          <Link href="/admin" className="flex items-center gap-2 font-bold text-black">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-[#007BFF] text-white shadow-lg shadow-blue-500/25">
              <Store className="h-4 w-4" />
            </span>
            <span className="text-lg">Admin</span>
          </Link>
          <Link href="/" className="lg:hidden text-sm text-muted-foreground"><ArrowLeft className="h-5 w-5" /></Link>
        </div>
        <nav className="flex gap-1 overflow-x-auto px-2 pb-2 lg:flex-col lg:pb-4">
          {nav.map((item) => {
            const Icon = item.icon
            const active = item.href === '/admin' ? pathname === '/admin' : pathname.startsWith(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex shrink-0 items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium transition-all',
                  active
                    ? 'bg-[#007BFF] text-white shadow-lg shadow-blue-500/20'
                    : 'text-black hover:bg-white hover:text-[#007BFF]',
                )}
              >
                <Icon className="h-4 w-4" /> <span className="whitespace-nowrap">{item.label}</span>
              </Link>
            )
          })}
        </nav>
        <div className="hidden border-t border-[#D9D9D9] bg-white px-4 py-3 lg:block">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-semibold text-black">{me?.name ?? me?.email}</div>
              <div className="mt-1 inline-flex rounded-full border border-blue-200 bg-blue-50 px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.14em] text-[#007BFF]">
                {me?.role}
              </div>
            </div>
          </div>
          <div className="mt-3 flex gap-2">
            <Button asChild variant="outline" size="sm" className="flex-1"><Link href="/">Voir boutique</Link></Button>
            <Button variant="ghost" size="sm" onClick={logout} className="px-2"><LogOut className="h-4 w-4" /></Button>
          </div>
        </div>
      </aside>
      <main className="min-w-0 flex-1 p-4 lg:p-6">
        <div className="mx-auto min-w-0 max-w-7xl">{children}</div>
      </main>
    </div>
  )
}
