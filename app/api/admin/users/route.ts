import 'server-only'

import { desc, eq, ilike, or, sql } from 'drizzle-orm'
import { NextResponse } from 'next/server'

import { db } from '@/db'
import { orders, users } from '@/db/schemas/core'
import { handleApiError } from '@/lib/api-error-response'
import { AppError } from '@/lib/errors'
import { requireStaff, requireSuperadmin } from '@/lib/auth/admin-guard'

const allowedRoles = new Set(['superadmin', 'admin', 'user'])

export async function GET(request: Request) {
  try {
    await requireStaff()
    const url = new URL(request.url)
    const q = url.searchParams.get('q')?.trim() ?? ''

    let query = db
      .select({
        id: users.id,
        email: users.email,
        name: users.name,
        role: users.role,
        status: users.status,
        createdAt: users.createdAt,
        orderCount: sql<number>`coalesce((select count(*) from orders where orders.user_id = ${users.id}), 0)`,
      })
      .from(users)

    if (q) {
      const pattern = `%${q}%`
      query = query.where(or(ilike(users.email, pattern), sql`${users.name}::text ilike ${pattern}`)) as typeof query
    }

    const rows = await query.orderBy(desc(users.createdAt))
    return NextResponse.json({ success: true, data: rows })
  } catch (error) {
    return handleApiError(error)
  }
}

export async function PATCH(request: Request) {
  try {
    await requireSuperadmin()
    const url = new URL(request.url)
    const id = url.searchParams.get('id')
    if (!id) throw new AppError('Identifiant utilisateur requis', 400)

    const body = (await request.json().catch(() => ({}))) as { role?: string }
    const role = body.role
    if (!role || !allowedRoles.has(role)) {
      throw new AppError('Rôle invalide', 400)
    }

    const updated = await db
      .update(users)
      .set({ role, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning({ id: users.id, role: users.role })

    if (updated.length === 0) {
      throw new AppError('Utilisateur introuvable', 404)
    }

    return NextResponse.json({ success: true, data: updated[0] })
  } catch (error) {
    return handleApiError(error)
  }
}
