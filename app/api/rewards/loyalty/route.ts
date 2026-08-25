import 'server-only'

import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth/session'
import { getLoyaltyDiscount } from '@/lib/services/rewards'

export async function GET() {
  const user = await getCurrentUser()
  const loyalty = await getLoyaltyDiscount(user?.id)
  return NextResponse.json({ success: true, data: loyalty })
}