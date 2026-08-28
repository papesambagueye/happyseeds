import 'server-only'
import { and, asc, desc, eq, ilike, or, sql } from 'drizzle-orm'
import { db } from '@/db'
import { categories, flashSales, products, promotions, slides, reviews } from '@/db/schemas/core'
import { attachFlashPrices, getPromotionPriceMap } from './rewards'

export async function getPublishedCategories(): Promise<Array<typeof categories.$inferSelect>> {
  return db
    .select()
    .from(categories)
    .orderBy(asc(categories.sortOrder))
}

export async function getActiveSlides() {
  return db
    .select()
    .from(slides)
    .where(eq(slides.active, 1))
    .orderBy(asc(slides.sortOrder))
}

export type StoreProduct = typeof products.$inferSelect & { isFlashSale: boolean; isPromotion: boolean }

async function attachPromotionPrices(rows: Array<typeof products.$inferSelect>) {
  const promotionPrices = await getPromotionPriceMap()
  return rows.map((product) => {
    const promotionalPrice = promotionPrices.get(product.id)
    if (promotionalPrice != null && promotionalPrice < product.price) {
      return { ...product, price: promotionalPrice, compareAtPrice: product.price, isPromotion: true }
    }
    return { ...product, isPromotion: false }
  })
}

export async function getPublishedProducts(limit?: number): Promise<StoreProduct[]> {
  const base = db
    .select()
    .from(products)
    .where(eq(products.published, 1))
    .orderBy(desc(products.createdAt))
  const rows = (limit ? (await base).slice(0, limit) : await base) as Array<typeof products.$inferSelect>
  return (await attachFlashPrices(await attachPromotionPrices(rows))) as StoreProduct[]
}

export async function getFeaturedProducts(limit = 6): Promise<StoreProduct[]> {
  const rows = (await db
    .select()
    .from(products)
    .where(sql`${products.featured} = 1 AND ${products.published} = 1`)
    .orderBy(desc(products.createdAt))
    .limit(limit)) as Array<typeof products.$inferSelect>
  return (await attachFlashPrices(await attachPromotionPrices(rows))) as StoreProduct[]
}

export async function getProductBySlug(slug: string) {
  const rows = await db.select().from(products).where(eq(products.slug, slug))
  return rows[0] ?? null
}

export type ProductWithCategory = {
  product: ((typeof products.$inferSelect) & { isFlashSale: boolean }) | null
  category: (typeof categories.$inferSelect) | null
  reviews: (typeof reviews.$inferSelect)[]
  averageRating: number
}

export async function getProductDetail(slug: string): Promise<ProductWithCategory> {
  const product = await getProductBySlug(slug)
  if (!product) return { product: null, category: null, reviews: [], averageRating: 0 }

  const category = product.categoryId
    ? await db
        .select()
        .from(categories)
        .where(eq(categories.id, product.categoryId))
        .then((row: Array<typeof categories.$inferSelect>) => row[0] ?? null)
    : null

  const reviewsList = await db
    .select()
    .from(reviews)
    .where(eq(reviews.productId, product.id))
    .orderBy(desc(reviews.createdAt))

  const avg = reviewsList.length
    ? reviewsList.reduce((sum: number, review: (typeof reviews.$inferSelect)) => sum + review.rating, 0) / reviewsList.length
    : 0

  const withFlash = await attachFlashPrices(await attachPromotionPrices([product]))
  return {
    product: withFlash[0],
    category,
    reviews: reviewsList,
    averageRating: avg,
  }
}

export async function searchProducts(query: {
  q?: string
  categoryId?: string
  min?: number
  max?: number
  sort?: 'newest' | 'price_asc' | 'price_desc'
}): Promise<StoreProduct[]> {
  const conditions = []
  if (query.q) {
    conditions.push(
      or(
        ilike(products.name, `%${query.q}%`),
        ilike(products.nameEn, `%${query.q}%`)
      )!
    )
  }
  if (query.categoryId) {
    conditions.push(eq(products.categoryId, query.categoryId))
  }
  if (query.min !== undefined) conditions.push(sql`${products.price} >= ${query.min}`)
  if (query.max !== undefined) conditions.push(sql`${products.price} <= ${query.max}`)

  const orderBy =
    query.sort === 'price_asc'
      ? asc(products.price)
      : query.sort === 'price_desc'
        ? desc(products.price)
        : desc(products.createdAt)

  let rows = (await db
    .select()
    .from(products)
    .where(and(...conditions))
    .orderBy(orderBy)) as Array<typeof products.$inferSelect>

  // Keep the storefront usable when existing admin products have not been published yet.
  if (rows.length === 0 && !query.q && !query.categoryId && query.min === undefined && query.max === undefined) {
    rows = (await db
      .select()
      .from(products)
      .orderBy(orderBy)) as Array<typeof products.$inferSelect>
  }

  return (await attachFlashPrices(await attachPromotionPrices(rows))) as StoreProduct[]
}

/** Active flash-sale products with sale price, for a "vente flash" page. */
export async function getFlashSaleProducts(): Promise<Array<{ flashSale: typeof flashSales.$inferSelect; product: StoreProduct }>> {
  const rows = await db
    .select({
      flashSale: flashSales,
      product: products,
    })
    .from(flashSales)
    .innerJoin(products, eq(flashSales.productId, products.id))
    .where(sql`
      ${flashSales.active} = 1
      AND ${flashSales.salePrice} > 0
      AND ${products.stock} > 0
      AND ${products.published} = 1
    `)
    .orderBy(desc(flashSales.createdAt))
    .limit(30)

  const now = new Date()
  const active = rows.filter((row: { flashSale: typeof flashSales.$inferSelect; product: typeof products.$inferSelect }) => {
    if (row.flashSale.startsAt && row.flashSale.startsAt > now) return false
    if (row.flashSale.endsAt && row.flashSale.endsAt < now) return false
    return true
  })

  return active.map((row: { flashSale: typeof flashSales.$inferSelect; product: typeof products.$inferSelect }) => ({
    flashSale: row.flashSale,
    product: {
      ...row.product,
      price: Math.min(row.flashSale.salePrice, row.product.price),
      compareAtPrice: row.product.price,
      isFlashSale: true,
      isPromotion: false,
    },
  }))
}

/** Published products with a regular crossed-out price, excluding flash sales. */
export async function getPromotionalProducts(): Promise<StoreProduct[]> {
  const rows = (await db
    .select({ product: products, promotion: promotions })
    .from(promotions)
    .innerJoin(products, eq(promotions.productId, products.id))
    .where(sql`${promotions.active} = 1 AND ${products.published} = 1`)
    .orderBy(desc(promotions.createdAt))) as Array<{
      product: typeof products.$inferSelect
      promotion: typeof promotions.$inferSelect
    }>
  const now = new Date()
  return rows
    .filter(({ promotion }) => (!promotion.startsAt || promotion.startsAt <= now) && (!promotion.endsAt || promotion.endsAt >= now))
    .map(({ product, promotion }) => ({
      ...product,
      price: Math.min(promotion.promotionalPrice, product.price),
      compareAtPrice: product.price,
      isFlashSale: false,
      isPromotion: true,
    })) as StoreProduct[]
}
