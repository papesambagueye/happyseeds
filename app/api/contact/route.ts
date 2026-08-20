import 'server-only'

import { NextResponse } from 'next/server'

import { db } from '@/db'
import { siteMessages } from '@/db/schemas/core'
import { handleApiError } from '@/lib/api-error-response'
import { getCurrentUser } from '@/lib/auth/session'
import { AppError } from '@/lib/errors'

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => ({}))) as { name?: string; email?: string; subject?: string; message?: string }
    const name = body.name?.trim() ?? ''
    const email = body.email?.trim().toLowerCase() ?? ''
    const subject = body.subject?.trim() ?? ''
    const message = body.message?.trim() ?? ''
    if (!name || !subject || !message || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new AppError('Tous les champs sont obligatoires.', 400)
    }
    const user = await getCurrentUser()
    const inserted = await db.insert(siteMessages).values({ userId: user?.id ?? null, name, email, subject, message }).returning()
    return NextResponse.json({ success: true, data: inserted[0] })
  } catch (error) {
    return handleApiError(error)
  }
}