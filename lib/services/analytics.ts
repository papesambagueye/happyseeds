import 'server-only'
import { desc, eq, sql } from 'drizzle-orm'
import { db } from '@/db'
import { orders, orderItems as oi, products, vouchers, referralRewards, loyaltyEvents } from '@/db/schemas/core'

export async function getDashboardStats(days = 7) {
  const now = new Date()
  const range = Math.min(Math.max(Number(days) || 7, 1), 90)
  const startMs = now.getTime() - (range - 1) * 86400000

  const orderStats = await db
    .select({
      total: sql<number>`coalesce(sum(case when ${orders.status} = 'validated' then ${orders.total} else 0 end), 0)`,
      pending: sql<number>`coalesce(sum(case when ${orders.status} = 'pending' then 1 else 0 end), 0)`,
      validated: sql<number>`coalesce(sum(case when ${orders.status} = 'validated' then 1 else 0 end), 0)`,
      cancelled: sql<number>`coalesce(sum(case when ${orders.status} = 'cancelled' then 1 else 0 end), 0)`,
      count: sql<number>`count(*)`,
    })
    .from(orders)

  const revenue = orderStats[0]

  // Revenue and orders for the requested range for the chart.
  const last7 = Array.from({ length: range }, (_, i) => {
    const d = new Date(now)
    d.setDate(d.getDate() - (range - 1 - i))
    return d.toISOString().slice(0, 10)
  })

  const dailyRows: Array<{ day: string; revenue: number; count: number }> = await db
    .select({
      day: sql<string>`to_char(${orders.createdAt}, 'YYYY-MM-DD')`,
      revenue: sql<number>`coalesce(sum(${orders.total}), 0)`,
      count: sql<number>`count(*)`,
    })
    .from(orders)
    .where(sql`${orders.status} = 'validated' AND ${orders.createdAt} >= ${new Date(startMs).toISOString()}`)
    .groupBy(sql`to_char(${orders.createdAt}, 'YYYY-MM-DD')`)

  const dailyMap = new Map<string, { day: string; revenue: number; count: number }>(
    dailyRows.map((row: { day: string; revenue: number; count: number }) => [row.day, row])
  )
  const empty: { day: string; revenue: number; count: number } = { day: '', revenue: 0, count: 0 }
  const daily = last7.map((day) => dailyMap.get(day) ?? { ...empty, day })

  // Low stock products.
  const lowStock = await db
    .select()
    .from(products)
    .where(sql`${products.stock} <= 5`)
    .orderBy(sql`${products.stock} asc`)

  // Popular products (top by quantity sold across validated orders).
  const popular = await db
    .select({
      name: oi.productName,
      quantity: sql<number>`coalesce(sum(${oi.quantity}), 0)`,
      revenue: sql<number>`coalesce(sum(${oi.quantity} * ${oi.unitPrice}), 0)`,
    })
    .from(oi)
    .innerJoin(orders, eq(oi.orderId, orders.id))
    .where(sql`${orders.status} = 'validated'`)
    .groupBy(oi.productName)
    .orderBy(sql`coalesce(sum(${oi.quantity}), 0) desc`)
    .limit(8)

  const topCategories = await db
    .select({
      categoryId: products.categoryId,
      quantity: sql<number>`coalesce(sum(${oi.quantity}), 0)`,
    })
    .from(oi)
    .innerJoin(products, eq(oi.productId, products.id))
    .where(sql`${products.categoryId} is not null`)
    .groupBy(products.categoryId)
    .orderBy(sql`coalesce(sum(${oi.quantity}), 0) desc`)
    .limit(6)

  // Loyalty / rewards overview.
  const [voucherStats, referralStats, loyaltyDiscount, loyaltyEventsCount] = await Promise.all([
    db.select({ count: sql<number>`count(*)`, total: sql<number>`coalesce(sum(${vouchers.usedCount}), 0)` }).from(vouchers),
    db.select({ count: sql<number>`count(*)`, total: sql<number>`coalesce(sum(${referralRewards.amount}), 0)` }).from(referralRewards),
    db
      .select({ total: sql<number>`coalesce(sum(${orders.discount}), 0)` })
      .from(orders)
      .where(sql`${orders.discount} > 0`).limit(1),
    db.select({ c: sql<number>`count(*)` }).from(loyaltyEvents),
  ])

  return {
    revenue: revenue.total,
    orderCount: revenue.count,
    pendingOrders: revenue.pending,
    validatedOrders: revenue.validated,
    cancelledOrders: revenue.cancelled,
    lowStockCount: lowStock.length,
    lowStock,
    daily,
    popular,
    topCategories,
    generatedAt: now.toISOString(),
    loyalty: {
      vouchersIssued: voucherStats[0]?.count ?? 0,
      voucherUses: voucherStats[0]?.total ?? 0,
      referralRewards: referralStats[0]?.count ?? 0,
      referralBonus: referralStats[0]?.total ?? 0,
      discountGiven: loyaltyDiscount[0]?.total ?? 0,
      loyaltyEventCount: loyaltyEventsCount[0]?.c ?? 0,
    },
  }
}

export async function getFinanceReport() {
  const rows = await db
    .select({
      orderNumber: orders.orderNumber,
      customerName: orders.customerName,
      customerPhone: orders.customerPhone,
      total: orders.total,
      currency: orders.currency,
      status: orders.status,
      createdAt: orders.createdAt,
    })
    .from(orders)
    .orderBy(desc(orders.createdAt))

  const raw = rows.map((row: typeof rows[number]) => ({
    'Numéro': row.orderNumber,
    'Client': row.customerName,
    'Téléphone': row.customerPhone,
    'Total': `${row.total.toLocaleString('fr-FR')} ${row.currency}`,
    'Statut': row.status,
    'Date': new Date(row.createdAt).toISOString().slice(0, 19).replace('T', ' '),
  }))
  return raw
}
