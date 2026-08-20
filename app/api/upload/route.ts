import 'server-only'

import { NextResponse } from 'next/server'

import { handleApiError } from '@/lib/api-error-response'
import { requireStaff } from '@/lib/auth/admin-guard'
import { AppError } from '@/lib/errors'

const MAX_DATA_URL_LENGTH = 4 * 1024 * 1024
const IMAGE_DATA_URL = /^data:(image\/(?:png|jpeg|webp|gif));base64,([A-Za-z0-9+/=]+)$/

export async function POST(request: Request) {
  try {
    await requireStaff()
    const body = (await request.json().catch(() => ({}))) as { dataUrl?: string }
    const dataUrl = body.dataUrl?.trim() ?? ''

    if (dataUrl.length > MAX_DATA_URL_LENGTH) {
      throw new AppError('Image trop volumineuse. Choisissez une image plus petite.', 413)
    }
    if (!IMAGE_DATA_URL.test(dataUrl)) {
      throw new AppError('Format d’image invalide.', 400)
    }

    return NextResponse.json({ success: true, data: { url: dataUrl } })
  } catch (error) {
    return handleApiError(error)
  }
}