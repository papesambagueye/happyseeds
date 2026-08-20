import { sql } from 'drizzle-orm'
import {
  text,
  timestamp,
  pgTable,
  integer,
  index,
  uniqueIndex,
} from 'drizzle-orm/pg-core'

export const users = pgTable(
  'users',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    email: text('email').notNull(),
    name: text('name'),
    birthDate: text('birth_date'),
    passwordHash: text('password_hash').notNull(), // Web Crypto PBKDF2 hash (salt:hash)
    role: text('role', { enum: ['superadmin', 'admin', 'user'] })
      .notNull()
      .default('user'),
    status: text('status', { enum: ['active', 'suspended', 'banned', 'disabled'] })
      .notNull()
      .default('active'),
    suspensionUntil: timestamp('suspension_until', { withTimezone: true }),
    suspensionReason: text('suspension_reason'),
    referredBy: text('referred_by'), // id of the user who referred this account
    referralCode: text('referral_code'), // unique personal code shared to friends
    airpodRewardedAt: timestamp('airpod_rewarded_at'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex('users_email_idx').on(sql`lower(${table.email})`),
    uniqueIndex('users_referral_code_idx').on(table.referralCode),
    index('users_role_idx').on(table.role),
  ]
)

export const sessions = pgTable(
  'sessions',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    tokenHash: text('token_hash').notNull(), // SHA-256 hash of opaque session token
    expiresAt: timestamp('expires_at', { withTimezone: true })
      .notNull()
      .default(sql`now() + interval '30 days'`),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex('sessions_token_idx').on(table.tokenHash),
    index('sessions_user_idx').on(table.userId),
  ]
)

