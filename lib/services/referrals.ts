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
export const REFERRAL_BONUS_FCFA = 1000 // 1 000 FCFA by default — configurable via store_config
export const REFERRAL_VOUCHER_TITLE = 'Récompense parrainage'
export const REFERRAL_POINTS_TARGET = 10000
export const REFERRAL_POINTS_BONUS = 5
export const REFERRAL_SIGNUP_TARGET = 3
export const REFERRAL_SIGNUP_BONUS = 4
export const REFERRAL_RELAUNCH_TARGET = 5
export const REFERRAL_RELAUNCH_BONUS = 10

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

export async function awardReferralSignupMilestones(referrerId: string) {
  return db.transaction(async (tx: any) => {
    await tx.select({ id: users.id }).from(users).where(eq(users.id, referrerId)).for('update')
    const referred = await tx.select({ id: users.id }).from(users).where(eq(users.referredBy, referrerId))
    const existing = await tx.select({ label: loyaltyEvents.label }).from(loyaltyEvents).where(eq(loyaltyEvents.userId, referrerId)) as Array<{ label: string | null }>
    const labels = new Set(existing.map((event: { label: string | null }) => event.label))
    if (referred.length >= REFERRAL_SIGNUP_TARGET && !labels.has('Bonus parrainage : 3 filleuls inscrits')) {
      await tx.insert(loyaltyEvents).values({ userId: referrerId, type: 'points', points: REFERRAL_SIGNUP_BONUS, label: 'Bonus parrainage : 3 filleuls inscrits' })
    }
    return referred.length
  })
}

export async function awardReferralRelaunch(referrerId: string, redemptionId: string) {
  return db.transaction(async (tx: any) => {
    await tx.select({ id: users.id }).from(users).where(eq(users.id, referrerId)).for('update')
    const redemption = await tx.select({ createdAt: loyaltyEvents.createdAt }).from(loyaltyEvents).where(eq(loyaltyEvents.id, redemptionId)).limit(1)
    if (!redemption[0]) return false
    const label = `Relance parrainage cadeau ${redemptionId}`
    const existing = await tx.select({ id: loyaltyEvents.id }).from(loyaltyEvents).where(eq(loyaltyEvents.label, label)).limit(1)
    if (existing.length > 0) return false
    const balanceRows = await tx.select({ total: sql<number>`coalesce(sum(${loyaltyEvents.points}), 0)` }).from(loyaltyEvents).where(eq(loyaltyEvents.userId, referrerId))
    if (Number(balanceRows[0]?.total ?? 0) >= 10) return false
    const newReferrals = await tx.select({ id: users.id }).from(users).where(and(eq(users.referredBy, referrerId), sql`${users.createdAt} > ${redemption[0].createdAt}`))
    if (newReferrals.length < REFERRAL_RELAUNCH_TARGET) return false
    await tx.insert(loyaltyEvents).values({ userId: referrerId, type: 'points', points: REFERRAL_RELAUNCH_BONUS, label })
    return true
  })
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
  const earnedFcfa = rewards.reduce((sum: number, reward: { amount: number }) => sum + reward.amount, 0)

  return {
    code,
    link: `/register?ref=${code}`,
    referredCount: referred.length,
    rewardedCount: rewards.length,
    earnable,
    earnedFcfa,
    bonusFcfa: REFERRAL_BONUS_FCFA,
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
  return db.transaction(async (tx: any) => {
    const order = (await tx.select().from(orders).where(eq(orders.id, orderId)).limit(1))[0]
    if (!order?.userId || order.status !== 'validated') return false
    const referred = (await tx.select({ referredBy: users.referredBy }).from(users).where(eq(users.id, order.userId)).limit(1))[0]
    if (!referred?.referredBy) return false
    const first = (await tx.select({ id: orders.id }).from(orders).where(and(eq(orders.userId, order.userId), eq(orders.status, 'validated'))).orderBy(orders.createdAt).limit(1))[0]
    if (first?.id !== order.id) return false
    const code = `REF-${crypto.randomUUID().replace(/-/g, '').slice(0, 10).toUpperCase()}`
    const voucher = (await tx.insert(vouchers).values({ code, type: 'fixed', amount: REFERRAL_BONUS_FCFA, maxUses: 1, active: 1, title: REFERRAL_VOUCHER_TITLE }).returning({ id: vouchers.id }))[0]
    const reward = (await tx.insert(referralRewards).values({ referrerId: referred.referredBy, referredId: order.userId, orderId: order.id, voucherId: voucher.id, amount: REFERRAL_BONUS_FCFA }).onConflictDoNothing({ target: referralRewards.referredId }).returning({ id: referralRewards.id }))[0]
    if (!reward) await tx.delete(vouchers).where(eq(vouchers.id, voucher.id))
    return Boolean(reward)
  })
}

/** Award 5 points once when all referred users reach 10,000 FCFA cumulatively. */
export async function awardReferralPoints(referrerId: string, orderId: string) {
  return db.transaction(async (tx: any) => {
    await tx.select({ id: users.id }).from(users).where(eq(users.id, referrerId)).for('update')
    const label = 'Bonus parrainage : 3 filleuls et 10 000 FCFA cumulés'
    const existing = await tx.select({ id: loyaltyEvents.id }).from(loyaltyEvents).where(and(eq(loyaltyEvents.userId, referrerId), eq(loyaltyEvents.label, label))).limit(1)
    if (existing.length > 0) return false
    const totals = await tx.select({ total: sql<number>`coalesce(sum(${orders.total}), 0)` }).from(orders).innerJoin(users, eq(orders.userId, users.id)).where(and(eq(users.referredBy, referrerId), eq(orders.status, 'validated')))
    const referredCount = await tx.select({ count: sql<number>`count(*)` }).from(users).where(eq(users.referredBy, referrerId))
    if (Number(referredCount[0]?.count ?? 0) < 3 || Number(totals[0]?.total ?? 0) < 10000) return false
    await tx.insert(loyaltyEvents).values({ userId: referrerId, type: 'points', points: REFERRAL_POINTS_BONUS, label, orderId })
    return true
  })
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
