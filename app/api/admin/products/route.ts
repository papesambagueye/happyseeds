import 'server-only'

import { NextResponse } from 'next/server'

import { handleApiError } from '@/lib/api-error-response'
import { requireStaff } from '@/lib/auth/admin-guard'
import { AppError } from '@/lib/errors'
import { createProduct, listAdminProducts } from '@/lib/services/admincatalog'

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
    const numbers = validateProductNumbers(body)

    const product = await createProduct({
      name: body.name.trim(),
      nameEn: body.nameEn?.trim() || body.name.trim(),
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
