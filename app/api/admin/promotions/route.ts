import 'server-only'

import { NextResponse } from 'next/server'
import { handleApiError } from '@/lib/api-error-response'
import { requireStaff } from '@/lib/auth/admin-guard'
import { AppError } from '@/lib/errors'
import { deletePromotion, listAdminPromotions, upsertPromotion } from '@/lib/services/admin_rewards'

export async function GET() {
  try {
    await requireStaff()
    return NextResponse.json({ success: true, data: await listAdminPromotions() })
  } catch (error) { return handleApiError(error) }
}

export async function POST(request: Request) {
  try {
    await requireStaff()
    const body = await request.json().catch(() => ({})) as {
      id?: string; productId?: string; promotionalPrice?: number; active?: number
      startsAt?: string | null; endsAt?: string | null
    }
    if (!body.productId) throw new AppError('Produit requis', 400)
    if (body.startsAt && body.endsAt && new Date(body.endsAt) <= new Date(body.startsAt)) {
      throw new AppError('La fin doit être après le début', 400)
    }
    const data = await upsertPromotion({
      id: body.id,
      productId: body.productId,
      promotionalPrice: Number(body.promotionalPrice ?? 0),
      active: Number(body.active ?? 1),
      startsAt: body.startsAt ?? null,
      endsAt: body.endsAt ?? null,
    })
    return NextResponse.json({ success: true, data })
  } catch (error) { return handleApiError(error) }
}

export async function DELETE(request: Request) {
  try {
    await requireStaff()
    const id = new URL(request.url).searchParams.get('id')
    if (!id) throw new AppError('Identifiant requis', 400)
    await deletePromotion(id)
    return NextResponse.json({ success: true, data: null })
  } catch (error) { return handleApiError(error) }
}