import 'server-only'

import { eq } from 'drizzle-orm'
import { NextResponse } from 'next/server'

import { db } from '@/db'
import { users } from '@/db/schemas/core'
import { handleApiError } from '@/lib/api-error-response'
import { ValidationError } from '@/lib/errors'
import { verifyPassword } from '@/lib/auth/password'
import { createSession } from '@/lib/auth/session'

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({})) as {
      email?: string
      password?: string
    }

    const email = (body.email ?? '').trim().toLowerCase()
    const password = body.password ?? ''

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new ValidationError('Adresse e-mail invalide.')
    }

    if (!password || password.length < 8) {
      throw new ValidationError('Le mot de passe doit contenir au moins 8 caractères.')
    }

    if (!process.env.DATABASE_URL) {
      return NextResponse.json(
        { success: false, error: 'La base de données n\'est pas configurée sur cette machine.' },
        { status: 503 }
      )
    }

    const rows = await db
      .select({
        id: users.id,
        email: users.email,
        name: users.name,
        role: users.role,
        passwordHash: users.passwordHash,
      })
      .from(users)
      .where(eq(users.email, email))
      .limit(1)

    const user = rows[0]
    if (!user) {
      throw new ValidationError('Aucun compte trouvé pour cette adresse e-mail.')
    }

    const valid = await verifyPassword(password, user.passwordHash)
    if (!valid) {
      throw new ValidationError('Mot de passe incorrect.')
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
