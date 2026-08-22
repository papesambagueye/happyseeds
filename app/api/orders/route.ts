import 'server-only'

import { NextResponse } from 'next/server'

import { handleApiError } from '@/lib/api-error-response'
import { getCurrentUser } from '@/lib/auth/session'
import { createOrder, listUserOrders } from '@/lib/services/orders'

export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ success: false, error: 'Connexion requise.' }, { status: 401 })
    const rows = await listUserOrders(user.id)
    return NextResponse.json({ success: true, data: rows })
  } catch (error) {
    return handleApiError(error)
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      customerName?: string
      customerPhone?: string
      items?: Parameters<typeof createOrder>[0]['items']
      voucherCode?: string | null
      deliveryRequested?: boolean
      deliveryAddress?: string
    }

    const customerName = body.customerName?.trim()
    const customerPhone = body.customerPhone?.trim()
    if (!customerName || !customerPhone || !body.items?.length) {
      return NextResponse.json(
        { success: false, error: 'Nom, téléphone et panier sont obligatoires' },
        { status: 400 },
      )
    }

    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ success: false, error: 'Connectez-vous pour passer une commande.' }, { status: 401 })
    const result = await createOrder({
      userId: user.id,
      customerName,
      customerPhone,
      items: body.items,
      voucherCode: body.voucherCode,
      deliveryRequested: body.deliveryRequested,
      deliveryAddress: body.deliveryAddress,
    })

    return NextResponse.json({
      success: true,
      data: { order: result.order, whatsappUrl: result.whatsappUrl },
    })
  } catch (error) {
    return handleApiError(error)
  }
}