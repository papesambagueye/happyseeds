import 'server-only'
import { and, eq, sql } from 'drizzle-orm'
import { db } from '@/db'
import {
  loyaltyEvents,
  orders,
  referralRewards,
  users,
  vouchers,
} from '@/db/schemas/core'
import { AppError } from '@/lib/errors'
import { recordLoyaltyEvent } from './rewards'

// Reward granted to a referrer when a referred friend's first order is validated.
export const REFERRAL_BONUS_CENTS = 1000 // 10 FCFA by default — configurable via store_config
export const REFERRAL_VOUCHER_TITLE = 'Récompense parrainage'
export const REFERRAL_POINTS_TARGET = 600000
export const REFERRAL_POINTS_BONUS = 5

/** Deterministic, unique personal referral code from a user id. */
export function buildReferralCode(userId: string): string {
  const hex = userId.replace(/-/g, '')
  const n = BigInt('0x' + hex.slice(0, 14))
  return 'T' + n.toString(36).toUpperCase().padStart(8, '0')
}

/** Return the stored referral code for a user, generating & persisting it lazily. */
export async function ensureReferralCode(userId: string) {
  const rows = await db
    .select({ referralCode: users.referralCode })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1)
  if (rows.length === 0) throw new AppError('Utilisateur introuvable', 404)
  if (rows[0].referralCode) return rows[0].referralCode

  const code = buildReferralCode(userId)
  await db
    .update(users)
    .set({ referralCode: code, updatedAt: sql`now()` })
    .where(eq(users.id, userId))
    .catch(() => {})
  // Verify (unique index could collide in a vanishingly rare case).
  const verify = await db
    .select({ referralCode: users.referralCode })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1)
  return verify[0]?.referralCode ?? code
}

/** Find the referrer (their user id) for a given referral code. */
export async function getReferrerByCode(code: string): Promise<string | null> {
  const trimmed = (code || '').trim().toUpperCase()
  if (!trimmed) return null
  const rows = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.referralCode, trimmed))
    .limit(1)
  return rows[0]?.id ?? null
}

/** Attach a referral on signup (caller already validated the referrer exists). */
export async function attachReferral(userId: string, referrerId: string) {
  if (referrerId === userId) return
  await db
    .update(users)
    .set({ referredBy: referrerId, updatedAt: sql`now()` })
    .where(eq(users.id, userId))
}

/** Referral summary for the storefront "Parrainage" page of a logged-in user. */
export async function getReferralOverview(userId: string) {
  const me = await db
    .select({ referralCode: users.referralCode })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1)
  const code = me[0]?.referralCode ?? (await ensureReferralCode(userId))

  const referred = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.referredBy, userId))

  const rewards = await db
    .select({ amount: referralRewards.amount })
    .from(referralRewards)
    .where(eq(referralRewards.referrerId, userId))

  const qualifyingReferralTotal = await db
    .select({ total: sql<number>`coalesce(sum(${orders.total}), 0)` })
    .from(orders)
    .innerJoin(users, eq(orders.userId, users.id))
    .where(and(eq(users.referredBy, userId), eq(orders.status, 'validated')))

  const earnable = referred.length - rewards.length
  const earnedCents = rewards.reduce((sum: number, reward: { amount: number }) => sum + reward.amount, 0)

  return {
    code,
    link: `/register?ref=${code}`,
    referredCount: referred.length,
    rewardedCount: rewards.length,
    earnable,
    earnedCents,
    bonusCents: REFERRAL_BONUS_CENTS,
    qualifyingReferralTotal: Number(qualifyingReferralTotal[0]?.total ?? 0),
    referralPointsTarget: REFERRAL_POINTS_TARGET,
  }
}

export async function listReferralRewards(referrerId: string) {
  return db
    .select({
      id: referralRewards.id,
      amount: referralRewards.amount,
      referredId: referralRewards.referredId,
      referredEmail: users.email,
      referredName: users.name,
      createdAt: referralRewards.createdAt,
    })
    .from(referralRewards)
    .leftJoin(users, eq(referralRewards.referredId, users.id))
    .where(eq(referralRewards.referrerId, referrerId))
    .orderBy(sql`${referralRewards.createdAt} desc`)
}

/**
 * Award the referrer a bonus voucher when a referred user's first order is
 * validated. Idempotent per referred user.
 */
export async function awardReferralBonusOnValidation(orderId: string) {
  const orderRows = await db.select().from(orders).where(eq(orders.id, orderId)).limit(1)
  const order = orderRows[0]
  if (!order || !order.userId) return null

  // A reward only applies to the user's FIRST validated order.
  const firstValidated = await db
    .select({ id: orders.id })
    .from(orders)
    .where(and(eq(orders.userId, order.userId), eq(orders.status, 'validated')))
    .orderBy(orders.createdAt)
    .limit(1)
  if (firstValidated[0]?.id !== order.id) return null

  const referredRows = await db
    .select({ referredBy: users.referredBy })
    .from(users)
    .where(eq(users.id, order.userId))
    .limit(1)
  const referrerId = referredRows[0]?.referredBy
  if (!referrerId) return null

  const already = await db
    .select({ id: referralRewards.id })
    .from(referralRewards)
    .where(eq(referralRewards.referredId, order.userId))
    .limit(1)
  if (already.length > 0) return null

  // Generate a unique bonus voucher code.
  const code = `PARRAIN-${order.orderNumber.replace(/\D/g, '').slice(-6)}`
  const voucher = await db
    .insert(vouchers)
    .values({
      code,
      type: 'fixed',
      amount: REFERRAL_BONUS_CENTS,
      title: REFERRAL_VOUCHER_TITLE,
      maxUses: 1,
      active: 1,
    })
    .returning()

  await db.insert(referralRewards).values({
    referrerId,
    referredId: order.userId,
    orderId,
    voucherId: voucher[0].id,
    amount: REFERRAL_BONUS_CENTS,
  })

  return { code, amount: REFERRAL_BONUS_CENTS, referrerId }
}

/** Award 5 points once when all referred users reach 6,000 FCFA cumulatively. */
export async function awardReferralPoints(referrerId: string, orderId: string) {
  const existing = await db.select({ id: loyaltyEvents.id }).from(loyaltyEvents).where(and(
    eq(loyaltyEvents.userId, referrerId),
    eq(loyaltyEvents.label, 'Bonus parrainage : 6 000 FCFA cumulés par les filleuls'),
  )).limit(1)
  if (existing.length > 0) return false

  const totals = await db
    .select({ total: sql<number>`coalesce(sum(${orders.total}), 0)` })
    .from(orders)
    .innerJoin(users, eq(orders.userId, users.id))
    .where(and(eq(users.referredBy, referrerId), eq(orders.status, 'validated')))
  if (Number(totals[0]?.total ?? 0) < REFERRAL_POINTS_TARGET) return false

  await recordLoyaltyEvent({
    userId: referrerId,
    type: 'points',
    points: REFERRAL_POINTS_BONUS,
    label: 'Bonus parrainage : 6 000 FCFA cumulés par les filleuls',
    orderId,
  })
  return true
}

export async function awardReferralPointsForOrder(orderId: string) {
  const rows = await db
    .select({ referrerId: users.referredBy })
    .from(orders)
    .innerJoin(users, eq(orders.userId, users.id))
    .where(eq(orders.id, orderId))
    .limit(1)
  const referrerId = rows[0]?.referrerId
  if (!referrerId) return false
  return awardReferralPoints(referrerId, orderId)
}
