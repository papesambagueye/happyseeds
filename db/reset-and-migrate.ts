import 'dotenv/config'
import postgres from 'postgres'
import * as fs from 'fs'
import * as path from 'path'

async function resetAndMigrate() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL not set')
  }

  const sql = postgres(process.env.DATABASE_URL, { ssl: 'require' })

  try {
    console.log('Dropping existing schema...')
    try {
      await sql.unsafe('DROP SCHEMA public CASCADE')
      await sql.unsafe('CREATE SCHEMA public')
      console.log('✓ Schema reset')
    } catch (e) {
      console.log('Schema reset skipped (already clean or error)')
    }

    console.log('Starting migrations...')

    // Read migration files in order
    const drizzleDir = path.join(process.cwd(), 'drizzle')
    const files = fs.readdirSync(drizzleDir)
      .filter(f => f.endsWith('.sql') && /^\d+_/.test(f))
      .sort()

    for (const file of files) {
      const filePath = path.join(drizzleDir, file)
      const content = fs.readFileSync(filePath, 'utf8')
      
      // Remove markdown code fences if present
      const cleanContent = content
        .replace(/^```sql\n?/, '')
        .replace(/\n?```$/, '')
        .trim()

      // Split by statement breakpoint
      const statements = cleanContent
        .split('--> statement-breakpoint')
        .map(s => s.trim())
        .filter(s => s.length > 0)

      console.log(`Running ${file}...`)
      for (const statement of statements) {
        await sql.unsafe(statement)
      }
      console.log(`✓ ${file} completed`)
    }

    console.log('✅ All migrations completed!')
  } catch (error) {
    console.error('❌ Migration failed:', error)
    process.exit(1)
  } finally {
    await sql.end()
    process.exit(0)
  }
}

resetAndMigrate()
