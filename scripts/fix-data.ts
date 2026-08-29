import { config as loadEnv } from 'dotenv'
import postgres from 'postgres'
import { drizzle } from 'drizzle-orm/postgres-js'
import { sql, eq, gte, and } from 'drizzle-orm'
import { promotions, flashSales, products } from '@/db/schemas/core'

loadEnv({ path: '.env.local' })
loadEnv()

const DATABASE_URL = process.env.DATABASE_URL
if (!DATABASE_URL) {
  console.error('DATABASE_URL not set')
  process.exit(1)
}

const client = postgres(DATABASE_URL, { prepare: false })
const db = drizzle(client)

async function fixData() {
  console.log('🔧 Fixing database data...\n')

  // Step 1: Delete invalid promotions
  console.log('1️⃣  Deleting invalid promotions (price promo >= price normal)...')
  const invalidCount = await db.delete(promotions).where(
    sql`${promotions.promotionalPrice} >= (SELECT price FROM products WHERE products.id = ${promotions.productId})`
  ).returning()
  console.log(`   ✅ Deleted ${invalidCount.length} invalid promotions\n`)

  // Step 2: List products that should be flash sales
  console.log('2️⃣  Finding products that should be flash sales...')
  const flashProducts = await db.select().from(products).where(
    sql`(${products.name} ILIKE '%VENTE FLASH%' OR ${products.name} = 'Ps4') AND ${products.stock} = 1`
  )
  console.log(`   Found ${flashProducts.length} products:`)
  flashProducts.forEach(p => console.log(`     - ${p.name} (${p.price} FCFA)`))

  // Step 3: Create flash_sales for those products
  console.log('\n3️⃣  Creating flash_sales entries...')
  for (const prod of flashProducts) {
    const existing = await db.select().from(flashSales).where(eq(flashSales.productId, prod.id))
    if (existing.length === 0) {
      const result = await db.insert(flashSales).values({
        productId: prod.id,
        salePrice: prod.price,
        active: 1,
        label: 'Flash sale',
      }).returning()
      console.log(`   ✅ Created flash_sales for ${prod.name}`)
    } else {
      console.log(`   ℹ️  Flash_sales already exists for ${prod.name}`)
    }
  }

  // Step 4: Verify the cleanup
  console.log('\n4️⃣  Verifying cleanup...')
  const promoCount = await db.select({ count: sql`COUNT(*)` }).from(promotions)
  const flashCount = await db.select({ count: sql`COUNT(*)` }).from(flashSales)
  
  console.log(`   Promotions: ${promoCount[0].count}`)
  console.log(`   Flash sales: ${flashCount[0].count}`)

  console.log('\n✅ Database cleanup complete!')
  await client.end()
}

fixData().catch(err => {
  console.error('❌ Error:', err.message)
  process.exit(1)
})
