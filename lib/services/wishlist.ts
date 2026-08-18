import 'server-only'
import { and, eq, desc } from 'drizzle-orm'
import { db } from '@/db'
import { products, wishlistItems } from '@/db/schemas/core'

export async function listWishlist(userId: string) {
  return db
    .select({
      wishlistId: wishlistItems.id,
      createdAt: wishlistItems.createdAt,
      product: products,
    })
    .from(wishlistItems)
    .innerJoin(products, eq(wishlistItems.productId, products.id))
    .where(eq(wishlistItems.userId, userId))
    .orderBy(desc(wishlistItems.createdAt))
}

export async function addToWishlist(userId: string, productId: string) {
  await db
    .insert(wishlistItems)
    .values({ userId, productId })
    .onConflictDoNothing()
}

export async function removeFromWishlist(userId: string, productId: string) {
  await db
    .delete(wishlistItems)
    .where(
      and(
        eq(wishlistItems.userId, userId),
        eq(wishlistItems.productId, productId)
      )
    )
}

export async function hasWishlisted(userId: string, productId: string) {
  const rows = await db
    .select({ id: wishlistItems.id })
    .from(wishlistItems)
    .where(
      and(
        eq(wishlistItems.userId, userId),
        eq(wishlistItems.productId, productId)
      )
    )
  return rows.length > 0
}
