import 'server-only'

import { NextResponse } from 'next/server'

import { handleApiError } from '@/lib/api-error-response'
import { getCurrentUser } from '@/lib/auth/session'
import { createOrder } from '@/lib/services/orders'

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      customerName?: string
      customerPhone?: string
      items?: Parameters<typeof createOrder>[0]['items']
      voucherCode?: string | null
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
    const result = await createOrder({
      userId: user?.id ?? null,
      customerName,
      customerPhone,
      items: body.items,
      voucherCode: body.voucherCode,
    })

    return NextResponse.json({
      success: true,
      data: { order: result.order, whatsappUrl: result.whatsappUrl },
    })
  } catch (error) {
    return handleApiError(error)
  }
}