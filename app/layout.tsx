import type { Metadata } from 'next'
import './globals.css'
import { I18nProvider } from '@/lib/i18n'
import { Toaster } from '@/components/ui/sonner'
import { RegisterServiceWorker } from '@/components/register-sw'

export const metadata: Metadata = {
  metadataBase: new URL('https://ndartech221.vercel.app'),
  title: {
    default: 'Tech221 | Boutique high-tech au Senegal',
    template: '%s | Tech221',
  },
  description: 'Tech221, votre boutique en ligne de smartphones, ordinateurs, audio et accessoires high-tech au Senegal.',
  applicationName: 'Tech221',
  keywords: ['Tech221', 'Tech 221', 'boutique high-tech', 'smartphones', 'ordinateurs', 'accessoires', 'Senegal'],
  manifest: '/manifest.webmanifest',
  themeColor: '#d90404',
  icons: {
    icon: [
      { url: '/diamant.png', rel: 'icon', type: 'image/png', sizes: '284x284' },
    ],
    shortcut: '/diamant.png',
    apple: '/diamant.png',
  },
  appleWebApp: {
    capable: true,
    title: 'Tech221',
    statusBarStyle: 'black-translucent',
  },
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'fr_SN',
    url: 'https://ndartech221.vercel.app/',
    siteName: 'Tech221',
    title: 'Tech221 | Boutique high-tech au Senegal',
    description: 'Smartphones, ordinateurs, audio et accessoires high-tech au meilleur prix.',
    images: [
      {
        url: '/diamant.png',
        width: 284,
        height: 284,
        alt: 'Tech221 logo',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Tech221 | Boutique high-tech au Senegal',
    description: 'Smartphones, ordinateurs, audio et accessoires high-tech au meilleur prix.',
    images: ['/diamant.png'],
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
      <head>
        <link rel="icon" href="/diamant.png" type="image/png" sizes="284x284" />
        <link rel="apple-touch-icon" href="/diamant.png" />
      </head>
      <body>
        <RegisterServiceWorker />
        <I18nProvider>
          {children}
          <Toaster richColors position="top-right" />
        </I18nProvider>
      </body>
    </html>
  )
}
