import 'server-only'

import { NextResponse } from 'next/server'

import { handleApiError } from '@/lib/api-error-response'
import { requireStaff } from '@/lib/auth/admin-guard'
import { getReferralDashboard } from '@/lib/services/adminreferrals'

export async function GET() {
  try {
    await requireStaff()
    const data = await getReferralDashboard()
    return NextResponse.json({ success: true, data })
  } catch (error) {
    return handleApiError(error)
  }
}
