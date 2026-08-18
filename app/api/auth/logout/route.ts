import 'server-only'

import { NextResponse } from 'next/server'

import { destroySession } from '@/lib/auth/session'
import { handleApiError } from '@/lib/api-error-response'

export async function POST() {
  try {
    await destroySession()
    return NextResponse.json({ success: true, data: null })
  } catch (error) {
    return handleApiError(error)
  }
}
