import Link from 'next/link'
import { notFound } from 'next/navigation'
import { StoreShell } from '@/components/store/shell'
import { ProductDetail } from '@/components/store/product-detail'
import { ReviewsSection } from '@/components/store/reviews-section'
import { getCurrentUser } from '@/lib/auth/session'
import { getProductDetail } from '@/lib/services/catalog'

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const productDetail = await getProductDetail(slug)
  const product = productDetail.product
  const user = await getCurrentUser()

  if (!product) notFound()

  return (
    <StoreShell>
      <div className="mx-auto max-w-7xl px-4 py-10">
        <div className="mb-6">
          <Link href="/catalogue" className="text-sm font-medium text-primary hover:underline">
            ← Retour au catalogue
          </Link>
        </div>
        <ProductDetail
          product={{
            id: product.id,
            name: product.name,
            nameEn: product.nameEn,
            description: product.description,
            descriptionEn: product.descriptionEn,
            price: product.price,
            compareAtPrice: product.compareAtPrice,
            currency: product.currency,
            stock: product.stock,
            image: product.image,
            images: product.images ?? [],
            slug: product.slug,
            isFlashSale: product.isFlashSale,
          }}
          averageRating={productDetail.averageRating}
          reviews={productDetail.reviews.map((review) => ({
            id: review.id,
            authorName: review.authorName,
            rating: review.rating,
            comment: review.comment,
            createdAt: review.createdAt,
          }))}
          isLoggedIn={Boolean(user)}
          userName={user?.name ?? null}
        />
        <ReviewsSection productId={product.id} initialReviews={productDetail.reviews.map((review) => ({
          id: review.id,
          authorName: review.authorName,
          rating: review.rating,
          comment: review.comment,
          createdAt: review.createdAt,
        }))} isLoggedIn={Boolean(user)} />
      </div>
    </StoreShell>
  )
}
