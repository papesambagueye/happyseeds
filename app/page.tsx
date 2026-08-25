import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight, ShieldCheck, Sparkles, Truck } from 'lucide-react'
import { StoreShell } from '@/components/store/shell'
import { Button } from '@/components/ui/button'
import { HeroCarousel } from '@/components/store/hero-carousel'
import { ProductCard } from '@/components/store/product-card'
import { getActiveSlides, getFeaturedProducts, getPublishedCategories } from '@/lib/services/catalog'
import { db } from '@/db'
import { storeConfig } from '@/db/schemas/core'
import { eq } from 'drizzle-orm'

export const dynamic = 'force-dynamic'

const defaultHomeContent = {
  heroImage: 'https://images.unsplash.com/photo-1545239351-1141bd82e8a6?w=1200',
  heroEyebrow: 'TECH 221',
  heroTitle: "La tech qu'on aime, au bon prix.",
  heroDescription: 'Smartphones, audio, accessoires et gadgets premium conçus pour faciliter votre quotidien.',
  heroButton: 'Découvrir la boutique',
  promoButton: 'Voir les promos',
  benefits: [
    { title: 'Livraison rapide', text: 'Expédition fiable et suivi simple.' },
    { title: 'Paiement sécurisé', text: 'Détails de commande envoyés via WhatsApp.' },
    { title: 'Produits sélectionnés', text: 'Une gamme pensée pour le quotidien et le style.' },
  ],
  categoriesTitle: 'Nos catégories',
  categoriesLink: 'Voir tout',
  categories: [
    { title: 'Téléphones', titleEn: 'Phones' },
    { title: 'Accessoires', titleEn: 'Accessories' },
    { title: 'Audio', titleEn: 'Audio' },
    { title: 'Ordinateurs', titleEn: 'Computers' },
  ],
  featuredTitle: 'Produits en vedette',
  featuredLink: 'Tout explorer',
}

async function getHomeContent() {
  const rows = await db.select().from(storeConfig).where(eq(storeConfig.key, 'home_content'))
  if (!rows[0]?.value) return defaultHomeContent
  try {
    return { ...defaultHomeContent, ...JSON.parse(rows[0].value) }
  } catch {
    return defaultHomeContent
  }
}

export default async function HomePage() {
  const [slides, featuredProducts, content, publishedCategories] = await Promise.all([
    getActiveSlides().catch(() => []),
    getFeaturedProducts().catch(() => []),
    getHomeContent().catch(() => defaultHomeContent),
    getPublishedCategories().catch(() => []),
  ])

  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'OnlineStore',
    name: 'Tech221',
    url: 'https://ndartech221.vercel.app/',
    description: 'Boutique en ligne de smartphones, ordinateurs, audio et accessoires high-tech au Senegal.',
    areaServed: 'SN',
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
      <StoreShell>
        <div className="border-b border-black bg-[#E30613] px-4 py-2 text-center text-xs font-bold uppercase tracking-[0.16em] text-white">
        Livraison rapide · offres exclusives · assistance WhatsApp
        </div>
      {slides.length > 0 && <HeroCarousel slides={slides} shopLabel="Découvrir" />}
      <section className="relative overflow-hidden bg-black text-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(0,123,255,0.28),transparent_24%),radial-gradient(circle_at_bottom_right,_rgba(227,6,19,0.2),transparent_22%)]" />
        <div className="relative mx-auto grid max-w-7xl gap-10 px-4 py-14 md:grid-cols-[0.9fr_1.1fr] md:items-center md:py-20">
          <div>
            <p className="inline-flex rounded-full border border-white/20 bg-white/5 px-3 py-1 text-xs font-medium uppercase tracking-[0.2em] text-white">
              {content.heroEyebrow}
            </p>
            <h1 className="mt-5 max-w-xl text-4xl font-black leading-[1.05] sm:text-6xl">
              {content.heroTitle}
            </h1>
            <p className="mt-4 max-w-xl text-base text-white/75">
              {content.heroDescription}
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg" className="shadow-[0_18px_35px_rgba(0,123,255,0.35)]">
                <Link href="/catalogue">{content.heroButton}</Link>
              </Button>
              <Button asChild variant="destructive" size="lg">
                <Link href="/promos">{content.promoButton}</Link>
              </Button>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-xl">
            <div className="floaty glow-ring overflow-hidden rounded-2xl border-4 border-white/15 bg-white/5 shadow-[0_28px_80px_rgba(0,0,0,0.45)] backdrop-blur-sm">
              <Image
                src={content.heroImage}
                alt="Produits tech"
                width={1200}
                height={900}
                className="h-[340px] w-full object-cover sm:h-[430px]"
                unoptimized
              />
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-10">
        <div className="grid gap-4 md:grid-cols-3">
          <FeatureCard icon={<Truck className="h-5 w-5" />} {...content.benefits[0]} />
          <FeatureCard icon={<ShieldCheck className="h-5 w-5" />} {...content.benefits[1]} />
          <FeatureCard icon={<Sparkles className="h-5 w-5" />} {...content.benefits[2]} />
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-8">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold">{content.categoriesTitle}</h2>
          <Link href="/catalogue" className="inline-flex items-center gap-1 text-sm font-medium text-primary">
            {content.categoriesLink} <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {content.categories.map((category: { title: string; titleEn: string }, index: number) => (
            <Link key={category.title} href={`/catalogue?category=${publishedCategories[index]?.id ?? ''}`} className="soft-card block rounded-2xl p-5">
              <div className="text-sm text-muted-foreground">{category.titleEn}</div>
              <div className="mt-3 text-xl font-semibold text-black">{category.title}</div>
            </Link>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-10">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold">{content.featuredTitle}</h2>
          <Link href="/catalogue" className="inline-flex items-center gap-1 text-sm font-medium text-primary">
            {content.featuredLink} <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">
          {featuredProducts.length === 0 ? <p className="col-span-full text-muted-foreground">Aucun produit en vedette.</p> : featuredProducts.map((product) => <ProductCard key={product.id} product={product} />)}
        </div>
      </section>
      </StoreShell>
    </>
  )
}

function FeatureCard({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) {
  return (
    <div className="soft-card rounded-2xl p-5">
      <div className="mb-3 inline-flex rounded-xl bg-[#F2F2F2] p-2 text-[#007BFF]">{icon}</div>
      <h3 className="text-lg font-semibold text-black">{title}</h3>
      <p className="mt-2 text-sm text-muted-foreground">{text}</p>
    </div>
  )
}
