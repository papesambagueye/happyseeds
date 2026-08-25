import 'server-only'
import { and, desc, eq, gte, lt, sql } from 'drizzle-orm'
import { db } from '@/db'
import { orders, raffleDraws, raffleEntries, users } from '@/db/schemas/core'

export async function prepareMonthlyRaffle(month: string) {
  if (!/^\d{4}-\d{2}$/.test(month)) throw new Error('Mois invalide')
  const start = new Date(`${month}-01T00:00:00.000Z`)
  const end = new Date(start)
  end.setUTCMonth(end.getUTCMonth() + 1)
  const existing = await db.select().from(raffleDraws).where(eq(raffleDraws.month, month)).limit(1)
  const draw = existing[0] ?? (await db.insert(raffleDraws).values({ month }).returning())[0]
  if (!draw) throw new Error('Impossible de créer le tirage')
  const top = await db
    .select({ userId: orders.userId, total: sql<number>`sum(${orders.total})` })
    .from(orders)
    .where(and(eq(orders.status, 'validated'), gte(orders.createdAt, start), lt(orders.createdAt, end)))
    .groupBy(orders.userId)
    .orderBy(desc(sql`sum(${orders.total})`))
    .limit(10)
  for (const [index, row] of top.entries()) {
    if (!row.userId) continue
    await db.insert(raffleEntries).values({ drawId: draw.id, userId: row.userId, rank: index + 1 }).onConflictDoNothing()
  }
  return { draw, entries: top.length }
}