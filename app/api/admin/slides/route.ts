import 'server-only'

import { NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'

import { handleApiError } from '@/lib/api-error-response'
import { requireStaff } from '@/lib/auth/admin-guard'
import { AppError } from '@/lib/errors'
import { listAdminSlides, upsertSlide } from '@/lib/services/admincatalog'

export async function GET(request: Request) {
  try {
    await requireStaff()
    const url = new URL(request.url)
    const q = url.searchParams.get('q') ?? undefined
    const rows = await listAdminSlides(q)
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
      title?: string
      titleEn?: string
      subtitle?: string | null
      subtitleEn?: string | null
      image?: string
      link?: string | null
      active?: number
      sortOrder?: number
    }

    if (!body.title?.trim()) throw new AppError('Le titre est requis', 400)
    if (!body.image?.trim()) throw new AppError('Une image est requise', 400)

    const slide = await upsertSlide({
      id: body.id,
      title: body.title.trim(),
      titleEn: body.titleEn?.trim() || body.title.trim(),
      subtitle: body.subtitle ?? null,
      subtitleEn: body.subtitleEn ?? null,
      image: body.image.trim(),
      link: body.link ?? null,
      active: Number(body.active ?? 1),
      sortOrder: Number(body.sortOrder ?? 0),
    })

    revalidatePath('/', 'page')
    return NextResponse.json({ success: true, data: slide })
  } catch (error) {
    return handleApiError(error)
  }
}
