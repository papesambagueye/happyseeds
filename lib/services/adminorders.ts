import 'server-only'
import { desc, eq, ilike, or, sql } from 'drizzle-orm'
import { db } from '@/db'
import { orderItems, orders, products, storeConfig } from '@/db/schemas/core'
import { AppError } from '@/lib/errors'
import { awardReferralBonusOnValidation, awardReferralPointsForOrder } from './referrals'
import { awardFirstOrderBonusOnValidation, awardPurchasePointsOnValidation } from './rewards'

export async function listAdminOrders(status?: string, q?: string) {
  const term = q?.trim()
  let base = db
    .select({
      id: orders.id,
      orderNumber: orders.orderNumber,
      userId: orders.userId,
      customerName: orders.customerName,
      customerPhone: orders.customerPhone,
      itemSummary: orders.itemSummary,
      total: orders.total,
      currency: orders.currency,
      status: orders.status,
      createdAt: orders.createdAt,
      updatedAt: orders.updatedAt,
    })
    .from(orders)

  const allowed = ['pending', 'validated', 'cancelled', 'on_hold']
  if (status && allowed.includes(status)) {
    base = base.where(eq(orders.status, status as 'pending' | 'validated' | 'cancelled' | 'on_hold')) as typeof base
  }
  if (term) {
    const pattern = `%${term}%`
    base = base.where(
      or(
        ilike(orders.customerName, pattern),
        ilike(orders.customerPhone, pattern),
        ilike(orders.orderNumber, pattern),
        ilike(orders.id, pattern)
      )
    ) as typeof base
  }
  return base.orderBy(desc(orders.createdAt))
}

async function upsertTurnover(tx: any, amount: number) {
  // store_config stores values as text; keep turnover in cents under key 'turnover_cents'
  const rows = await tx.select().from(storeConfig).where(eq(storeConfig.key, 'turnover_cents'))
  if (rows.length > 0) {
    const current = Number(rows[0].value || 0)
    const next = current + amount
    await tx.update(storeConfig).set({ value: String(next), updatedAt: sql`now()` }).where(eq(storeConfig.key, 'turnover_cents'))
  } else {
    await tx.insert(storeConfig).values({ key: 'turnover_cents', value: String(amount) })
  }
}

export async function validateOrder(orderId: string) {
  const rows = await db.transaction(async (tx: any) => {
    const orderRows = await tx
      .select()
      .from(orders)
      .where(eq(orders.id, orderId))
      .for('update')
    if (orderRows.length === 0) throw new AppError('Commande introuvable', 404, 'NOT_FOUND')
    const order = orderRows[0]

    const items = await tx
      .select()
      .from(orderItems)
      .where(eq(orderItems.orderId, order.id))

    if (order.status === 'pending' || order.status === 'on_hold') {
      // Validation confirms payment → decrement stock (already reserved at order
      // time; here we simply confirm status) and increment turnover.
      await tx.update(orders).set({ status: 'validated', updatedAt: sql`now()` }).where(eq(orders.id, order.id))
      await upsertTurnover(tx, Number(order.total) || 0)
    }

    return { order, items }
  })
  // Award referral bonus (outside the tx, once per referred user's first order).
  try {
    await awardReferralBonusOnValidation(orderId)
    await awardReferralPointsForOrder(orderId)
    await awardPurchasePointsOnValidation(orderId)
    await awardFirstOrderBonusOnValidation(orderId)
  } catch (err) {
    console.error('Referral bonus failed for order', orderId, err)
  }
  return rows
}

