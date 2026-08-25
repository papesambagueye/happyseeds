import 'server-only'

import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth/session'
import { getLoyaltyDiscount } from '@/lib/services/rewards'

export async function GET(request: Request) {
  const user = await getCurrentUser()
  const subtotal = Number(new URL(request.url).searchParams.get('subtotal') ?? 0)
  const loyalty = await getLoyaltyDiscount(user?.id, Number.isFinite(subtotal) ? subtotal : 0)
  return NextResponse.json({ success: true, data: loyalty })
}