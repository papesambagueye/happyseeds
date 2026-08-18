import 'server-only'

import { NextResponse } from 'next/server'

import { getCurrentUser } from '@/lib/auth/session'
import { handleApiError } from '@/lib/api-error-response'

export async function GET() {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Non authentifié.' },
        { status: 401 }
      )
    }

    return NextResponse.json({ success: true, data: user })
  } catch (error) {
    return handleApiError(error)
  }
}
