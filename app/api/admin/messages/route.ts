import 'server-only'

import { desc, eq, ilike, or } from 'drizzle-orm'
import { NextResponse } from 'next/server'

import { db } from '@/db'
import { siteMessages } from '@/db/schemas/core'
import { handleApiError } from '@/lib/api-error-response'
import { requireStaff } from '@/lib/auth/admin-guard'
import { AppError } from '@/lib/errors'

export async function GET(request: Request) {
  try {
    await requireStaff()
    const url = new URL(request.url)
    const q = url.searchParams.get('q')?.trim() ?? ''
    let query = db.select().from(siteMessages)

    if (q) {
      const pattern = `%${q}%`
      query = query.where(or(ilike(siteMessages.name, pattern), ilike(siteMessages.email, pattern), ilike(siteMessages.subject, pattern), ilike(siteMessages.message, pattern))) as typeof query
    }

    const rows = await query.orderBy(desc(siteMessages.createdAt))
    return NextResponse.json({ success: true, data: rows })
  } catch (error) {
    return handleApiError(error)
  }
}

export async function PATCH(request: Request) {
  try {
    await requireStaff()
    const url = new URL(request.url)
    const id = url.searchParams.get('id')
    if (!id) throw new AppError('Identifiant requis', 400)

    const body = (await request.json().catch(() => ({}))) as { read?: number | boolean }
    const read = body.read === true || body.read === 1 ? 1 : 0

    const updated = await db
      .update(siteMessages)
      .set({ read })
      .where(eq(siteMessages.id, id))
      .returning()

    return NextResponse.json({ success: true, data: updated[0] ?? null })
  } catch (error) {
    return handleApiError(error)
  }
}
