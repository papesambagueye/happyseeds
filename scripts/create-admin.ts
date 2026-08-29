import { config as loadEnv } from 'dotenv'
import postgres from 'postgres'
import { drizzle } from 'drizzle-orm/postgres-js'
import { eq } from 'drizzle-orm'
import { hashPassword } from '@/lib/auth/password'
import { users } from '@/db/schemas/core'

loadEnv({ path: '.env.local' })
loadEnv()

const DATABASE_URL = process.env.DATABASE_URL
if (!DATABASE_URL) {
  console.error('DATABASE_URL not set')
  process.exit(1)
}

const client = postgres(DATABASE_URL, { prepare: false })
const db = drizzle(client)

async function createAdmin() {
  const email = 'admin@test.com'
  const password = 'Admin@123456'

  try {
    // Check if admin exists
    const existing = await db.select().from(users).where(eq(users.email, email)).limit(1)
    if (existing.length > 0) {
      console.log('Admin account already exists')
      await client.end()
      return
    }

    // Hash password
    const passwordHash = await hashPassword(password)

    // Create admin
    const result = await db.insert(users).values({
      email,
      name: 'Test Admin',
      passwordHash,
      role: 'admin',
      status: 'active',
    }).returning()

    console.log('✅ Admin account created:')
    console.log(`   Email: ${email}`)
    console.log(`   Password: ${password}`)
    console.log(`   ID: ${result[0].id}`)
  } finally {
    await client.end()
  }
}

createAdmin().catch(err => {
  console.error('Error:', err)
  process.exit(1)
})
