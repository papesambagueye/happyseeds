/**
 * Demo data seeder for TECH 221.
 * Run with: pnpm db:seed
 */
import { config as loadEnv } from 'dotenv'
import { eq } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import { categories, products, slides, storeConfig, siteMessages, vouchers, promotions } from './schemas/core'

loadEnv({ path: '.env.local' })
loadEnv()
const DATABASE_URL = process.env.DATABASE_URL
if (!DATABASE_URL) {
  console.error('DATABASE_URL is not set')
  process.exit(1)
}
const client = postgres(DATABASE_URL, { prepare: false })
const db = drizzle(client)

async function seed() {
  console.log('Seeding catalog data...')

  const CATS = [
    { name: 'Téléphones', nameEn: 'Phones', slug: 'telephones', sortOrder: 1 },
    { name: 'Accessoires', nameEn: 'Accessories', slug: 'accessoires', sortOrder: 2 },
    { name: 'Son & Audio', nameEn: 'Audio', slug: 'son-audio', sortOrder: 3 },
    { name: 'Ordinateurs', nameEn: 'Computers', slug: 'ordinateurs', sortOrder: 4 },
  ]

  const catIds: Record<string, string> = {}
  for (const c of CATS) {
    const existing = await db.select().from(categories).where(eq(categories.slug, c.slug))
    if (existing.length > 0) {
      catIds[c.slug] = existing[0].id
      continue
    }
    const inserted = await db.insert(categories).values(c).returning({ id: categories.id })
    catIds[c.slug] = inserted[0].id
  }

  const PRODS = [
    {
      name: 'Écouteurs sans fil Pro', nameEn: 'Pro Wireless Earbuds', slug: 'ecouteurs-sans-fil-pro',
      description: "Son immersif, réduction de bruit active et 30h d'autonomie.",
      descriptionEn: 'Immersive sound, active noise cancellation and 30-hour battery.',
      categoryId: catIds['accessoires'], price: 25000, compareAtPrice: 35000, stock: 40, featured: 1,
      image: 'https://images.unsplash.com/photo-1606220945770-b5b6c2c55bf1?w=800',
    },
    {
      name: 'Smartphone Nova X5', nameEn: 'Smartphone Nova X5', slug: 'smartphone-nova-x5',
      description: 'Écran AMOLED 6,7", 256 Go, triple caméra 108 MP.',
      descriptionEn: '6.7" AMOLED, 256 GB, 108 MP triple camera.',
      categoryId: catIds['telephones'], price: 285000, compareAtPrice: 320000, stock: 12, featured: 1,
      image: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800',
    },
    {
      name: 'Enceinte Bluetooth Boom', nameEn: 'Bluetooth Boom Speaker', slug: 'enceinte-bluetooth-boom',
      description: 'Puissance 40 W, résistante à l’eau, profondeur de basses remarquable.',
      descriptionEn: '40 W power, water-resistant, remarkable bass depth.',
      categoryId: catIds['son-audio'], price: 45000, stock: 25, featured: 1,
      image: 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=800',
    },
    {
      name: 'Ordinateur portable Ultra', nameEn: 'Ultra Laptop', slug: 'ordinateur-portable-ultra',
      description: '16 Go de RAM, SSD 512 Go, 14 pouces Full HD.',
      descriptionEn: '16 GB RAM, 512 GB SSD, 14-inch Full HD.',
      categoryId: catIds['ordinateurs'], price: 750000, compareAtPrice: 820000, stock: 6, featured: 0,
      image: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=800',
    },
    {
      name: 'Montre connectée Fit', nameEn: 'Fit Smartwatch', slug: 'montre-connectee-fit',
      description: 'Suivi santé, GPS et batterie 10 jours.',
      descriptionEn: 'Health tracking, GPS and 10-day battery.',
      categoryId: catIds['accessoires'], price: 85000, stock: 18, featured: 0,
      image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800',
    },
    {
      name: 'Casque Studio ANC', nameEn: 'Studio ANC Headphones', slug: 'casque-studio-anc',
      description: 'Confort professionnel, codec haute résolution.',
      descriptionEn: 'Professional comfort, high-resolution codec.',
      categoryId: catIds['son-audio'], price: 120000, compareAtPrice: 145000, stock: 9, featured: 1,
      image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800',
    },
  ]

  for (const p of PRODS) {
    const existing = await db.select().from(products).where(eq(products.slug, p.slug))
    if (existing.length > 0) continue
    await db.insert(products).values(p)
  }

  const SLIDES = [
    {
      title: 'Nouvelles offres chaque semaine', titleEn: 'New deals every week',
      subtitle: 'Électroménager et high-tech au meilleur prix.', subtitleEn: 'Home and tech at the best price.',
      image: 'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=1200',
      link: '/catalogue', active: 1, sortOrder: 1,
    },
    {
      title: 'Profitez de la livraison rapide', titleEn: 'Enjoy fast delivery',
      subtitle: 'Commandez via WhatsApp et recevez vos produits rapidement.', subtitleEn: 'Order via WhatsApp and get your products fast.',
      image: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=1200',
      link: '/catalogue', active: 1, sortOrder: 2,
    },
  ]
  for (const s of SLIDES) {
    const existing = await db.select().from(slides).where(eq(slides.title, s.title))
    if (existing.length > 0) continue
    await db.insert(slides).values(s)
  }

  const cfg = await db.select().from(storeConfig)
  if (cfg.length === 0) {
    await db.insert(storeConfig).values({ key: 'whatsapp_number', value: '221787301886' })
    await db.insert(storeConfig).values({ key: 'store_name', value: 'TECH 221' })
  }

  const msgExists = await db.select().from(siteMessages).limit(1)
  if (msgExists.length === 0) {
    await db.insert(siteMessages).values({
      name: 'Cliente test',
      email: 'client@example.com',
      subject: 'Question sur la livraison',
      message: 'Bonjour, livrez-vous partout ? Merci.',
    })
  }

  // Demo promo code (percent, unlimited)
  const voucherExists = await db.select().from(vouchers).where(eq(vouchers.code, 'WELCOME10'))
  if (voucherExists.length === 0) {
    await db.insert(vouchers).values({
      code: 'WELCOME10',
      type: 'percent',
      amount: 10,
      title: 'Bienvenue - 10% de réduction',
      maxUses: -1,
      active: 1,
    })
  }

  // Demo promotions apply to normal catalogue products.
  const promotionTargets: Array<{ slug: string; promotionalPrice: number; endsAt: Date }> = [
    { slug: 'ecouteurs-sans-fil-pro', promotionalPrice: 19000, endsAt: new Date(Date.now() + 3 * 86400000) },
    { slug: 'casque-studio-anc', promotionalPrice: 95000, endsAt: new Date(Date.now() + 2 * 86400000 + 5 * 3600000) },
  ]
  for (const t of promotionTargets) {
    const p = await db.select().from(products).where(eq(products.slug, t.slug))
    if (p.length === 0) continue
    const existing = await db.select().from(promotions).where(eq(promotions.productId, p[0].id))
    if (existing.length === 0) {
      await db.insert(promotions).values({
        productId: p[0].id,
        promotionalPrice: t.promotionalPrice,
        active: 1,
        endsAt: t.endsAt,
      })
    } else {
      // Ensure a timer is set on existing demo rows too.
      await db.update(promotions).set({ endsAt: t.endsAt }).where(eq(promotions.id, existing[0].id))
    }
  }

  console.log('Seed complete.')
}

seed()
  .catch((err) => {
    console.error('Seed failed:', err)
    process.exit(1)
  })
  .finally(() => client.end())
