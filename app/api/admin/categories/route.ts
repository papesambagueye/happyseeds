import 'server-only'

import { asc } from 'drizzle-orm'
import { NextResponse } from 'next/server'

import { db } from '@/db'
import { categories } from '@/db/schemas/core'
import { handleApiError } from '@/lib/api-error-response'
import { requireStaff } from '@/lib/auth/admin-guard'

export async function GET() {
  try {
    await requireStaff()
    const rows = await db.select().from(categories).orderBy(asc(categories.name))
    return NextResponse.json({ success: true, data: rows })
  } catch (error) {
    return handleApiError(error)
  }
}
