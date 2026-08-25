import 'server-only'

import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth/session'
import { getLoyaltyDiscount } from '@/lib/services/rewards'

export async function GET(request: Request) {
  const user = await getCurrentUser()
  const subtotalParam = new URL(request.url).searchParams.get('subtotal')
  const subtotal = subtotalParam == null ? undefined : Number(subtotalParam)
  const loyalty = await getLoyaltyDiscount(user?.id, Number.isFinite(subtotal) ? subtotal : undefined)
  return NextResponse.json({ success: true, data: loyalty })
}