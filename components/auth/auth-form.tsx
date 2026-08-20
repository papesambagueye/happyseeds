'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Store } from 'lucide-react'
import { toast } from 'sonner'
import { useI18n } from '@/lib/i18n'
import { apiClient } from '@/lib/request'
import { setSessionToken } from '@/lib/auth/token-store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export function AuthForm({ mode }: { mode: 'login' | 'register' }) {
  const isLogin = mode === 'login'
  const { t } = useI18n()
  const router = useRouter()
  const searchParams = useSearchParams()
  const ref = searchParams.get('ref') ?? undefined
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [birthDate, setBirthDate] = useState('')
  const [referralCode, setReferralCode] = useState(ref ?? '')
  const [loading, setLoading] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const res = isLogin
      ? await apiClient.post('/api/auth/login', { email, password })
      : await apiClient.post('/api/auth/register', { email, password, name, birthDate: birthDate || undefined, ref: referralCode.trim() || undefined })
    setLoading(false)
    if (res.success) {
      const data = res.data as { token?: string } | undefined
      if (data?.token) setSessionToken(data.token)
      toast.success(isLogin ? 'Bienvenue !' : 'Compte créé !')
      router.push(isLogin ? '/' : '/compte')
      router.refresh()
    } else {
      toast.error(res.error || 'Une erreur est survenue')
    }
  }

  return (
    <div className="mx-auto mt-10 w-full max-w-md rounded-2xl border bg-card p-6 sm:p-8">
      <div className="mx-auto grid h-12 w-12 place-items-center rounded-xl bg-primary text-primary-foreground">
        <Store className="h-6 w-6" />
      </div>
      <h1 className="mt-4 text-center text-2xl font-bold">{isLogin ? t('login_title') : t('register_title')}</h1>
      <p className="mt-1 text-center text-sm text-muted-foreground">
        {isLogin ? t('login_sub') : t('register_sub')}
      </p>

      <form onSubmit={submit} className="mt-6 space-y-4">
        {!isLogin && ref && (
          <div className="flex items-center gap-2 rounded-lg bg-primary/5 p-2.5 text-sm text-primary">
            🎁 Code parrainage appliqué : <span className="font-semibold">{ref.toUpperCase()}</span>
          </div>
        )}
        {!isLogin && (
          <div className="space-y-1.5">
            <Label htmlFor="referral-code">Code de parrainage (facultatif)</Label>
            <Input id="referral-code" value={referralCode} onChange={(e) => setReferralCode(e.target.value.toUpperCase())} placeholder="Ex. TABC1234" autoComplete="off" />
            <p className="text-xs text-muted-foreground">Vous pouvez le demander à la personne qui vous a invité.</p>
          </div>
        )}
        {!isLogin && (
          <div className="space-y-1.5">
            <Label htmlFor="name">{t('register_name')}</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required minLength={2} autoComplete="name" />
          </div>
        )}
        {!isLogin && (
          <div className="space-y-1.5">
            <Label htmlFor="birth-date">Date d’anniversaire (facultatif)</Label>
            <Input id="birth-date" type="date" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} autoComplete="bday" />
            <p className="text-xs text-muted-foreground">Recevez 10 points le jour de votre anniversaire.</p>
          </div>
        )}
        <div className="space-y-1.5">
          <Label htmlFor="email">{t('login_email')}</Label>
          <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="password">{t('login_password')}</Label>
          <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} autoComplete={isLogin ? 'current-password' : 'new-password'} />
          {!isLogin && <p className="text-xs text-muted-foreground">8 caractères minimum.</p>}
        </div>
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? '…' : isLogin ? t('login_submit') : t('register_submit')}
        </Button>
      </form>

      <div className="mt-5 text-center text-sm">
        <Link href={isLogin ? '/register' : '/login'} className="font-medium text-primary hover:underline">
          {isLogin ? t('login_switch') : t('register_switch')}
        </Link>
      </div>
    </div>
  )
}
