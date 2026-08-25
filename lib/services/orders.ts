import 'server-only'
import { and, desc, eq, inArray, sql } from 'drizzle-orm'
import { db } from '@/db'
import { orderItems, orders, products, storeConfig, users, voucherRedemptions, vouchers } from '@/db/schemas/core'
import { AppError } from '@/lib/errors'
import { getFlashSalePriceMap, getPromotionPriceMap, validateVoucher } from './rewards'

export type CartLine = {
  productId: string
  name: string
  nameEn?: string
  unitPrice: number
  quantity: number
  image?: string | null
}

export type OrderInput = {
  userId?: string | null
  customerName: string
  customerPhone: string
  items: CartLine[]
  voucherCode?: string | null
  deliveryRequested?: boolean
  deliveryAddress?: string
}

const WHATSAPP_DEFAULT = '221787301886' // TECH 221 — override via store_config

export async function getStoreConfig(): Promise<Record<string, string>> {
  const rows = await db.select().from(storeConfig)
  const config: Record<string, string> = {}
  for (const row of rows) config[row.key] = row.value ?? ''
  return config
}

export async function setStoreConfig(key: string, value: string) {
  await db
    .insert(storeConfig)
    .values({ key, value })
    .onConflictDoUpdate({ target: storeConfig.key, set: { value } })
}

export async function getWhatsappNumber(): Promise<string> {
  const config = await getStoreConfig()
  return config.whatsapp_number && config.whatsapp_number.trim()
    ? config.whatsapp_number.trim()
    : WHATSAPP_DEFAULT
}

function formatPrice(amount: number, currency: string): string {
  return `${amount.toLocaleString('fr-FR')} ${currency}`
}

/** Builds the human-readable WhatsApp message snapshot for an order. */
export function buildOrderMessage(
  orderNumber: string,
  customerName: string,
  items: CartLine[],
  total: number,
  currency: string,
  deliveryFee = 0,
  deliveryRequested = false,
  deliveryAddress = '',
): string {
  const lines = [
    `🛒 *NOUVELLE COMMANDE* #${orderNumber}`,
    `👤 Client : ${customerName}`,
    '──────────────────',
  ]
  for (const item of items) {
    const sub = formatPrice(item.unitPrice * item.quantity, currency)
    lines.push(
      `• ${item.name} x${item.quantity} — ${sub}`
    )
  }
  lines.push('──────────────────')
  lines.push(deliveryRequested ? 'Mode : Livraison' : 'Mode : Retrait sur place')
  if (deliveryRequested && deliveryAddress) lines.push(`Adresse : ${deliveryAddress}`)
  if (deliveryRequested) lines.push('Frais de livraison : à convenir sur WhatsApp')
  lines.push(`*TOTAL : ${formatPrice(total, currency)}*`)
  return lines.join('\n')
}

export function buildWhatsappUrl(
  phone: string,
  encodedMessage: string
): string {
  const digits = phone.replace(/\D/g, '')
  return `https://wa.me/${digits}?text=${encodeURIComponent(encodedMessage)}`
}

