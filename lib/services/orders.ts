import 'server-only'
import { and, desc, eq, inArray, sql } from 'drizzle-orm'
import { db } from '@/db'
import { orderItems, orders, products, storeConfig, voucherRedemptions } from '@/db/schemas/core'
import { AppError } from '@/lib/errors'
import { getDeliveryFee } from '@/lib/delivery'
import {
  getFlashSalePriceMap,
  getLoyaltyDiscount,
  recordLoyaltyEvent,
  redeemVoucher,
  validateVoucher,
} from './rewards'

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

function formatPrice(cents: number, currency: string): string {
  return `${(cents / 100).toLocaleString('fr-FR')} ${currency}`
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
  lines.push(`Mode : ${deliveryRequested ? 'Livraison' : 'Retrait sur place'}`)
  if (deliveryRequested && deliveryAddress) lines.push(`Adresse : ${deliveryAddress}`)
  lines.push(`Livraison : ${deliveryFee === 0 ? 'Offerte' : formatPrice(deliveryFee, currency)}`)
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

  // Verify stock and compute the order with a fresh product snapshot.
  const productIds = items.map((i) => i.productId)
  const fresh = await db
    .select({
      id: products.id,
      name: products.name,
      price: products.price,
      stock: products.stock,
      currency: products.currency,
      published: products.published,
    })
    .from(products)
    .where(inArray(products.id, productIds))

  const priceMap = new Map<string, { id: string; name: string; price: number; stock: number; currency: string; published: number }>(
    fresh.map((product: { id: string; name: string; price: number; stock: number; currency: string; published: number }) => [product.id, product])
  )
  const flashPrices = await getFlashSalePriceMap()

  let subtotal = 0
  const orderItemRows: { productId: string; productName: string; quantity: number; unitPrice: number }[] = []
  for (const item of items) {
    if (!Number.isInteger(item.quantity) || item.quantity <= 0) {
      throw new AppError(`Quantité invalide pour « ${item.name} »`, 400)
    }
    const product = priceMap.get(item.productId)
    if (!product) throw new AppError(`Produit introuvable : ${item.name}`, 400)
    if (product.stock < item.quantity) {
      throw new AppError(
        `Stock insuffisant pour « ${item.name} » (disponible : ${product.stock})`,
        409
      )
    }
    const flashPrice = flashPrices.get(product.id)
    const unit = flashPrice != null && flashPrice < product.price ? flashPrice : product.price
    const lineTotal = unit * item.quantity
    subtotal += lineTotal
    orderItemRows.push({
      productId: product.id,
      productName: product.name,
      quantity: item.quantity,
      unitPrice: unit,
    })
  }

  // Loyalty: 10% off the first N orders of a logged-in customer.
  const loyalty = input.userId ? await getLoyaltyDiscount(input.userId) : { qualified: false, percent: 0 }
  let discount = 0
  let loyaltyUsed = false
  if (loyalty.qualified) {
    discount += Math.round((subtotal * loyalty.percent) / 100)
    loyaltyUsed = true
  }

  // Voucher: additional code discount (stacked after loyalty).
  let voucher: { id: string; code: string; title: string | null } | null = null
  let voucherDiscount = 0
  if (voucherCode && input.userId) {
    const { voucher: v, discount: d } = await validateVoucher(voucherCode, subtotal)
    const alreadyUsed = await db
      .select({ id: voucherRedemptions.id })
      .from(voucherRedemptions)
      .where(
        and(eq(voucherRedemptions.userId, input.userId), eq(voucherRedemptions.voucherId, v.id))
      )
      .limit(1)
    if (alreadyUsed.length > 0) {
      throw new AppError('Vous avez déjà utilisé ce code promo', 400)
    }
    voucher = { id: v.id, code: v.code, title: v.title }
    voucherDiscount = d
    discount += d
  }

  const deliveryFee = deliveryRequested ? getDeliveryFee(subtotal) : 0
  const total = Math.max(0, subtotal - discount) + deliveryFee
  const currency = priceMap.values().next().value?.currency ?? 'FCFA'
  const orderNumber = `CMD-${Date.now().toString().slice(-8)}${Math.floor(Math.random() * 90 + 10)}`

  const inserted = await db
    .insert(orders)
    .values({
      orderNumber,
      userId: input.userId ?? null,
      customerName,
      customerPhone,
      itemSummary: buildOrderMessage(orderNumber, customerName, items, total, currency, deliveryFee, deliveryRequested, deliveryAddress.trim()),
      total,
      discount,
      voucherCode: voucher?.code ?? null,
      currency,
    })
    .returning()

  const order = inserted[0]
  await db.insert(orderItems).values(
    orderItemRows.map((r) => ({ ...r, orderId: order.id }))
  )

  // Record loyalty + voucher awards.
  if (input.userId && loyaltyUsed) {
    await recordLoyaltyEvent({
      userId: input.userId,
      type: 'first_orders',
      points: loyalty.percent,
      label: `Réduction de fidélité ${loyalty.percent}%`,
      orderId: order.id,
    })
  }
  if (input.userId && voucher) {
    await redeemVoucher({
      voucherId: voucher.id,
      userId: input.userId,
      orderId: order.id,
      discount: voucherDiscount,
    })
  }

  // Reserve stock at order time.
  for (const row of orderItemRows) {
    await db
      .update(products)
      .set({ stock: sql`${products.stock} - ${row.quantity}` })
      .where(eq(products.id, row.productId))
  }

  const message = buildOrderMessage(orderNumber, customerName, items, total, currency, deliveryFee, deliveryRequested, deliveryAddress.trim())
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
