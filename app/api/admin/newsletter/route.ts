import 'server-only'

import { desc, ilike } from 'drizzle-orm'
import { NextResponse } from 'next/server'

import { db } from '@/db'
import { newsletterSubscribers } from '@/db/schemas/core'
import { handleApiError } from '@/lib/api-error-response'
import { requireStaff } from '@/lib/auth/admin-guard'

export async function GET(request: Request) {
  try {
    await requireStaff()
    const url = new URL(request.url)
    const q = url.searchParams.get('q')?.trim() ?? ''
    let query = db
      .select({
        id: newsletterSubscribers.id,
        email: newsletterSubscribers.email,
        createdAt: newsletterSubscribers.createdAt,
        active: newsletterSubscribers.subscribed,
      })
      .from(newsletterSubscribers)

    if (q) {
      const pattern = `%${q}%`
      query = query.where(ilike(newsletterSubscribers.email, pattern)) as typeof query
    }

    const rows = await query.orderBy(desc(newsletterSubscribers.createdAt))
    return NextResponse.json({ success: true, data: rows })
  } catch (error) {
    return handleApiError(error)
  }
}
