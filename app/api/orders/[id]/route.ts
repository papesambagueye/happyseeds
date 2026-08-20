import 'server-only'

import { eq } from 'drizzle-orm'
import { NextResponse } from 'next/server'

import { db } from '@/db'
import { orderItems, orders } from '@/db/schemas/core'
import { handleApiError } from '@/lib/api-error-response'
import { AppError } from '@/lib/errors'

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const orderRows = await db.select().from(orders).where(eq(orders.id, id)).limit(1)
    if (orderRows.length === 0) throw new AppError('Commande introuvable.', 404)
    const order = orderRows[0]
    const items = await db.select().from(orderItems).where(eq(orderItems.orderId, id))
    return NextResponse.json({
      success: true,
      data: {
        order,
        items: items.map((item: typeof items[number]) => ({ id: item.id, productName: item.productName, quantity: item.quantity, unitPrice: item.unitPrice })),
      },
    })
  } catch (error) {
    return handleApiError(error)
  }
}