export async function updateOrderStatus(orderId: string, nextStatus: 'pending' | 'validated' | 'cancelled' | 'on_hold') {
  const result = await db.transaction(async (tx: any) => {
    const rows = await tx.select().from(orders).where(eq(orders.id, orderId)).for('update')
    if (rows.length === 0) throw new AppError('Commande introuvable', 404, 'NOT_FOUND')
    const order = rows[0]
    const previousStatus = order.status as 'pending' | 'validated' | 'cancelled' | 'on_hold'
    if (previousStatus === nextStatus) return order

    const items = await tx.select().from(orderItems).where(eq(orderItems.orderId, orderId))
    if (previousStatus === 'cancelled' && nextStatus !== 'cancelled') {
      for (const item of items) {
        if (!item.productId) continue
        const productRows = await tx.select({ stock: products.stock }).from(products).where(eq(products.id, item.productId)).for('update')
        if (productRows.length === 0 || productRows[0].stock < item.quantity) {
          throw new AppError(`Stock insuffisant pour « ${item.productName} »`, 409)
        }
        await tx.update(products).set({ stock: sql`${products.stock} - ${item.quantity}` }).where(eq(products.id, item.productId))
      }
    } else if (previousStatus !== 'cancelled' && nextStatus === 'cancelled') {
      for (const item of items) {
        if (item.productId) {
          await tx.update(products).set({ stock: sql`${products.stock} + ${item.quantity}` }).where(eq(products.id, item.productId))
        }
      }
    }

    if (previousStatus !== 'validated' && nextStatus === 'validated') {
      await upsertTurnover(tx, Number(order.total) || 0)
    } else if (previousStatus === 'validated' && nextStatus !== 'validated') {
      const cfg = await tx.select().from(storeConfig).where(eq(storeConfig.key, 'turnover_cents'))
      if (cfg.length > 0) {
        const nextTurnover = Math.max(0, Number(cfg[0].value || 0) - Number(order.total || 0))
        await tx.update(storeConfig).set({ value: String(nextTurnover), updatedAt: sql`now()` }).where(eq(storeConfig.key, 'turnover_cents'))
      }
    }

    const updated = await tx.update(orders).set({ status: nextStatus, updatedAt: sql`now()` }).where(eq(orders.id, orderId)).returning()
    return updated[0]
  })

  if (nextStatus === 'validated') {
    try {
      await awardReferralBonusOnValidation(orderId)
      await awardReferralPointsForOrder(orderId)
      await awardPurchasePointsOnValidation(orderId)
      await awardFirstOrderBonusOnValidation(orderId)
    } catch (error) {
      console.error('Referral bonus failed for order', orderId, error)
    }
  }
  return result
}

export async function holdOrder(orderId: string) {
  const orderRows = await db.select().from(orders).where(eq(orders.id, orderId))
  if (orderRows.length === 0) throw new AppError('Commande introuvable', 404, 'NOT_FOUND')
  const order = orderRows[0]
  if (order.status === 'pending') {
    await db.update(orders).set({ status: 'on_hold', updatedAt: sql`now()` }).where(eq(orders.id, order.id))
  }
  return { held: true }
}

export async function cancelOrder(orderId: string) {
  const orderRows = await db.select().from(orders).where(eq(orders.id, orderId))
  if (orderRows.length === 0) throw new AppError('Commande introuvable', 404, 'NOT_FOUND')

  const order = orderRows[0]
  if (order.status !== 'cancelled') {
    // Release reserved stock back.
    const items = await db.select().from(orderItems).where(eq(orderItems.orderId, order.id))
    for (const item of items) {
      if (item.productId) {
        await db
          .update(products)
          .set({ stock: sql`${products.stock} + ${item.quantity}` })
          .where(eq(products.id, item.productId))
      }
    }
    // If the order was validated previously, subtract its total from turnover
    if (order.status === 'validated') {
      const cfg = await db.select().from(storeConfig).where(eq(storeConfig.key, 'turnover_cents'))
      if (cfg.length > 0) {
        const current = Number(cfg[0].value || 0)
        const next = Math.max(0, current - Number(order.total || 0))
        await db.update(storeConfig).set({ value: String(next), updatedAt: sql`now()` }).where(eq(storeConfig.key, 'turnover_cents'))
      }
    }
    await db.update(orders).set({ status: 'cancelled', updatedAt: sql`now()` }).where(eq(orders.id, order.id))
  }
  return { cancelled: true }
}
