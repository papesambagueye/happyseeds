import 'server-only'
import { asc, desc, eq, ilike, or, sql } from 'drizzle-orm'
import { db } from '@/db'
import { categories, products, slides } from '@/db/schemas/core'

export type ProductUpsert = {
  name: string
  nameEn: string
  description?: string
  descriptionEn?: string
  categoryId?: string | null
  price: number
  compareAtPrice?: number | null
  currency: string
  stock: number
  image?: string | null
  images?: string[]
  featured: number
  published: number
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

export async function listAdminProducts(q?: string) {
  const term = q?.trim()
  let query = db
    .select({
      product: products,
      categoryName: categories.name,
      categoryNameEn: categories.nameEn,
    })
    .from(products)
    .leftJoin(categories, eq(products.categoryId, categories.id))
  if (term) {
    const pattern = `%${term}%`
    query = query.where(or(ilike(products.name, pattern), ilike(products.nameEn, pattern))) as typeof query
  }
  return query.orderBy(desc(products.createdAt))
}

export async function getAdminProduct(id: string) {
  const rows = await db.select().from(products).where(eq(products.id, id))
  return rows[0] ?? null
}

export async function createProduct(input: ProductUpsert) {
  const slugBase = slugify(input.name) || `produit-${Date.now()}`
  const slug = `${slugBase}-${Date.now().toString().slice(-5)}`
  const inserted = await db
    .insert(products)
    .values({
      name: input.name,
      nameEn: input.nameEn || input.name,
      description: input.description ?? null,
      descriptionEn: input.descriptionEn ?? null,
      categoryId: input.categoryId ?? null,
      price: input.price,
      compareAtPrice: input.compareAtPrice ?? null,
      currency: input.currency || 'FCFA',
      stock: input.stock,
      image: input.image ?? null,
      images: input.images?.length ? input.images : [],
      featured: input.featured,
      published: input.published,
      slug,
    })
    .returning()
  return inserted[0]
}

export async function updateProduct(id: string, input: ProductUpsert) {
  const updated = await db
    .update(products)
    .set({
      name: input.name,
      nameEn: input.nameEn || input.name,
      description: input.description ?? null,
      descriptionEn: input.descriptionEn ?? null,
      categoryId: input.categoryId ?? null,
      price: input.price,
      compareAtPrice: input.compareAtPrice ?? null,
      currency: input.currency || 'FCFA',
      stock: input.stock,
      image: input.image ?? null,
      images: input.images?.length ? input.images : [],
      featured: input.featured,
      published: input.published,
      updatedAt: sql`now()`,
    })
    .where(eq(products.id, id))
    .returning()
  return updated[0]
}

export async function deleteProduct(id: string) {
  await db.delete(products).where(eq(products.id, id))
}

// ---------------- Categories ----------------

export type CategoryUpsert = {
  name: string
  nameEn: string
  image?: string | null
}

export async function createCategory(input: CategoryUpsert) {
  const slug = `${slugify(input.name)}-${Date.now().toString().slice(-4)}`
  const inserted = await db
    .insert(categories)
    .values({ name: input.name, nameEn: input.nameEn || input.name, image: input.image ?? null, slug })
    .returning()
  return inserted[0]
}

export async function updateCategory(id: string, input: CategoryUpsert) {
  const updated = await db
    .update(categories)
    .set({ name: input.name, nameEn: input.nameEn || input.name, image: input.image ?? null })
    .where(eq(categories.id, id))
    .returning()
  return updated[0]
}

export async function deleteCategory(id: string) {
  await db.delete(categories).where(eq(categories.id, id))
}

// ---------------- Slides ----------------

export async function listAdminSlides(q?: string) {
  const term = q?.trim()
  let query = db.select().from(slides)
  if (term) {
    const pattern = `%${term}%`
    query = query.where(or(ilike(slides.title, pattern), ilike(slides.titleEn, pattern))) as typeof query
  }
  return query.orderBy(asc(slides.sortOrder))
}

export type SlideUpsert = {
  id?: string
  title: string
  titleEn: string
  subtitle?: string | null
  subtitleEn?: string | null
  image: string
  link?: string | null
  active: number
  sortOrder: number
}

export async function upsertSlide(input: SlideUpsert) {
  if (input.id) {
    const updated = await db
      .update(slides)
      .set({
        title: input.title,
        titleEn: input.titleEn,
        subtitle: input.subtitle ?? null,
        subtitleEn: input.subtitleEn ?? null,
        image: input.image,
        link: input.link ?? null,
        active: input.active,
        sortOrder: input.sortOrder,
      })
      .where(eq(slides.id, input.id))
      .returning()
    return updated[0]
  }
  const inserted = await db.insert(slides).values({
    title: input.title,
    titleEn: input.titleEn,
    subtitle: input.subtitle ?? null,
    subtitleEn: input.subtitleEn ?? null,
    image: input.image,
    link: input.link ?? null,
    active: input.active,
    sortOrder: input.sortOrder,
  }).returning()
  return inserted[0]
}

export async function deleteSlide(id: string) {
  await db.delete(slides).where(eq(slides.id, id))
}
