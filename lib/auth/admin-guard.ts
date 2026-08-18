import 'server-only'
import { getCurrentUser, type AuthUser } from '@/lib/auth/session'
import { UnauthorizedError, AppError } from '@/lib/errors'

export function assertIsStaff(user: AuthUser | null): asserts user is AuthUser {
  if (!user) throw new UnauthorizedError()
  if (user.role !== 'superadmin' && user.role !== 'admin') {
    throw new AppError('Accès réservé aux administrateurs', 403, 'FORBIDDEN')
  }
}

export function assertIsSuperadmin(user: AuthUser | null): asserts user is AuthUser {
  if (!user) throw new UnauthorizedError()
  if (user.role !== 'superadmin') {
    throw new AppError('Action réservée au superadmin', 403, 'FORBIDDEN')
  }
}

export async function requireStaff() {
  const user = await getCurrentUser()
  assertIsStaff(user)
  return user
}

export async function requireSuperadmin() {
  const user = await getCurrentUser()
  assertIsSuperadmin(user)
  return user
}
