import 'server-only'

import { NextResponse } from 'next/server'

import { handleApiError } from '@/lib/api-error-response'
import { requireStaff } from '@/lib/auth/admin-guard'
import { getDashboardStats } from '@/lib/services/analytics'

export async function GET(request: Request) {
  try {
    await requireStaff()
    const url = new URL(request.url)
    const days = Number(url.searchParams.get('days') ?? '7')
    const data = await getDashboardStats(days)
    return NextResponse.json({ success: true, data })
  } catch (error) {
    return handleApiError(error)
  }
}
