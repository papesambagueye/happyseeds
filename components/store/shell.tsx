import { Header } from '@/components/store/header'
import { Footer } from '@/components/store/footer'

export function StoreShell({ children, auth = false }: { children: React.ReactNode; auth?: boolean }) {
  return (
    <div className={`flex min-h-screen flex-col ${auth ? 'auth-layout' : ''}`}>
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  )
}
