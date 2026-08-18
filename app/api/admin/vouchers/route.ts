import 'server-only'

import { NextResponse } from 'next/server'

import { handleApiError } from '@/lib/api-error-response'
import { requireStaff } from '@/lib/auth/admin-guard'
import { AppError } from '@/lib/errors'
import { deleteVoucher, listAdminVouchers, upsertVoucher } from '@/lib/services/admin_rewards'

export async function GET() {
  try {
    await requireStaff()
    const rows = await listAdminVouchers()
    return NextResponse.json({ success: true, data: rows })
  } catch (error) {
    return handleApiError(error)
  }
}

export async function POST(request: Request) {
  try {
    await requireStaff()
    const body = (await request.json().catch(() => ({}))) as {
      id?: string
      code?: string
      type?: 'percent' | 'fixed'
      amount?: number
      maxUses?: number
      active?: number
      title?: string | null
      expiresAt?: string | null
    }

    if (!body.code?.trim()) throw new AppError('Le code promo est requis', 400)

    const voucher = await upsertVoucher({
      id: body.id,
      code: body.code.trim(),
      type: body.type || 'percent',
      amount: Number(body.amount ?? 0),
      maxUses: Number(body.maxUses ?? 1),
      active: Number(body.active ?? 1),
      title: body.title ?? null,
      expiresAt: body.expiresAt ?? null,
    })

    return NextResponse.json({ success: true, data: voucher })
  } catch (error) {
    return handleApiError(error)
  }
}

export async function DELETE(request: Request) {
  try {
    await requireStaff()
    const id = new URL(request.url).searchParams.get('id')
    if (!id) throw new AppError('Identifiant requis', 400)
    await deleteVoucher(id)
    return NextResponse.json({ success: true, data: null })
  } catch (error) {
    return handleApiError(error)
  }
}
