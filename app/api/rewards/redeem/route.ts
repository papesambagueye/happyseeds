import 'server-only'

import { and, eq, gt, lte, sql } from 'drizzle-orm'
import { NextResponse } from 'next/server'
import { db } from '@/db'
import { loyaltyEvents, products, rewardClaims, vouchers } from '@/db/schemas/core'
import { getCurrentUser } from '@/lib/auth/session'
import { handleApiError } from '@/lib/api-error-response'
import { AppError } from '@/lib/errors'
import { getRewardTier } from '@/lib/reward-tiers'

const MAX_PRODUCT_PRICE = 1500000

export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user) throw new AppError('Connexion requise.', 401)
    const rows = await db
      .select({ productName: products.name, voucherCode: vouchers.code, pointsUsed: rewardClaims.points, status: rewardClaims.status, createdAt: rewardClaims.createdAt })
      .from(rewardClaims)
      .innerJoin(products, eq(rewardClaims.productId, products.id))
      .innerJoin(vouchers, eq(rewardClaims.voucherId, vouchers.id))
      .where(eq(rewardClaims.userId, user.id))
      .orderBy(sql`${rewardClaims.createdAt} desc`)
    return NextResponse.json({ success: true, data: rows })
  } catch (error) {
    return handleApiError(error)
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser()
    if (!user) throw new AppError('Connexion requise.', 401)
    const body = await request.json().catch(() => ({})) as { productId?: string }
    if (!body.productId) throw new AppError('Choisissez un produit.', 400)
    const productId = body.productId

    const result = await db.transaction(async (tx: any) => {
      const productRows = await tx.select().from(products).where(and(
        eq(products.id, productId),
        eq(products.published, 1),
        gt(products.stock, 0),
        lte(products.price, MAX_PRODUCT_PRICE),
      )).limit(1)
      const product = productRows[0]
      if (!product) throw new AppError('Ce produit n’est pas éligible ou n’est plus disponible.', 400)

      const balanceRows = await tx
        .select({ total: sql<number>`coalesce(sum(${loyaltyEvents.points}), 0)` })
        .from(loyaltyEvents)
        .where(and(eq(loyaltyEvents.userId, user.id), sql`(${loyaltyEvents.expiresAt} IS NULL OR ${loyaltyEvents.expiresAt} > now())`))
      const balance = Number(balanceRows[0]?.total ?? 0)
      const tier = getRewardTier(product.price)
      if (!tier) throw new AppError('Ce produit dépasse le plafond des récompenses.', 400)
      if (balance < tier.points) throw new AppError(`Il faut ${tier.points} points pour obtenir cette récompense.`, 400)

      const code = `POINTS-${crypto.randomUUID().replace(/-/g, '').slice(0, 10).toUpperCase()}`
      const voucherRows = await tx.insert(vouchers).values({
        code,
        type: 'fixed',
        amount: product.price,
        title: `Récompense fidélité (${tier.points} points) : ${product.name}`,
        maxUses: 1,
        active: 1,
      }).returning({ id: vouchers.id, code: vouchers.code })

      await tx.insert(loyaltyEvents).values({
        userId: user.id,
        type: 'points',
        points: -tier.points,
        label: `Récompense (${tier.points} points) : ${product.name}`,
      })

      await tx.insert(rewardClaims).values({
        userId: user.id,
        productId: product.id,
        voucherId: voucherRows[0].id,
        points: tier.points,
      })

      return { productName: product.name, voucherCode: voucherRows[0].code, remainingPoints: balance - tier.points, pointsUsed: tier.points }
    })

    return NextResponse.json({ success: true, data: result })
  } catch (error) {
    return handleApiError(error)
  }
}