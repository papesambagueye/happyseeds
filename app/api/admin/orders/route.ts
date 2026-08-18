import 'server-only'

import { NextResponse } from 'next/server'

import { handleApiError } from '@/lib/api-error-response'
import { requireStaff } from '@/lib/auth/admin-guard'
import { listAdminOrders } from '@/lib/services/adminorders'

export async function GET(request: Request) {
  try {
    await requireStaff()
    const url = new URL(request.url)
    const status = url.searchParams.get('status') ?? undefined
    const q = url.searchParams.get('q') ?? undefined
    const rows = await listAdminOrders(status, q)
    return NextResponse.json({ success: true, data: rows })
  } catch (error) {
    return handleApiError(error)
  }
}
