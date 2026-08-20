import 'server-only'

import { eq, sql } from 'drizzle-orm'
import { NextResponse } from 'next/server'

import { db } from '@/db'
import { users } from '@/db/schemas/core'
import { handleApiError } from '@/lib/api-error-response'
import { ValidationError } from '@/lib/errors'
import { hashPassword } from '@/lib/auth/password'
import { createSession } from '@/lib/auth/session'
import { attachReferral, getReferrerByCode } from '@/lib/services/referrals'
import { awardSignupBonus } from '@/lib/services/rewards'

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({})) as {
      email?: string
      password?: string
      name?: string
      ref?: string
      birthDate?: string
    }

    const email = (body.email ?? '').trim().toLowerCase()
    const name = (body.name ?? '').trim()
    const password = body.password ?? ''
    const birthDate = (body.birthDate ?? '').trim() || null

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new ValidationError('Adresse e-mail invalide.')
    }

    if (!name || name.length < 2) {
      throw new ValidationError('Le nom doit contenir au moins 2 caractères.')
    }

    if (!password || password.length < 8) {
      throw new ValidationError('Le mot de passe doit contenir au moins 8 caractères.')
    }

    if (birthDate && !/^\d{4}-\d{2}-\d{2}$/.test(birthDate)) {
      throw new ValidationError('Date de naissance invalide.')
    }

    if (!process.env.DATABASE_URL) {
      return NextResponse.json(
        { success: false, error: 'La base de données n\'est pas configurée sur cette machine.' },
        { status: 503 }
      )
    }

    const existing = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, email))
      .limit(1)

    if (existing.length > 0) {
      throw new ValidationError('Un compte existe déjà pour cette adresse e-mail.')
    }

    const superadminCountRow = await db
      .select({ count: sql<number>`count(*)` })
      .from(users)
      .where(eq(users.role, 'superadmin'))
      .limit(1)

    const superadminCount = Number(superadminCountRow[0]?.count ?? 0)
    const shouldBeSuperadmin = superadminCount === 0
    const referrerId = body.ref ? await getReferrerByCode(body.ref) : null

    const inserted = await db.insert(users).values({
      email,
      name,
      passwordHash: await hashPassword(password),
      birthDate,
      role: shouldBeSuperadmin ? 'superadmin' : 'user',
      status: 'active',
    }).returning({ id: users.id })
    if (referrerId && inserted[0]) await attachReferral(inserted[0].id, referrerId)
    if (inserted[0]) await awardSignupBonus(inserted[0].id)

    const created = await db
      .select({ id: users.id, email: users.email, name: users.name, role: users.role })
      .from(users)
      .where(eq(users.email, email))
      .limit(1)

    const user = created[0]
    if (!user) {
      throw new ValidationError('Impossible de créer le compte.')
    }

    const token = await createSession(user.id)

    return NextResponse.json({
      success: true,
      data: {
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
      },
    })
  } catch (error) {
    return handleApiError(error)
  }
}
