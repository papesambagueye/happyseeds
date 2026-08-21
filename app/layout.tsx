import type { Metadata } from 'next'
import './globals.css'
import { I18nProvider } from '@/lib/i18n'
import { Toaster } from '@/components/ui/sonner'

export const metadata: Metadata = {
  metadataBase: new URL('https://happyseeds-eight.vercel.app'),
  title: {
    default: 'Tech221 | Boutique high-tech au Senegal',
    template: '%s | Tech221',
  },
  description: 'Tech221, votre boutique en ligne de smartphones, ordinateurs, audio et accessoires high-tech au Senegal.',
  applicationName: 'Tech221',
  keywords: ['Tech221', 'Tech 221', 'boutique high-tech', 'smartphones', 'ordinateurs', 'accessoires', 'Senegal'],
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'fr_SN',
    url: 'https://happyseeds-eight.vercel.app/',
    siteName: 'Tech221',
    title: 'Tech221 | Boutique high-tech au Senegal',
    description: 'Smartphones, ordinateurs, audio et accessoires high-tech au meilleur prix.',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body>
        <I18nProvider>
          {children}
          <Toaster richColors position="top-right" />
        </I18nProvider>
      </body>
    </html>
  )
}
