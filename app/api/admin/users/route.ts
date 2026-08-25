import 'server-only'

import { desc, eq, ilike, or, sql } from 'drizzle-orm'
import { NextResponse } from 'next/server'

import { db } from '@/db'
import { sessions, users } from '@/db/schemas/core'
import { handleApiError } from '@/lib/api-error-response'
import { AppError } from '@/lib/errors'
import { requireStaff } from '@/lib/auth/admin-guard'
import { hashPassword } from '@/lib/auth/password'

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
        suspensionUntil: users.suspensionUntil,
        suspensionReason: users.suspensionReason,
        createdAt: users.createdAt,
        orderCount: sql<number>`coalesce((select count(*) from orders where orders.user_id = ${users.id}), 0)`,
        validatedOrderCount: sql<number>`coalesce((select count(*) from orders where orders.status = 'validated' and orders.user_id = ${users.id}), 0)`,
        orderTotal: sql<number>`coalesce((select sum(orders.total) from orders where orders.status = 'validated' and orders.user_id = ${users.id}), 0)`,
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
    const actor = await requireStaff()
    const url = new URL(request.url)
    const id = url.searchParams.get('id')
    if (!id) throw new AppError('Identifiant utilisateur requis', 400)

    const body = (await request.json().catch(() => ({}))) as { role?: string; sanction?: 'active' | 'suspended' | 'banned'; duration?: '3_days' | '1_month' | '3_months'; reason?: string; newPassword?: string }
    if (body.newPassword !== undefined) {
      const newPassword = body.newPassword
      if (newPassword.length < 8) throw new AppError('Le nouveau mot de passe doit contenir au moins 8 caractères', 400)
      const target = await db.select({ id: users.id, role: users.role }).from(users).where(eq(users.id, id)).limit(1)
      if (!target[0]) throw new AppError('Utilisateur introuvable', 404)
      if (target[0].role !== 'user') throw new AppError('Seul un compte client peut être réinitialisé ici', 403)
      const updated = await db.transaction(async (tx: any) => {
        await tx.delete(sessions).where(eq(sessions.userId, id))
        return tx.update(users).set({ passwordHash: await hashPassword(newPassword), updatedAt: new Date() }).where(eq(users.id, id)).returning({ id: users.id })
      })
      return NextResponse.json({ success: true, data: updated[0] })
    }
    if (body.sanction) {
      const current = await db.select({ id: users.id, role: users.role }).from(users).where(eq(users.id, id)).limit(1)
      if (!current[0]) throw new AppError('Utilisateur introuvable', 404)
      if (current[0].role === 'superadmin' || current[0].id === actor.id) {
        throw new AppError('Ce compte ne peut pas être sanctionné', 403)
      }

      let suspensionUntil: Date | null = null
      if (body.sanction === 'suspended') {
        const days = body.duration === '3_days' ? 3 : body.duration === '3_months' ? 90 : 30
        suspensionUntil = new Date()
        suspensionUntil.setDate(suspensionUntil.getDate() + days)
      }

      const updated = await db.transaction(async (tx: any) => {
        const result = await tx.update(users).set({
          status: body.sanction,
          suspensionUntil,
          suspensionReason: body.sanction === 'active' ? null : (body.reason?.trim() || null),
          updatedAt: new Date(),
        }).where(eq(users.id, id)).returning({ id: users.id, status: users.status, suspensionUntil: users.suspensionUntil })
        if (body.sanction !== 'active') await tx.delete(sessions).where(eq(sessions.userId, id))
        return result
      })
      return NextResponse.json({ success: true, data: updated[0] })
    }

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

export async function DELETE(request: Request) {
  try {
    const actor = await requireStaff()
    const id = new URL(request.url).searchParams.get('id')
    if (!id) throw new AppError('Identifiant utilisateur requis', 400)
    const target = await db.select({ id: users.id, role: users.role }).from(users).where(eq(users.id, id)).limit(1)
    if (!target[0]) throw new AppError('Utilisateur introuvable', 404)
    if (target[0].id === actor.id || target[0].role !== 'user') {
      throw new AppError('Seul un compte client peut être supprimé', 403)
    }
    await db.transaction(async (tx: any) => {
      await tx.delete(sessions).where(eq(sessions.userId, id))
      await tx.delete(users).where(eq(users.id, id))
    })
    return NextResponse.json({ success: true, data: { id } })
  } catch (error) {
    return handleApiError(error)
  }
}
