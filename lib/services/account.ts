import 'server-only'
import { desc, eq } from 'drizzle-orm'
import { db } from '@/db'
import { loyaltyEvents, orders, referralRewards } from '@/db/schemas/core'
import {
  LOYALTY_DISCOUNT_PERCENT,
  LOYALTY_FREE_ORDERS,
  countValidatedOrders,
} from './rewards'
import { getReferralOverview, listReferralRewards } from './referrals'
import { formatPrice } from '@/lib/utils'

/**
 * Aggregated summary for the storefront "Mon compte" loyalty dashboard.
 */
export async function getAccountSummary(userId: string) {
  const validated = await countValidatedOrders(userId)

  const [eventsRes, ordersRes, referralOverview, referralRewardsList, bonusRes]: [
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
    Array<{ amount: number }>
  ] = await Promise.all([
    db
      .select()
      .from(loyaltyEvents)
      .where(eq(loyaltyEvents.userId, userId))
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
  ])

  const loyalty = {
    validatedOrders: validated,
    cap: LOYALTY_FREE_ORDERS,
    percent: LOYALTY_DISCOUNT_PERCENT,
    qualified: validated < LOYALTY_FREE_ORDERS,
    remaining: Math.max(0, LOYALTY_FREE_ORDERS - validated),
  }

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
  }
}
