import 'server-only'
import { eq, desc } from 'drizzle-orm'
import { db } from '@/db'
import { products, reviews } from '@/db/schemas/core'

export async function getProductReviews(productId: string) {
  return db
    .select()
    .from(reviews)
    .where(eq(reviews.productId, productId))
    .orderBy(desc(reviews.createdAt))
}

export async function createReview(input: {
  productId: string
  userId?: string | null
  authorName: string
  rating: number
  comment?: string
}) {
  // Ensure the product exists.
  const product = await db
    .select({ id: products.id })
    .from(products)
    .where(eq(products.id, input.productId))
  if (product.length === 0) throw new Error('PRODUCT_NOT_FOUND')

  const inserted = await db
    .insert(reviews)
    .values({
      productId: input.productId,
      userId: input.userId ?? null,
      authorName: input.authorName,
      rating: input.rating,
      comment: input.comment ?? null,
    })
    .returning()
  return inserted[0]
}

export async function listAllReviews() {
  return db.select().from(reviews).orderBy(desc(reviews.createdAt))
}
