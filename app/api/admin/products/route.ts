import 'server-only'

import { NextResponse } from 'next/server'

import { handleApiError } from '@/lib/api-error-response'
import { requireStaff } from '@/lib/auth/admin-guard'
import { createProduct, listAdminProducts } from '@/lib/services/admincatalog'

export async function GET(request: Request) {
  try {
    await requireStaff()
    const url = new URL(request.url)
    const q = url.searchParams.get('q') ?? undefined
    const data = await listAdminProducts(q)
    return NextResponse.json({ success: true, data })
  } catch (error) {
    return handleApiError(error)
  }
}

export async function POST(request: Request) {
  try {
    await requireStaff()
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

    if (!body.name?.trim()) throw new Error('Le nom du produit est requis')

    const product = await createProduct({
      name: body.name.trim(),
      nameEn: body.nameEn?.trim() || body.name.trim(),
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
