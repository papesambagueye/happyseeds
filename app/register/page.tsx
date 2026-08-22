import { Suspense } from 'react'
import { AuthForm } from '@/components/auth/auth-form'
import { StoreShell } from '@/components/store/shell'

export default function RegisterPage() {
  return (
    <StoreShell auth>
      <div className="relative z-10 mx-auto max-w-5xl px-4 py-10">
        <Suspense fallback={<div className="mx-auto mt-10 w-full max-w-md rounded-2xl border bg-card p-6" /> }>
          <AuthForm mode="register" />
        </Suspense>
      </div>
    </StoreShell>
  )
}
