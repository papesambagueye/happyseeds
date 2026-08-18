import 'server-only'

import { NextResponse } from 'next/server'

import { handleApiError } from '@/lib/api-error-response'
import { requireStaff } from '@/lib/auth/admin-guard'
import { deleteProduct, updateProduct } from '@/lib/services/admincatalog'

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireStaff()
    const { id } = await params
    const body = (await request.json().catch(() => ({}))) as {
      name?: string
      nameEn?: string
      description?: string | null
      descriptionEn?: string | null
      categoryId?: string | null
      price?: number
      compareAtPrice?: number | null
      stock?: number
      image?: string | null
      images?: string[]
      featured?: number
      published?: number
      currency?: string
    }

    const product = await updateProduct(id, {
      name: body.name?.trim() || 'Produit',
      nameEn: body.nameEn?.trim() || body.name?.trim() || 'Product',
      description: body.description ?? undefined,
      descriptionEn: body.descriptionEn ?? undefined,
      categoryId: body.categoryId ?? null,
      price: Number(body.price ?? 0),
      compareAtPrice: body.compareAtPrice == null ? null : Number(body.compareAtPrice),
      currency: body.currency || 'FCFA',
      stock: Number(body.stock ?? 0),
      image: body.image ?? null,
      images: body.images ?? [],
      featured: Number(body.featured ?? 0),
      published: Number(body.published ?? 1),
    })

    return NextResponse.json({ success: true, data: product })
  } catch (error) {
    return handleApiError(error)
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireStaff()
    const { id } = await params
    await deleteProduct(id)
    return NextResponse.json({ success: true, data: null })
  } catch (error) {
    return handleApiError(error)
  }
}
