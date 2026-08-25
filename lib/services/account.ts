import 'server-only'
import { and, desc, eq, sql } from 'drizzle-orm'
import { db } from '@/db'
import { loyaltyEvents, orders, referralRewards } from '@/db/schemas/core'
import { countValidatedOrders } from './rewards'
import { getReferralOverview, listReferralRewards } from './referrals'
import { awardBirthdayBonus } from './rewards'
import { formatPrice } from '@/lib/utils'

/**
 * Aggregated summary for the storefront "Mon compte" loyalty dashboard.
 */
export async function getAccountSummary(userId: string) {
  await awardBirthdayBonus(userId)
  const validated = await countValidatedOrders(userId)

  const [eventsRes, ordersRes, referralOverview, referralRewardsList, bonusRes, pointsRes]: [
    Array<typeof loyaltyEvents.$inferSelect>,
    Array<{
      id: string
      orderNumber: string
      status: 'pending' | 'validated' | 'cancelled'
      total: number
      currency: string
      createdAt: Date
    }>,
    Awaited<ReturnType<typeof getReferralOverview>>,
    Awaited<ReturnType<typeof listReferralRewards>>,
    Array<{ amount: number }>,
    Array<{ total: number }>
  ] = await Promise.all([
    db
      .select()
      .from(loyaltyEvents)
      .where(and(eq(loyaltyEvents.userId, userId), sql`(${loyaltyEvents.expiresAt} IS NULL OR ${loyaltyEvents.expiresAt} > now())`))
      .orderBy(desc(loyaltyEvents.createdAt))
      .limit(20),
    db
      .select({
        id: orders.id,
        orderNumber: orders.orderNumber,
        status: orders.status,
        total: orders.total,
        currency: orders.currency,
        createdAt: orders.createdAt,
      })
      .from(orders)
      .where(eq(orders.userId, userId))
      .orderBy(desc(orders.createdAt))
      .limit(5),
    getReferralOverview(userId),
    listReferralRewards(userId),
    db
      .select({ amount: referralRewards.amount })
      .from(referralRewards)
      .where(eq(referralRewards.referrerId, userId)),
    db
      .select({ total: sql<number>`coalesce(sum(${loyaltyEvents.points}), 0)` })
      .from(loyaltyEvents)
      .where(and(eq(loyaltyEvents.userId, userId), sql`(${loyaltyEvents.expiresAt} IS NULL OR ${loyaltyEvents.expiresAt} > now())`)),
  ])

  const loyalty = { validatedOrders: validated, qualified: false }

  const earnedBonus = bonusRes.reduce((sum, row) => sum + row.amount, 0)

  return {
    loyalty,
    events: eventsRes.map((event) => ({
      id: event.id,
      type: event.type,
      points: event.points,
      label: event.label,
      createdAt: event.createdAt,
    })),
    orders: ordersRes.map((order) => ({
      ...order,
      totalFormatted: formatPrice(order.total, order.currency),
    })),
    referral: referralOverview,
    referralRewards: referralRewardsList,
    earnedBonus,
    points: Number(pointsRes[0]?.total ?? 0),
  }
}
