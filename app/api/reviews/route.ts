import 'server-only'

import { NextResponse } from 'next/server'

import { handleApiError } from '@/lib/api-error-response'
import { getCurrentUser } from '@/lib/auth/session'
import { createReview } from '@/lib/services/reviews'
import { AppError } from '@/lib/errors'

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser()
    if (!user) throw new AppError('Connectez-vous pour publier un avis.', 401)
    const body = (await request.json().catch(() => ({}))) as { productId?: string; rating?: number; comment?: string }
    const rating = Number(body.rating)
    if (!body.productId || !Number.isInteger(rating) || rating < 1 || rating > 5) {
      throw new AppError('Produit et note valides requis.', 400)
    }
    if (!body.comment?.trim()) throw new AppError('Le commentaire est requis.', 400)

    const review = await createReview({
      productId: body.productId,
      userId: user.id,
      authorName: user.name || user.email,
      rating,
      comment: body.comment.trim(),
    })
    return NextResponse.json({ success: true, data: review })
  } catch (error) {
    return handleApiError(error)
  }
}