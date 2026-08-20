import 'server-only'

import { eq } from 'drizzle-orm'
import { NextResponse } from 'next/server'

import { db } from '@/db'
import { newsletterSubscribers } from '@/db/schemas/core'
import { handleApiError } from '@/lib/api-error-response'
import { AppError } from '@/lib/errors'

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => ({}))) as { email?: string; locale?: string }
    const email = body.email?.trim().toLowerCase() ?? ''
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new AppError('Adresse e-mail invalide.', 400)
    }

    const existing = await db.select({ id: newsletterSubscribers.id }).from(newsletterSubscribers).where(eq(newsletterSubscribers.email, email)).limit(1)
    if (existing.length > 0) {
      await db.update(newsletterSubscribers).set({ subscribed: 1 }).where(eq(newsletterSubscribers.email, email))
    } else {
      await db.insert(newsletterSubscribers).values({ email, locale: body.locale === 'en' ? 'en' : 'fr' })
    }

    return NextResponse.json({ success: true, data: null })
  } catch (error) {
    return handleApiError(error)
  }
}