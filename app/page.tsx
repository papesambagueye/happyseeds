import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight, ShieldCheck, Sparkles, Truck } from 'lucide-react'
import { StoreShell } from '@/components/store/shell'
import { Button } from '@/components/ui/button'
import { HeroCarousel } from '@/components/store/hero-carousel'
import { ProductCard } from '@/components/store/product-card'
import { getActiveSlides, getFeaturedProducts } from '@/lib/services/catalog'

const categories = [
  { title: 'Téléphones', titleEn: 'Phones', href: '/catalogue' },
  { title: 'Accessoires', titleEn: 'Accessories', href: '/catalogue' },
  { title: 'Audio', titleEn: 'Audio', href: '/catalogue' },
  { title: 'Ordinateurs', titleEn: 'Computers', href: '/catalogue' },
]

export default async function HomePage() {
  const [slides, featuredProducts] = await Promise.all([
    getActiveSlides().catch(() => []),
    getFeaturedProducts().catch(() => []),
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
              TECH 221
            </p>
            <h1 className="mt-5 max-w-xl text-4xl font-black leading-[1.05] sm:text-6xl">
              La tech qu&apos;on aime, au bon prix.
            </h1>
            <p className="mt-4 max-w-xl text-base text-white/75">
              Smartphones, audio, accessoires et gadgets premium conçus pour faciliter votre quotidien.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg" className="shadow-[0_18px_35px_rgba(0,123,255,0.35)]">
                <Link href="/catalogue">Découvrir la boutique</Link>
              </Button>
              <Button asChild variant="destructive" size="lg">
                <Link href="/promos">Voir les promos</Link>
              </Button>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-xl">
            <div className="floaty glow-ring overflow-hidden rounded-2xl border-4 border-white/15 bg-white/5 shadow-[0_28px_80px_rgba(0,0,0,0.45)] backdrop-blur-sm">
              <Image
                src="https://images.unsplash.com/photo-1545239351-1141bd82e8a6?w=1200"
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
          <FeatureCard icon={<Truck className="h-5 w-5" />} title="Livraison rapide" text="Expédition fiable et suivi simple." />
          <FeatureCard icon={<ShieldCheck className="h-5 w-5" />} title="Paiement sécurisé" text="Détails de commande envoyés via WhatsApp." />
          <FeatureCard icon={<Sparkles className="h-5 w-5" />} title="Produits sélectionnés" text="Une gamme pensée pour le quotidien et le style." />
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-8">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold">Nos catégories</h2>
          <Link href="/catalogue" className="inline-flex items-center gap-1 text-sm font-medium text-primary">
            Voir tout <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {categories.map((category) => (
            <Link key={category.title} href={category.href} className="soft-card block rounded-2xl p-5">
              <div className="text-sm text-muted-foreground">{category.titleEn}</div>
              <div className="mt-3 text-xl font-semibold text-black">{category.title}</div>
            </Link>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-10">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold">Produits en vedette</h2>
          <Link href="/catalogue" className="inline-flex items-center gap-1 text-sm font-medium text-primary">
            Tout explorer <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-5 lg:grid-cols-4">
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
