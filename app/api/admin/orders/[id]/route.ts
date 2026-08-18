import 'server-only'

import { eq } from 'drizzle-orm'
import { NextResponse } from 'next/server'

import { db } from '@/db'
import { orderItems, orders } from '@/db/schemas/core'
import { handleApiError } from '@/lib/api-error-response'
import { requireStaff } from '@/lib/auth/admin-guard'
import { AppError } from '@/lib/errors'
import { cancelOrder, validateOrder, holdOrder } from '@/lib/services/adminorders'

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireStaff()
    const { id } = await params
    const orderRows = await db.select().from(orders).where(eq(orders.id, id))
    if (orderRows.length === 0) throw new AppError('Commande introuvable', 404)

    const items = await db.select().from(orderItems).where(eq(orderItems.orderId, id))
    const order = orderRows[0]

    return NextResponse.json({
      success: true,
      data: {
        order,
        items: items.map((item: typeof items[number]) => ({
          id: item.id,
          productId: item.productId,
          productName: item.productName,
          quantity: item.quantity,
          price: item.unitPrice,
          currency: order.currency,
        })),
        whatsappMessage: order.itemSummary || null,
      },
    })
  } catch (error) {
    return handleApiError(error)
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireStaff()
    const { id } = await params
    const body = (await request.json().catch(() => ({}))) as { action?: string }
    const action = body.action

    if (action === 'validate') {
      await validateOrder(id)
    } else if (action === 'cancel') {
      await cancelOrder(id)
    } else if (action === 'hold') {
      await holdOrder(id)
    } else {
      throw new AppError('Action invalide', 400)
    }

    return NextResponse.json({ success: true, data: null })
  } catch (error) {
    return handleApiError(error)
  }
}
