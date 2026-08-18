import 'server-only'

import { NextResponse } from 'next/server'

import { db } from '@/db'
import { storeConfig } from '@/db/schemas/core'
import { handleApiError } from '@/lib/api-error-response'

async function readConfig(): Promise<Record<string, string>> {
  const rows: Array<{ key: string; value: string | null }> = await db.select().from(storeConfig)
  return Object.fromEntries(rows.map((row) => [row.key, row.value ?? '']))
}

export async function GET() {
  try {
    return NextResponse.json({ success: true, data: await readConfig() })
  } catch (error) {
    return handleApiError(error)
  }
}
