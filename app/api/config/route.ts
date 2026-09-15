import 'server-only'

import { NextResponse } from 'next/server'

import { db } from '@/db'
import { storeConfig } from '@/db/schemas/core'
import { handleApiError } from '@/lib/api-error-response'

async function readConfig(): Promise<Record<string, string>> {
  const rows: Array<{ key: string; value: string | null }> = await db.select().from(storeConfig)
  const publicKeys = new Set(['site_name', 'logo_url', 'whatsapp_number', 'home_content'])
  return Object.fromEntries(
    rows
      .filter((row) => publicKeys.has(row.key))
      .map((row) => [row.key, row.value ?? ''])
  )
}

export async function GET() {
  try {
    return NextResponse.json({ success: true, data: await readConfig() })
  } catch (error) {
    return handleApiError(error)
  }
}
