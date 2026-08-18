import 'server-only'

import { eq } from 'drizzle-orm'
import { NextResponse } from 'next/server'

import { db } from '@/db'
import { storeConfig } from '@/db/schemas/core'
import { handleApiError } from '@/lib/api-error-response'
import { requireStaff } from '@/lib/auth/admin-guard'

async function readConfig(): Promise<Record<string, string>> {
  const rows: Array<{ key: string; value: string | null }> = await db.select().from(storeConfig)
  return Object.fromEntries(rows.map((row) => [row.key, row.value ?? '']))
}

export async function GET() {
  try {
    await requireStaff()
    return NextResponse.json({ success: true, data: await readConfig() })
  } catch (error) {
    return handleApiError(error)
  }
}

export async function PUT(request: Request) {
  try {
    await requireStaff()
    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>

    for (const [key, value] of Object.entries(body)) {
      const normalizedKey = key.trim()
      if (!normalizedKey) continue
      const normalizedValue = value == null ? '' : String(value)
      const existing = await db
        .select()
        .from(storeConfig)
        .where(eq(storeConfig.key, normalizedKey))
        .limit(1)

      if (existing.length > 0) {
        await db
          .update(storeConfig)
          .set({ value: normalizedValue, updatedAt: new Date() })
          .where(eq(storeConfig.key, normalizedKey))
      } else {
        await db.insert(storeConfig).values({ key: normalizedKey, value: normalizedValue })
      }
    }

    return NextResponse.json({ success: true, data: await readConfig() })
  } catch (error) {
    return handleApiError(error)
  }
}
