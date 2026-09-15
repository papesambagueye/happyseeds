import 'server-only'

import { NextResponse } from 'next/server'

import { handleApiError } from '@/lib/api-error-response'
import { requireStaff } from '@/lib/auth/admin-guard'
import { AppError } from '@/lib/errors'
import { deleteProduct, updateProduct } from '@/lib/services/admincatalog'

function validateProductNumbers(body: { price?: number; compareAtPrice?: number | null; stock?: number; featured?: number; published?: number }) {
  const price = Number(body.price ?? 0)
  const compareAtPrice = body.compareAtPrice == null ? null : Number(body.compareAtPrice)
  const stock = Number(body.stock ?? 0)
  const featured = Number(body.featured ?? 0)
  const published = Number(body.published ?? 1)
  if (![price, stock, featured, published].every(Number.isInteger) || price < 0 || stock < 0 || ![0, 1].includes(featured) || ![0, 1].includes(published)) {
    throw new AppError('Valeurs produit invalides.', 400)
  }
  if (compareAtPrice !== null && (!Number.isInteger(compareAtPrice) || compareAtPrice < price)) {
    throw new AppError('Le prix de comparaison doit être supérieur ou égal au prix.', 400)
  }
  return { price, compareAtPrice, stock, featured, published }
}

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
    const numbers = validateProductNumbers(body)

    const product = await updateProduct(id, {
      name: body.name?.trim() || 'Produit',
      nameEn: body.nameEn?.trim() || body.name?.trim() || 'Product',
      description: body.description ?? undefined,
      descriptionEn: body.descriptionEn ?? undefined,
      categoryId: body.categoryId ?? null,
      price: numbers.price,
      compareAtPrice: numbers.compareAtPrice,
      currency: body.currency || 'FCFA',
      stock: numbers.stock,
      image: body.image ?? null,
      images: body.images ?? [],
      featured: numbers.featured,
      published: numbers.published,
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
