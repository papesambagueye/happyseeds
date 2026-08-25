import 'server-only'

import { NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'

import { handleApiError } from '@/lib/api-error-response'
import { requireStaff } from '@/lib/auth/admin-guard'
import { AppError } from '@/lib/errors'
import { deleteSlide } from '@/lib/services/admincatalog'

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireStaff()
    const { id } = await params
    if (!id) throw new AppError('Identifiant requis', 400)
    await deleteSlide(id)
    revalidatePath('/', 'page')
    return NextResponse.json({ success: true, data: null })
  } catch (error) {
    return handleApiError(error)
  }
}
