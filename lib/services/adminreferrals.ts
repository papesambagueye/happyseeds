import 'server-only'
import { eq, sql } from 'drizzle-orm'
import { db } from '@/db'
import {
  loyaltyEvents,
  referralRewards,
  users,
  vouchers,
} from '@/db/schemas/core'

/** Aggregate referral overview for the admin dashboard. */
export async function getReferralDashboard() {
  // Every user with a referral code is a potential referrer.
  const referrers: Array<{
    id: string
    email: string
    name: string | null
    referralCode: string | null
  }> = await db
    .select({
      id: users.id,
      email: users.email,
      name: users.name,
      referralCode: users.referralCode,
    })
    .from(users)
    .where(sql`${users.referralCode} IS NOT NULL`)

  const rewards: Array<{
    referrerId: string
    amount: number
    voucherCode: string | null
  }> = await db
    .select({
      referrerId: referralRewards.referrerId,
      amount: referralRewards.amount,
      voucherCode: vouchers.code,
    })
    .from(referralRewards)
    .leftJoin(vouchers, eq(referralRewards.voucherId, vouchers.id))

  const rewardByReferrer = new Map<string, number>()
  const rewardCodes = new Map<string, string>()
  for (const row of rewards) {
    rewardByReferrer.set(row.referrerId, (rewardByReferrer.get(row.referrerId) ?? 0) + 1)
    rewardCodes.set(row.referrerId, row.voucherCode ?? '')
  }

  const rows: Array<{
    id: string
    email: string
    name: string | null
    referralCode: string | null
    rewardedCount: number
    rewardCode: string | null
  }> = referrers.map((user) => ({
    id: user.id,
    email: user.email,
    name: user.name,
    referralCode: user.referralCode,
    rewardedCount: rewardByReferrer.get(user.id) ?? 0,
    rewardCode: rewardCodes.get(user.id) ?? null,
  }))

  const totalRewards = rewards.length
  const pointRows = await db
    .select({ points: loyaltyEvents.points })
    .from(loyaltyEvents)
    .where(sql`${loyaltyEvents.type} = 'points' AND ${loyaltyEvents.points} > 0 AND ${loyaltyEvents.label} LIKE 'Bonus parrainage%'`)
  const totalRewardedPoints = pointRows.reduce((sum: number, row: { points: number }) => sum + row.points, 0)

  return {
    totalReferrers: rows.length,
    totalRewards,
    totalRewardedPoints,
    rows: rows.sort((a, b) => b.rewardedCount - a.rewardedCount),
  }
}
