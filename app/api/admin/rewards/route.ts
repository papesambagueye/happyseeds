import 'server-only'

import { desc, eq, sql } from 'drizzle-orm'
import { NextResponse } from 'next/server'
import { db } from '@/db'
import { products, rewardClaims, users, vouchers } from '@/db/schemas/core'
import { handleApiError } from '@/lib/api-error-response'
import { requireStaff } from '@/lib/auth/admin-guard'

export async function GET() {
  try {
    await requireStaff()
    const rows = await db
      .select({
        id: rewardClaims.id,
        userId: rewardClaims.userId,
        clientName: users.name,
        email: users.email,
        phone: sql<string | null>`(select customer_phone from orders where user_id = ${users.id} order by created_at desc limit 1)`,
        productName: products.name,
        points: rewardClaims.points,
        voucherCode: vouchers.code,
        status: rewardClaims.status,
        createdAt: rewardClaims.createdAt,
        claimedAt: rewardClaims.claimedAt,
      })
      .from(rewardClaims)
      .innerJoin(users, eq(rewardClaims.userId, users.id))
      .innerJoin(products, eq(rewardClaims.productId, products.id))
      .innerJoin(vouchers, eq(rewardClaims.voucherId, vouchers.id))
      .orderBy(desc(rewardClaims.createdAt))

    const unique = new Map<string, typeof rows[number]>()
    for (const row of rows) if (!unique.has(row.id)) unique.set(row.id, row)
    return NextResponse.json({ success: true, data: [...unique.values()] })
  } catch (error) {
    return handleApiError(error)
  }
}

export async function PATCH(request: Request) {
  try {
    await requireStaff()
    const body = await request.json().catch(() => ({})) as { id?: string; status?: 'pending' | 'contacted' | 'claimed' }
    if (!body.id || !body.status) return NextResponse.json({ success: false, error: 'Gain et statut requis.' }, { status: 400 })
    const updated = await db.update(rewardClaims).set({
      status: body.status,
      claimedAt: body.status === 'claimed' ? new Date() : null,
    }).where(eq(rewardClaims.id, body.id)).returning({ id: rewardClaims.id, status: rewardClaims.status })
    return NextResponse.json({ success: true, data: updated[0] })
  } catch (error) {
    return handleApiError(error)
  }
}