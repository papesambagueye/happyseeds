import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight, ShieldCheck, Sparkles, Truck } from 'lucide-react'
import { StoreShell } from '@/components/store/shell'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

const featuredProducts = [
  {
    id: 'p1',
    slug: 'smartphone-nova-x5',
    name: 'Smartphone Nova X5',
    nameEn: 'Smartphone Nova X5',
    price: 285000,
    compareAtPrice: 320000,
    currency: 'FCFA',
    image: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800',
  },
  {
    id: 'p2',
    slug: 'ecouteurs-sans-fil-pro',
    name: 'Écouteurs sans fil Pro',
    nameEn: 'Pro Wireless Earbuds',
    price: 25000,
    compareAtPrice: 35000,
    currency: 'FCFA',
    image: 'https://images.unsplash.com/photo-1606220945770-b5b6c2c55bf1?w=800',
  },
  {
    id: 'p3',
    slug: 'casque-studio-anc',
    name: 'Casque Studio ANC',
    nameEn: 'Studio ANC Headphones',
    price: 120000,
    compareAtPrice: 145000,
    currency: 'FCFA',
    image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800',
  },
]

const categories = [
  { title: 'Téléphones', titleEn: 'Phones', href: '/catalogue' },
  { title: 'Accessoires', titleEn: 'Accessories', href: '/catalogue' },
  { title: 'Audio', titleEn: 'Audio', href: '/catalogue' },
  { title: 'Ordinateurs', titleEn: 'Computers', href: '/catalogue' },
]

export default function HomePage() {
  return (
    <StoreShell>
      <section className="relative overflow-hidden bg-gradient-to-r from-slate-950 via-violet-950 to-slate-900 text-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(168,85,247,0.35),transparent_20%),radial-gradient(circle_at_bottom_right,_rgba(59,130,246,0.35),transparent_22%)]" />
        <div className="relative mx-auto grid max-w-7xl gap-8 px-4 py-16 md:grid-cols-2 md:items-center md:py-24">
          <div>
            <p className="inline-flex rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-medium uppercase tracking-[0.2em] text-slate-200">
              TECH 221
            </p>
            <h1 className="mt-5 text-4xl font-black leading-tight sm:text-5xl">
              La tech qu&apos;on aime, au bon prix.
            </h1>
            <p className="mt-4 max-w-xl text-base text-slate-300">
              Smartphones, audio, accessoires et gadgets premium conçus pour faciliter votre quotidien.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg" className="shadow-[0_18px_35px_rgba(168,85,247,0.35)]">
                <Link href="/catalogue">Découvrir la boutique</Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="border-white/25 bg-white/5 text-white hover:bg-white/10">
                <Link href="/promos">Voir les promos</Link>
              </Button>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-xl">
            <div className="floaty glow-ring overflow-hidden rounded-[28px] border border-white/10 bg-white/5 shadow-[0_28px_80px_rgba(15,23,42,0.45)] backdrop-blur-sm">
              <Image
                src="https://images.unsplash.com/photo-1545239351-1141bd82e8a6?w=1200"
                alt="Produits tech"
                width={1200}
                height={900}
                className="h-[420px] w-full object-cover"
                unoptimized
              />
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-12">
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
              <div className="mt-3 text-xl font-semibold text-slate-900">{category.title}</div>
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

        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {featuredProducts.map((product) => (
            <Card key={product.id} className="soft-card overflow-hidden p-0">
              <Link href={`/produit/${product.slug}`} className="block">
                <div className="relative h-64 w-full overflow-hidden">
                  <Image src={product.image} alt={product.name} fill className="object-cover transition duration-500 hover:scale-105" unoptimized />
                </div>
              </Link>
              <div className="p-4">
                <Link href={`/produit/${product.slug}`} className="block text-lg font-semibold text-slate-900 hover:text-violet-700">
                  {product.name}
                </Link>
                <div className="mt-2 flex items-center gap-2">
                  <span className="text-xl font-bold text-violet-700">{product.price.toLocaleString('fr-FR')} FCFA</span>
                  <span className="text-sm text-muted-foreground line-through">{product.compareAtPrice.toLocaleString('fr-FR')} FCFA</span>
                </div>
                <Button asChild className="mt-4 w-full">
                  <Link href={`/produit/${product.slug}`}>Voir le produit</Link>
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </section>
    </StoreShell>
  )
}

function FeatureCard({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) {
  return (
    <div className="soft-card rounded-2xl p-5">
      <div className="mb-3 inline-flex rounded-xl bg-violet-100 p-2 text-violet-700">{icon}</div>
      <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
      <p className="mt-2 text-sm text-muted-foreground">{text}</p>
    </div>
  )
}
