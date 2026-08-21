import type { MetadataRoute } from 'next'

const siteUrl = 'https://tech221.vercel.app'

export default function sitemap(): MetadataRoute.Sitemap {
  const routes = ['/', '/catalogue', '/promos', '/contact', '/login', '/register']

  return routes.map((route) => ({
    url: `${siteUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: route === '/' ? 'daily' : 'weekly',
    priority: route === '/' ? 1 : 0.7,
  }))
}