export async function createOrder(input: OrderInput) {
  const { items, customerName, customerPhone, voucherCode, deliveryRequested = false, deliveryAddress = '' } = input
  if (!items.length) throw new AppError('Le panier est vide', 400)
  if (deliveryRequested && !deliveryAddress.trim()) {
    throw new AppError('Veuillez renseigner l’adresse de livraison.', 400)
  }

  const orderNumber = `CMD-${Date.now().toString().slice(-8)}${Math.floor(Math.random() * 90 + 10)}`

  const result = await db.transaction(async (tx: any) => {
    const productIds = [...new Set(items.map((item) => item.productId))]
    const fresh = await tx
      .select({ id: products.id, name: products.name, price: products.price, stock: products.stock, currency: products.currency })
      .from(products)
      .where(inArray(products.id, productIds))
      .for('update')
    const priceMap = new Map<string, { id: string; name: string; price: number; stock: number; currency: string }>(
      fresh.map((product) => [product.id, product]),
    )
    const flashPrices = await getFlashSalePriceMap()
    const promotionPrices = await getPromotionPriceMap()
    const quantities = new Map<string, number>()
    for (const item of items) {
      if (!Number.isInteger(item.quantity) || item.quantity <= 0) throw new AppError(`Quantité invalide pour « ${item.name} »`, 400)
      quantities.set(item.productId, (quantities.get(item.productId) ?? 0) + item.quantity)
    }

    let subtotal = 0
    const orderItemRows: { productId: string; productName: string; quantity: number; unitPrice: number }[] = []
    for (const item of items) {
      const product = priceMap.get(item.productId)
      if (!product) throw new AppError(`Produit introuvable : ${item.name}`, 400)
      const quantity = quantities.get(item.productId) ?? 0
      if (product.stock < quantity) throw new AppError(`Stock insuffisant pour « ${product.name} » (disponible : ${product.stock})`, 409)
      if (orderItemRows.some((row) => row.productId === product.id)) continue
      const flashPrice = flashPrices.get(product.id)
      const promotionPrice = promotionPrices.get(product.id)
      const unitPrice = flashPrice != null && flashPrice < product.price ? flashPrice : promotionPrice != null && promotionPrice < product.price ? promotionPrice : product.price
      subtotal += unitPrice * quantity
      orderItemRows.push({ productId: product.id, productName: product.name, quantity, unitPrice })
    }

    const validatedRows = input.userId
      ? await (async () => {
          await tx.select({ id: users.id }).from(users).where(eq(users.id, input.userId!)).for('update')
          return tx
            .select({ n: sql<number>`count(*)` })
            .from(orders)
            .where(and(eq(orders.userId, input.userId!), eq(orders.status, 'validated')))
        })()
      : []
    const loyaltyQualified = Boolean(input.userId && Number(validatedRows[0]?.n ?? 0) < 5)
    const loyaltyDiscount = loyaltyQualified ? Math.round(subtotal * 10 / 100) : 0
    let discount = loyaltyDiscount
    let voucher: { id: string; code: string; title: string | null } | null = null
    let voucherDiscount = 0
    if (voucherCode && input.userId) {
      const { voucher: v, discount: d } = await validateVoucher(voucherCode, subtotal - loyaltyDiscount, tx)
      const alreadyUsed = await tx.select({ id: voucherRedemptions.id }).from(voucherRedemptions).where(and(eq(voucherRedemptions.userId, input.userId), eq(voucherRedemptions.voucherId, v.id))).limit(1)
      if (alreadyUsed.length > 0) throw new AppError('Vous avez déjà utilisé ce code promo', 400)
      voucher = { id: v.id, code: v.code, title: v.title }
      voucherDiscount = d
      discount += d
    }

    const deliveryFee = 0
    const total = Math.max(0, subtotal - discount)
    const currency = fresh[0]?.currency ?? 'FCFA'
    const inserted = await tx.insert(orders).values({
      orderNumber,
      userId: input.userId ?? null,
      customerName,
      customerPhone,
      itemSummary: buildOrderMessage(
        orderNumber,
        customerName,
        orderItemRows.map((item) => ({
          productId: item.productId,
          name: item.productName,
          unitPrice: item.unitPrice,
          quantity: item.quantity,
        })),
        total,
        currency,
        deliveryFee,
        deliveryRequested,
        deliveryAddress.trim(),
      ),
      total,
      discount,
      voucherCode: voucher?.code ?? null,
      currency,
    }).returning()
    const order = inserted[0]
    await tx.insert(orderItems).values(orderItemRows.map((row) => ({ ...row, orderId: order.id })))
    if (input.userId && voucher) {
      await tx.insert(voucherRedemptions).values({ voucherId: voucher.id, userId: input.userId, orderId: order.id, amount: voucherDiscount })
      await tx.update(vouchers).set({ usedCount: sql`${vouchers.usedCount} + 1` }).where(eq(vouchers.id, voucher.id))
    }
    for (const row of orderItemRows) {
      const updated = await tx.update(products).set({ stock: sql`${products.stock} - ${row.quantity}` }).where(and(eq(products.id, row.productId), sql`${products.stock} >= ${row.quantity}`)).returning({ id: products.id })
      if (updated.length === 0) throw new AppError(`Stock insuffisant pour « ${row.productName} »`, 409)
    }
    return { order, orderItemRows, total, currency, discount, deliveryFee, loyaltyUsed: loyaltyQualified }
  })

  const { order, orderItemRows, total, currency, discount, deliveryFee, loyaltyUsed } = result

  const message = buildOrderMessage(
    orderNumber,
    customerName,
    orderItemRows.map((item) => ({
      productId: item.productId,
      name: item.productName,
      unitPrice: item.unitPrice,
      quantity: item.quantity,
    })),
    total,
    currency,
    deliveryFee,
    deliveryRequested,
    deliveryAddress.trim(),
  )
  const whatsappNumber = await getWhatsappNumber()
  const whatsappUrl = buildWhatsappUrl(whatsappNumber, message)

  return { order, whatsappUrl, message, discount, deliveryFee, loyaltyUsed }
}

export async function listUserOrders(userId: string) {
  return db
    .select()
    .from(orders)
    .where(eq(orders.userId, userId))
    .orderBy(desc(orders.createdAt))
}

export async function getOrderById(id: string) {
  const rows = await db.select().from(orders).where(eq(orders.id, id))
  return rows[0] ?? null
}

export async function getOrderWithItems(id: string) {
  const order = await getOrderById(id)
  if (!order) return null
  const items = await db
    .select()
    .from(orderItems)
    .where(eq(orderItems.orderId, order.id))
  return { order, items, whatsappMessage: order.itemSummary ?? null }
}
