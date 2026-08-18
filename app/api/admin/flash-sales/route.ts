import 'server-only'

import { NextResponse } from 'next/server'

import { handleApiError } from '@/lib/api-error-response'
import { requireStaff } from '@/lib/auth/admin-guard'
import { AppError } from '@/lib/errors'
import { deleteFlashSale, listAdminFlashSales, upsertFlashSale } from '@/lib/services/admin_rewards'

export async function GET() {
  try {
    await requireStaff()
    const rows = await listAdminFlashSales()
    return NextResponse.json({ success: true, data: rows })
  } catch (error) {
    return handleApiError(error)
  }
}

export async function POST(request: Request) {
  try {
    await requireStaff()
    const body = (await request.json().catch(() => ({}))) as {
      id?: string
      productId?: string
      salePrice?: number
      active?: number
      label?: string | null
      startsAt?: string | null
      endsAt?: string | null
    }

    if (!body.productId) throw new AppError('Produit requis', 400)

    const item = await upsertFlashSale({
      id: body.id,
      productId: body.productId,
      salePrice: Number(body.salePrice ?? 0),
      active: Number(body.active ?? 1),
      label: body.label ?? null,
      startsAt: body.startsAt ?? null,
      endsAt: body.endsAt ?? null,
    })

    return NextResponse.json({ success: true, data: item })
  } catch (error) {
    return handleApiError(error)
  }
}

export async function DELETE(request: Request) {
  try {
    await requireStaff()
    const id = new URL(request.url).searchParams.get('id')
    if (!id) throw new AppError('Identifiant requis', 400)
    await deleteFlashSale(id)
    return NextResponse.json({ success: true, data: null })
  } catch (error) {
    return handleApiError(error)
  }
}
