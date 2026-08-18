/**
 * Applies pending Drizzle SQL migration files to the database.
 * Run with: DATABASE_URL=... pnpm exec tsx db/migrate.ts
 */
import 'dotenv/config'
import { readFile, readdir } from 'fs/promises'
import { join } from 'path'
import postgres from 'postgres'

const MIGRATIONS_DIR = join(process.cwd(), 'drizzle')
const TABLE = 'drizzle_migrations'

async function main() {
  const DATABASE_URL = process.env.DATABASE_URL
  if (!DATABASE_URL) {
    console.error('DATABASE_URL is not set')
    process.exit(1)
  }
  const client = postgres(DATABASE_URL, { prepare: false })

  await client`
    create table if not exists ${client(TABLE)} (
      id serial primary key,
      name text not null unique,
      applied_at timestamptz default now()
    )`

  const files = (await readdir(MIGRATIONS_DIR))
    .filter((f) => /^\d+_.+\.sql$/.test(f))
    .sort()

  for (const file of files) {
    const existing = await client`select name from ${client(TABLE)} where name = ${file}`
    if (existing.length > 0) continue
    const sql = await readFile(join(MIGRATIONS_DIR, file), 'utf8')
    const statements = sql
      .split('--> statement-breakpoint')
      .map((s) => s.trim())
      .filter(Boolean)
    for (const stmt of statements) {
      await client.unsafe(stmt)
    }
    await client`insert into ${client(TABLE)} (name) values (${file})`
    console.log('Applied:', file)
  }
  console.log('Migration run complete.')
  await client.end()
}

main().catch((err) => {
  console.error('Migration failed:', err)
  process.exit(1)
})