export const categories = pgTable('categories', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text('name').notNull(), // FR
  nameEn: text('name_en').notNull(), // EN
  slug: text('slug').notNull().unique(),
  image: text('image'),
  sortOrder: integer('sort_order').notNull().default(0),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const products = pgTable(
  'products',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    categoryId: text('category_id').references(() => categories.id, {
      onDelete: 'set null',
    }),
    name: text('name').notNull(), // FR
    nameEn: text('name_en').notNull(), // EN
    slug: text('slug').notNull().unique(),
    description: text('description'), // FR
    descriptionEn: text('description_en'), // EN
    price: integer('price').notNull().default(0), // in cents
    compareAtPrice: integer('compare_at_price'), // in cents, for discounts
    currency: text('currency').notNull().default('FCFA'),
    stock: integer('stock').notNull().default(0),
    image: text('image'), // main image
    images: text('images').array().default(sql`'{}'::text[]`),
    featured: integer('featured').notNull().default(0), // 0 = normal, 1 = promoted on home
    published: integer('published').notNull().default(1),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => [
    index('products_category_idx').on(table.categoryId),
    index('products_published_idx').on(table.published),
    index('products_name_idx').on(table.name),
  ]
)

export const orders = pgTable(
  'orders',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    orderNumber: text('order_number').notNull().unique(),
    userId: text('user_id').references(() => users.id, { onDelete: 'set null' }),
    customerName: text('customer_name').notNull(),
    customerPhone: text('customer_phone').notNull(),
    itemSummary: text('item_summary').notNull(), // readable snapshot for WhatsApp
    total: integer('total').notNull().default(0), // in cents
    discount: integer('discount').notNull().default(0), // applied discount in cents
    voucherCode: text('voucher_code'), // voucher used, if any
    currency: text('currency').notNull().default('FCFA'),
    status: text('status', { enum: ['pending', 'validated', 'cancelled', 'on_hold'] })
      .notNull()
      .default('pending'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => [
    index('orders_user_idx').on(table.userId),
    index('orders_status_idx').on(table.status),
    index('orders_created_idx').on(table.createdAt),
  ]
)

export const orderItems = pgTable(
  'order_items',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    orderId: text('order_id')
      .notNull()
      .references(() => orders.id, { onDelete: 'cascade' }),
    productId: text('product_id').references(() => products.id, {
      onDelete: 'set null',
    }),
    productName: text('product_name').notNull(),
    quantity: integer('quantity').notNull().default(1),
    unitPrice: integer('unit_price').notNull().default(0),
  },
  (table) => [index('order_items_order_idx').on(table.orderId)]
)

// Loyalty tracking: reward points / discount events granted to a user.
export const loyaltyEvents = pgTable(
  'loyalty_events',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    type: text('type', { enum: ['first_orders', 'points', 'voucher_bonus'] })
      .notNull()
      .default('points'),
    points: integer('points').notNull().default(0), // points awarded (or discount in cents)
    label: text('label'), // human-readable description
    orderId: text('order_id').references(() => orders.id, { onDelete: 'set null' }),
    expiresAt: timestamp('expires_at', { withTimezone: true }),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [
    index('loyalty_user_idx').on(table.userId),
    index('loyalty_user_created_idx').on(table.userId, table.createdAt),
  ]
)

// Vouchers (bon d'achat / discount codes) managers can create and assign.
export const vouchers = pgTable(
  'vouchers',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    code: text('code').notNull().unique(),
    type: text('type', { enum: ['percent', 'fixed'] }).notNull().default('percent'),
    amount: integer('amount').notNull().default(0), // percent (1..100) or fixed cents
    maxUses: integer('max_uses').notNull().default(1), // -1 = unlimited
    usedCount: integer('used_count').notNull().default(0),
    active: integer('active').notNull().default(1),
    title: text('title'), // display label, e.g. "Merci pour votre fidélité"
    expiresAt: timestamp('expires_at', { withTimezone: true }),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [
    index('vouchers_active_idx').on(table.active),
    index('vouchers_expires_idx').on(table.expiresAt),
  ]
)

// Voucher redemptions: which user used a voucher on which order.
export const voucherRedemptions = pgTable(
  'voucher_redemptions',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    voucherId: text('voucher_id')
      .notNull()
      .references(() => vouchers.id, { onDelete: 'cascade' }),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    orderId: text('order_id')
      .notNull()
      .references(() => orders.id, { onDelete: 'cascade' }),
    amount: integer('amount').notNull().default(0), // discount applied in cents
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [
    index('redemptions_voucher_idx').on(table.voucherId),
    index('redemptions_user_idx').on(table.userId),
  ]
)

export const rewardClaims = pgTable(
  'reward_claims',
  {
    id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
    userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    productId: text('product_id').notNull().references(() => products.id, { onDelete: 'restrict' }),
    voucherId: text('voucher_id').notNull().references(() => vouchers.id, { onDelete: 'restrict' }),
    points: integer('points').notNull(),
    status: text('status', { enum: ['pending', 'contacted', 'claimed'] }).notNull().default('pending'),
    claimedAt: timestamp('claimed_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('reward_claims_user_idx').on(table.userId),
    index('reward_claims_status_idx').on(table.status),
  ]
)

// Vent-flash: a product temporarily sold at a reduced price.
export const flashSales = pgTable(
  'flash_sales',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    productId: text('product_id')
      .notNull()
      .references(() => products.id, { onDelete: 'cascade' }),
    salePrice: integer('sale_price').notNull().default(0), // in cents
    active: integer('active').notNull().default(1),
    label: text('label'), // e.g. "Vente flash -50%"
    startsAt: timestamp('starts_at', { withTimezone: true }),
    endsAt: timestamp('ends_at', { withTimezone: true }),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [
    index('flash_sales_active_idx').on(table.active),
    index('flash_sales_product_idx').on(table.productId),
  ]
)

// Parrainage: a bonus awarded to a user when a person they referred gets their
// first order validated. One row per rewarded referred account.
export const referralRewards = pgTable(
  'referral_rewards',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    referrerId: text('referrer_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    referredId: text('referred_id')
      .notNull()
      .unique()
      .references(() => users.id, { onDelete: 'cascade' }),
    orderId: text('order_id')
      .notNull()
      .references(() => orders.id, { onDelete: 'cascade' }),
    voucherId: text('voucher_id').references(() => vouchers.id, {
      onDelete: 'set null',
    }), // bonus voucher granted
    amount: integer('amount').notNull().default(0), // bonus in cents
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [
    index('referral_rewards_referrer_idx').on(table.referrerId),
  ]
)

export const reviews = pgTable(
  'reviews',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    productId: text('product_id')
      .notNull()
      .references(() => products.id, { onDelete: 'cascade' }),
    userId: text('user_id').references(() => users.id, { onDelete: 'set null' }),
    authorName: text('author_name').notNull(),
    rating: integer('rating').notNull(), // 1..5
    comment: text('comment'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [
    index('reviews_product_idx').on(table.productId),
    index('reviews_user_idx').on(table.userId),
  ]
)

export const wishlistItems = pgTable(
  'wishlist_items',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    productId: text('product_id')
      .notNull()
      .references(() => products.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [uniqueIndex('wishlist_user_product_idx').on(table.userId, table.productId)]
)

export const slides = pgTable('slides', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  title: text('title').notNull(), // FR
  titleEn: text('title_en').notNull(), // EN
  subtitle: text('subtitle'),
  subtitleEn: text('subtitle_en'),
  image: text('image').notNull(),
  link: text('link'),
  active: integer('active').notNull().default(1),
  sortOrder: integer('sort_order').notNull().default(0),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const siteMessages = pgTable(
  'site_messages',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text('user_id').references(() => users.id, { onDelete: 'set null' }),
    name: text('name').notNull(),
    email: text('email').notNull(),
    subject: text('subject').notNull(),
    message: text('message').notNull(),
    read: integer('read').notNull().default(0),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [index('site_messages_created_idx').on(table.createdAt)]
)

export const newsletterSubscribers = pgTable('newsletter_subscribers', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  email: text('email').notNull().unique(),
  locale: text('locale').notNull().default('fr'),
  subscribed: integer('subscribed').notNull().default(1),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

// Key/value store for store configuration (WhatsApp number, store name, ...)
export const storeConfig = pgTable('store_config', {
  key: text('key').primaryKey(),
  value: text('value'),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})
