import type { MetadataRoute } from 'next'

const siteUrl = 'https://happyseeds-eight.vercel.app'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin', '/api', '/compte', '/commandes', '/parrainage'],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
  }
}
