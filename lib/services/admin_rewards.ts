import 'server-only'
import { desc, eq } from 'drizzle-orm'
import { db } from '@/db'
import { flashSales, products, promotions, vouchers } from '@/db/schemas/core'
import { AppError } from '@/lib/errors'
import { validatePromotionPrice } from './promo-rules'

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

export type PromotionUpsert = {
  productId: string
  promotionalPrice: number
  active: number
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
  const productRows = await db.select({ price: products.price, stock: products.stock }).from(products).where(eq(products.id, input.productId)).limit(1)
  if (productRows.length === 0) throw new AppError('Produit introuvable', 404)
  if (productRows[0].stock !== 1) throw new AppError('Une vente flash doit concerner un article unique avec un stock de 1', 400)
  if (input.salePrice <= 0) {
    throw new AppError('Le prix de vente doit être supérieur à zéro', 400)
  }
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

export async function updateFlashSaleProduct(input: {
  productId: string
  name?: string
  description?: string | null
  price?: number
  image?: string | null
}) {
  const values: Partial<typeof products.$inferInsert> = {}
  if (input.name?.trim()) values.name = input.name.trim()
  if (input.description !== undefined) values.description = input.description?.trim() || null
  if (input.price !== undefined && input.price > 0) values.price = input.price
  if (input.image !== undefined) values.image = input.image
  if (Object.keys(values).length > 0) await db.update(products).set(values).where(eq(products.id, input.productId))
}

export async function deleteFlashSale(id: string) {
  const rows = await db
    .select({ productId: flashSales.productId })
    .from(flashSales)
    .where(eq(flashSales.id, id))
    .limit(1)

  if (rows.length === 0) return

  // Le produit créé pour une vente flash est l’item réel du catalogue.
  // En supprimant le produit, la FK cascade retire aussi la ligne flash_sales.
  await db.delete(products).where(eq(products.id, rows[0].productId))
}

export async function listAdminPromotions() {
  return db
    .select({
      id: promotions.id,
      productId: promotions.productId,
      promotionalPrice: promotions.promotionalPrice,
      active: promotions.active,
      startsAt: promotions.startsAt,
      endsAt: promotions.endsAt,
      createdAt: promotions.createdAt,
      productName: products.name,
      productPrice: products.price,
      productImage: products.image,
    })
    .from(promotions)
    .innerJoin(products, eq(promotions.productId, products.id))
    .orderBy(desc(promotions.createdAt))
}

export async function upsertPromotion(input: PromotionUpsert & { id?: string }) {
  const productRows = await db.select({ price: products.price }).from(products).where(eq(products.id, input.productId)).limit(1)
  if (productRows.length === 0) throw new AppError('Produit introuvable', 404)
  validatePromotionPrice(productRows[0].price, input.promotionalPrice)
  const values = {
    productId: input.productId,
    promotionalPrice: input.promotionalPrice,
    active: input.active,
    startsAt: input.startsAt ? new Date(input.startsAt) : null,
    endsAt: input.endsAt ? new Date(input.endsAt) : null,
    updatedAt: new Date(),
  }
  if (!input.id) return (await db.insert(promotions).values(values).returning())[0]
  return (await db.update(promotions).set(values).where(eq(promotions.id, input.id)).returning())[0] ?? null
}

export async function deletePromotion(id: string) {
  await db.delete(promotions).where(eq(promotions.id, id))
}
