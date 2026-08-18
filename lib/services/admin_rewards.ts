import 'server-only'
import { desc, eq } from 'drizzle-orm'
import { db } from '@/db'
import { flashSales, products, vouchers } from '@/db/schemas/core'
import { AppError } from '@/lib/errors'

export type VoucherUpsert = {
  code: string
  type: 'percent' | 'fixed'
  amount: number
  maxUses: number
  active: number
  title?: string | null
  expiresAt?: string | null
}

export type FlashSaleUpsert = {
  productId: string
  salePrice: number
  active: number
  label?: string | null
  startsAt?: string | null
  endsAt?: string | null
}

function slugify(value: string) {
  return value.replace(/[^a-zA-Z0-9]+/g, '-').toUpperCase()
}

export async function listAdminVouchers() {
  return db
    .select({
      id: vouchers.id,
      code: vouchers.code,
      type: vouchers.type,
      amount: vouchers.amount,
      maxUses: vouchers.maxUses,
      usedCount: vouchers.usedCount,
      active: vouchers.active,
      title: vouchers.title,
      expiresAt: vouchers.expiresAt,
      createdAt: vouchers.createdAt,
    })
    .from(vouchers)
    .orderBy(desc(vouchers.createdAt))
}

export async function upsertVoucher(input: VoucherUpsert & { id?: string }) {
  const code = slugify(input.code) || `PROMO${Date.now().toString().slice(-6)}`
  if (!input.id) {
    const inserted = await db
      .insert(vouchers)
      .values({
        code,
        type: input.type,
        amount: input.amount,
        maxUses: input.maxUses,
        active: input.active,
        title: input.title ?? null,
        expiresAt: input.expiresAt ? new Date(input.expiresAt) : null,
      })
      .returning()
    return inserted[0]
  }
  const updated = await db
    .update(vouchers)
    .set({
      code,
      type: input.type,
      amount: input.amount,
      maxUses: input.maxUses,
      active: input.active,
      title: input.title ?? null,
      expiresAt: input.expiresAt ? new Date(input.expiresAt) : null,
    })
    .where(eq(vouchers.id, input.id))
    .returning()
  return updated[0] ?? null
}

export async function deleteVoucher(id: string) {
  await db.delete(vouchers).where(eq(vouchers.id, id))
}

export async function listAdminFlashSales() {
  return db
    .select({
      id: flashSales.id,
      productId: flashSales.productId,
      salePrice: flashSales.salePrice,
      active: flashSales.active,
      label: flashSales.label,
      startsAt: flashSales.startsAt,
      endsAt: flashSales.endsAt,
      createdAt: flashSales.createdAt,
      productName: products.name,
      productPrice: products.price,
      productImage: products.image,
    })
    .from(flashSales)
    .innerJoin(products, eq(flashSales.productId, products.id))
    .orderBy(desc(flashSales.createdAt))
}

export async function upsertFlashSale(input: FlashSaleUpsert & { id?: string }) {
  if (input.salePrice < 0) throw new AppError('Le prix de vente doit être positif', 400)
  if (!input.id) {
    const inserted = await db
      .insert(flashSales)
      .values({
        productId: input.productId,
        salePrice: input.salePrice,
        active: input.active,
        label: input.label ?? null,
        startsAt: input.startsAt ? new Date(input.startsAt) : null,
        endsAt: input.endsAt ? new Date(input.endsAt) : null,
      })
      .returning()
    return inserted[0]
  }
  const updated = await db
    .update(flashSales)
    .set({
      productId: input.productId,
      salePrice: input.salePrice,
      active: input.active,
      label: input.label ?? null,
      startsAt: input.startsAt ? new Date(input.startsAt) : null,
      endsAt: input.endsAt ? new Date(input.endsAt) : null,
    })
    .where(eq(flashSales.id, input.id))
    .returning()
  return updated[0] ?? null
}

export async function deleteFlashSale(id: string) {
  await db.delete(flashSales).where(eq(flashSales.id, id))
}
