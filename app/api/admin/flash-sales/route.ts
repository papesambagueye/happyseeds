import 'server-only'

import { NextResponse } from 'next/server'

import { handleApiError } from '@/lib/api-error-response'
import { requireStaff } from '@/lib/auth/admin-guard'
import { AppError } from '@/lib/errors'
import { deleteFlashSale, listAdminFlashSales, upsertFlashSale } from '@/lib/services/admin_rewards'
import { createProduct } from '@/lib/services/admincatalog'

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
      productName?: string
      description?: string
      image?: string | null
      price?: number
      originalPrice?: number
      salePrice?: number
      active?: number
      label?: string | null
      startsAt?: string | null
      endsAt?: string | null
    }

    if (!body.productId && !body.productName?.trim()) throw new AppError('Nom du produit d’occasion requis', 400)
    if (body.startsAt && body.endsAt && new Date(body.endsAt) <= new Date(body.startsAt)) {
      throw new AppError('La fin doit être après le début', 400)
    }

    const productId = body.productId ?? (await createProduct({
      name: body.productName!.trim(), nameEn: body.productName!.trim(),
      description: body.description?.trim(), price: Number(body.originalPrice ?? body.price ?? body.salePrice ?? 0),
      currency: 'FCFA', stock: 1, image: body.image ?? null, images: [], featured: 0, published: 1,
    })).id
    const item = await upsertFlashSale({
      id: body.id,
      productId,
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
