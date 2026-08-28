import 'server-only'
import { and, eq, sql } from 'drizzle-orm'
import { db } from '@/db'
import {
  flashSales,
  promotions,
  loyaltyEvents,
  orders,
  products,
  users,
  voucherRedemptions,
  vouchers,
} from '@/db/schemas/core'
import { AppError } from '@/lib/errors'

export const POINTS_REWARD_TARGET = 30
export const POINTS_PER_1000_FCFA = 1
export const SIGNUP_BONUS_POINTS = 5
export const FIRST_ORDER_BONUS_POINTS = 3
export const BIRTHDAY_BONUS_POINTS = 3
export const FIRST_ORDER_MINIMUM = 6500

// Loyalty: the first three validated orders qualify automatically. Later orders
// qualify only when their subtotal reaches the minimum threshold.
export const LOYALTY_FREE_ORDERS = 3
export const LOYALTY_DISCOUNT_PERCENT = 0
export const LOYALTY_MINIMUM_SUBTOTAL = 20_000

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
export async function getLoyaltyDiscount(userId: string | null | undefined, subtotal = 0) {
  if (!userId) return { qualified: false, percent: 0 }
  const validated = await countValidatedOrders(userId)
  if (validated >= LOYALTY_FREE_ORDERS && subtotal < LOYALTY_MINIMUM_SUBTOTAL) {
    return { qualified: false, percent: 0 }
  }
  return { qualified: true, percent: LOYALTY_DISCOUNT_PERCENT }
}

export async function recordLoyaltyEvent(input: {
  userId: string
  type: 'first_orders' | 'points' | 'voucher_bonus'
  points: number
  label: string
  orderId?: string
  expiresAt?: Date
}) {
  await db.insert(loyaltyEvents).values(input)
}

export async function awardSignupBonus(userId: string) {
  const existing = await db.select({ id: loyaltyEvents.id }).from(loyaltyEvents).where(and(
    eq(loyaltyEvents.userId, userId),
    eq(loyaltyEvents.label, 'Bonus inscription'),
  )).limit(1)
  if (existing.length > 0) return false
  await recordLoyaltyEvent({ userId, type: 'points', points: SIGNUP_BONUS_POINTS, label: 'Bonus inscription' })
  return true
}

export async function awardFirstOrderBonusOnValidation(orderId: string) {
  const rows = await db.select().from(orders).where(eq(orders.id, orderId)).limit(1)
  const order = rows[0]
  if (!order?.userId || order.status !== 'validated' || order.total < FIRST_ORDER_MINIMUM) return 0
  const first = await db.select({ id: orders.id }).from(orders).where(and(
    eq(orders.userId, order.userId), eq(orders.status, 'validated'),
  )).orderBy(orders.createdAt).limit(1)
  if (first[0]?.id !== order.id) return 0
  const existing = await db.select({ id: loyaltyEvents.id }).from(loyaltyEvents).where(and(
    eq(loyaltyEvents.userId, order.userId), eq(loyaltyEvents.label, 'Bonus première commande'),
  )).limit(1)
  if (existing.length > 0) return 0
  await recordLoyaltyEvent({ userId: order.userId, type: 'first_orders', points: FIRST_ORDER_BONUS_POINTS, label: 'Bonus première commande', orderId })
  return FIRST_ORDER_BONUS_POINTS
}

export async function awardBirthdayBonus(userId: string) {
  const userRows = await db.select({ birthDate: users.birthDate }).from(users).where(eq(users.id, userId)).limit(1)
  const birthDate = userRows[0]?.birthDate
  if (!birthDate) return false
  const today = new Date()
  const birthday = new Date(`${birthDate}T00:00:00`)
  if (Number.isNaN(birthday.getTime()) || birthday.getUTCMonth() !== today.getUTCMonth() || birthday.getUTCDate() !== today.getUTCDate()) return false
  const label = `Bonus anniversaire ${today.getUTCFullYear()}`
  const existing = await db.select({ id: loyaltyEvents.id }).from(loyaltyEvents).where(and(eq(loyaltyEvents.userId, userId), eq(loyaltyEvents.label, label))).limit(1)
  if (existing.length > 0) return false
  await recordLoyaltyEvent({ userId, type: 'points', points: BIRTHDAY_BONUS_POINTS, label })
  return true
}

/** Credit purchase points once, after an order has been validated. */
export async function awardPurchasePointsOnValidation(orderId: string) {
  const rows = await db.select().from(orders).where(eq(orders.id, orderId)).limit(1)
  const order = rows[0]
  if (!order?.userId || order.status !== 'validated') return 0

  const existing = await db
    .select({ id: loyaltyEvents.id })
    .from(loyaltyEvents)
    .where(and(eq(loyaltyEvents.orderId, orderId), eq(loyaltyEvents.type, 'points')))
    .limit(1)
  if (existing.length > 0) return 0

  const points = Math.floor(order.total / 1000) * POINTS_PER_1000_FCFA
  if (points <= 0) return 0

  await recordLoyaltyEvent({
    userId: order.userId,
    type: 'points',
    points,
    label: `Achat validé #${order.orderNumber}`,
    orderId,
  })
  return points
}

/** Active flash-sales resolved to a productId -> salePrice map. */
export async function getFlashSalePriceMap() {
  let rows: Array<{
    productId: string
    salePrice: number
    startsAt: Date | null
    endsAt: Date | null
  }> = []
  try {
    rows = await db
      .select({
        productId: flashSales.productId,
        salePrice: flashSales.salePrice,
        startsAt: flashSales.startsAt,
        endsAt: flashSales.endsAt,
      })
      .from(flashSales)
      .innerJoin(products, eq(flashSales.productId, products.id))
      .where(and(eq(flashSales.active, 1), sql`${products.stock} > 0`, sql`${flashSales.salePrice} > 0`))
  } catch (error) {
    console.error('[FLASH SALES PRICE READ ERROR]', error)
    return new Map<string, number>()
  }
  const now = new Date()
  const map = new Map<string, number>()
  for (const row of rows) {
    if (row.startsAt && row.startsAt > now) continue
    if (row.endsAt && row.endsAt < now) continue
    map.set(row.productId, row.salePrice)
  }
  return map
}

export async function getPromotionPriceMap() {
  let rows: Array<typeof promotions.$inferSelect>
  try {
    rows = await db
      .select()
      .from(promotions)
      .where(and(eq(promotions.active, 1), sql`${promotions.promotionalPrice} > 0`))
  } catch (error) {
    console.error('[PROMOTIONS READ ERROR]', error)
    return new Map<string, number>()
  }
  const now = new Date()
  const map = new Map<string, number>()
  for (const promotion of rows) {
    if (promotion.startsAt && promotion.startsAt > now) continue
    if (promotion.endsAt && promotion.endsAt < now) continue
    map.set(promotion.productId, promotion.promotionalPrice)
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
