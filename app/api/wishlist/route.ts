import { NextResponse } from 'next/server'
import { db } from '@/db'
import { products, wishlistItems } from '@/db/schemas/core'
import { getCurrentUser } from '@/lib/auth/session'
import { and, eq } from 'drizzle-orm'

export async function GET(request: Request) {
  const user = await getCurrentUser()
  if (!user) {
    return NextResponse.json({ success: true, data: { wishlisted: false } })
  }

  const { searchParams } = new URL(request.url)
  const productId = searchParams.get('productId')
  if (!productId) {
    return NextResponse.json({ success: true, data: { wishlisted: false } })
  }

  const items = await db
    .select({ id: wishlistItems.id })
    .from(wishlistItems)
    .where(and(eq(wishlistItems.userId, user.id), eq(wishlistItems.productId, productId)))

  return NextResponse.json({ success: true, data: { wishlisted: items.length > 0 } })
}

export async function POST(request: Request) {
  const user = await getCurrentUser()
  if (!user) {
    return NextResponse.json({ success: false, error: 'Connexion requise.' }, { status: 401 })
  }

  const body = await request.json().catch(() => ({}))
  const productId = typeof body.productId === 'string' ? body.productId : null
  if (!productId) {
    return NextResponse.json({ success: false, error: 'Produit manquant.' }, { status: 400 })
  }

  const product = await db
    .select({ id: products.id })
    .from(products)
    .where(eq(products.id, productId))
    .limit(1)

  if (product.length === 0) {
    return NextResponse.json({ success: false, error: 'Produit introuvable.' }, { status: 404 })
  }

  await db.insert(wishlistItems).values({ userId: user.id, productId }).onConflictDoNothing()
  return NextResponse.json({ success: true, data: { wishlisted: true } })
}

export async function DELETE(request: Request) {
  const user = await getCurrentUser()
  if (!user) {
    return NextResponse.json({ success: false, error: 'Connexion requise.' }, { status: 401 })
  }

  const body = await request.json().catch(() => ({}))
  const productId = typeof body.productId === 'string' ? body.productId : null
  if (!productId) {
    return NextResponse.json({ success: false, error: 'Produit manquant.' }, { status: 400 })
  }

  await db.delete(wishlistItems).where(and(eq(wishlistItems.userId, user.id), eq(wishlistItems.productId, productId)))
  return NextResponse.json({ success: true, data: { wishlisted: false } })
}
