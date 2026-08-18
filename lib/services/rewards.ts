import 'server-only'
import { and, eq, sql } from 'drizzle-orm'
import { db } from '@/db'
import {
  flashSales,
  loyaltyEvents,
  orders,
  voucherRedemptions,
  vouchers,
} from '@/db/schemas/core'
import { AppError } from '@/lib/errors'

// Loyalty: first 5 orders of a customer get 10% off automatically.
export const LOYALTY_FREE_ORDERS = 5
export const LOYALTY_DISCOUNT_PERCENT = 10

/** Number of validated orders a user already has. */
export async function countValidatedOrders(userId: string): Promise<number> {
  const rows = await db
    .select({ n: sql<number>`count(*)` })
    .from(orders)
    .where(and(eq(orders.userId, userId), eq(orders.status, 'validated')))
  return rows[0]?.n ?? 0
}

/**
 * Loyalty discount for the NEXT order: the user earns a 10% discount while their
 * validated order count is below LOYALTY_FREE_ORDERS.
 */
export async function getLoyaltyDiscount(userId: string | null | undefined) {
  if (!userId) return { qualified: false, percent: 0 }
  const validated = await countValidatedOrders(userId)
  if (validated >= LOYALTY_FREE_ORDERS) {
    return { qualified: false, percent: 0 }
  }
  return { qualified: true, percent: LOYALTY_DISCOUNT_PERCENT }
}

export async function recordLoyaltyEvent(input: {
  userId: string
  type: 'first_orders' | 'voucher_bonus'
  points: number
  label: string
  orderId?: string
}) {
  await db.insert(loyaltyEvents).values(input)
}

/** Active flash-sales resolved to a productId -> salePrice map. */
export async function getFlashSalePriceMap() {
  const rows = await db
    .select()
    .from(flashSales)
    .where(and(eq(flashSales.active, 1), sql`${flashSales.salePrice} > 0`))
  const now = new Date()
  const map = new Map<string, number>()
  for (const flashSale of rows) {
    if (flashSale.startsAt && flashSale.startsAt > now) continue
    if (flashSale.endsAt && flashSale.endsAt < now) continue
    map.set(flashSale.productId, flashSale.salePrice)
  }
  return map
}

/** The user's voucher redemption count for a given voucher. */
export async function userUsedVoucher(
  userId: string,
  voucherId: string
): Promise<boolean> {
  const rows = await db
    .select({ id: voucherRedemptions.id })
    .from(voucherRedemptions)
    .where(
      and(
        eq(voucherRedemptions.userId, userId),
        eq(voucherRedemptions.voucherId, voucherId)
      )
    )
    .limit(1)
  return rows.length > 0
}

/**
 * Validate a voucher code and compute the discount amount for a subtotal.
 * Throws AppError with a friendly French message when not usable.
 */
export async function validateVoucher(code: string, subtotal: number) {
  const trimmed = (code || '').trim().toUpperCase()
  if (!trimmed) throw new AppError('Veuillez saisir un code', 400)

  const rows = await db
    .select()
    .from(vouchers)
    .where(eq(vouchers.code, trimmed))
    .limit(1)
  const voucher = rows[0]
  if (!voucher) throw new AppError('Code promo invalide ou inconnu', 404)

  if (voucher.active !== 1) throw new AppError('Ce code promo est désactivé', 400)
  const now = new Date()
  if (voucher.expiresAt && voucher.expiresAt < now) {
    throw new AppError('Ce code promo a expiré', 400)
  }
  if (voucher.maxUses !== -1 && voucher.usedCount >= voucher.maxUses) {
    throw new AppError('Ce code promo a atteint son nombre maximal d’utilisations', 400)
  }

  const discount =
    voucher.type === 'percent'
      ? Math.round((subtotal * Math.min(voucher.amount, 100)) / 100)
      : Math.min(voucher.amount, subtotal)

  return { voucher, discount }
}

/** Persist a voucher redemption against an order. */
export async function redeemVoucher(input: {
  voucherId: string
  userId: string
  orderId: string
  discount: number
}) {
  await db.transaction(async (tx: any) => {
    await tx.insert(voucherRedemptions).values(input)
    await tx
      .update(vouchers)
      .set({ usedCount: sql`${vouchers.usedCount} + 1` })
      .where(eq(vouchers.id, input.voucherId))
  })
}

/** Effective (flash-sale) price of a batch of products, keyed by product id. */
export async function attachFlashPrices<T extends { id: string; price: number; compareAtPrice: number | null }>(
  items: T[]
) {
  const map = await getFlashSalePriceMap()
  return items.map((p) => {
    const salePrice = map.get(p.id)
    if (salePrice != null && salePrice < p.price) {
      return { ...p, price: salePrice, isFlashSale: true }
    }
    return { ...p, isFlashSale: false }
  }) as (T & { isFlashSale: boolean })[]
}

export async function getPublicVouchers() {
  const now = new Date()
  return db
    .select()
    .from(vouchers)
    .where(
      and(
        eq(vouchers.active, 1),
        sql`${vouchers.maxUses} = -1 OR ${vouchers.usedCount} < ${vouchers.maxUses}`,
        sql`(${vouchers.expiresAt} IS NULL OR ${vouchers.expiresAt} > ${now.toISOString()})`
      )
    )
    .orderBy(sql`${vouchers.createdAt} desc`)
    .limit(20)
}
