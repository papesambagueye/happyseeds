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
import { REFERRAL_BONUS_POINTS } from './rewards'

// Reward granted to a referrer when a referred friend's first order is validated.
export const REFERRAL_BONUS_CENTS = 1000 // 10 FCFA by default — configurable via store_config
export const REFERRAL_VOUCHER_TITLE = 'Récompense parrainage'
export const AIRPOD_REFERRAL_THRESHOLD = 5
export const AIRPOD_MINIMUM_ORDER = 500000

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

  const qualifyingAirpodReferrals = await db
    .select({ id: referralRewards.id })
    .from(referralRewards)
    .innerJoin(orders, eq(referralRewards.orderId, orders.id))
    .where(and(eq(referralRewards.referrerId, userId), sql`${orders.total} >= ${AIRPOD_MINIMUM_ORDER}`))

  const owner = await db.select({ airpodRewardedAt: users.airpodRewardedAt }).from(users).where(eq(users.id, userId)).limit(1)

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
    qualifyingAirpodReferrals: qualifyingAirpodReferrals.length,
    airpodRewarded: Boolean(owner[0]?.airpodRewardedAt),
    airpodReferralThreshold: AIRPOD_REFERRAL_THRESHOLD,
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

  const previousRewards = await db
    .select({ id: referralRewards.id })
    .from(referralRewards)
    .where(eq(referralRewards.referrerId, referrerId))
    .limit(1)
  const isFirstReferral = previousRewards.length === 0

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

  if (isFirstReferral) {
    await db.insert(loyaltyEvents).values({
      userId: referrerId,
      type: 'voucher_bonus',
      points: REFERRAL_BONUS_POINTS,
      label: `Premier parrainage (${order.userId.slice(0, 8)})`,
      orderId,
    })
  }

  await awardAirpodReferralReward(referrerId)

  return { code, amount: REFERRAL_BONUS_CENTS, referrerId }
}

/** Grant one AirPod claim after five qualifying referred first orders. */
export async function awardAirpodReferralReward(referrerId: string) {
  const owner = await db.select({ airpodRewardedAt: users.airpodRewardedAt }).from(users).where(eq(users.id, referrerId)).limit(1)
  if (!owner[0] || owner[0].airpodRewardedAt) return false

  const qualifying = await db
    .select({ id: referralRewards.id })
    .from(referralRewards)
    .innerJoin(orders, eq(referralRewards.orderId, orders.id))
    .where(and(eq(referralRewards.referrerId, referrerId), sql`${orders.total} >= ${AIRPOD_MINIMUM_ORDER}`))
  if (qualifying.length < AIRPOD_REFERRAL_THRESHOLD) return false

  const updated = await db.update(users)
    .set({ airpodRewardedAt: sql`now()`, updatedAt: sql`now()` })
    .where(and(eq(users.id, referrerId), sql`${users.airpodRewardedAt} IS NULL`))
    .returning({ id: users.id })
  if (updated.length === 0) return false

  await db.insert(loyaltyEvents).values({
    userId: referrerId,
    type: 'voucher_bonus',
    points: 0,
    label: 'AirPod offert : 5 filleuls ont dépensé au moins 5 000 FCFA',
  })
  return true
}
