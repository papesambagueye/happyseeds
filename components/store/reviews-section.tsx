'use client'
import { useState } from 'react'
import Link from 'next/link'
import { Star } from 'lucide-react'
import { toast } from 'sonner'
import { useI18n } from '@/lib/i18n'
import { apiClient } from '@/lib/request'
import { formatDate } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import type { Review } from './product-detail'

export function ReviewsSection({
  productId,
  initialReviews,
  isLoggedIn,
}: {
  productId: string
  initialReviews: Review[]
  isLoggedIn: boolean
}) {
  const { locale, t } = useI18n()
  const [reviews, setReviews] = useState<Review[]>(initialReviews)
  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState('')
  const [sending, setSending] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!comment.trim()) {
      toast.error(locale === 'fr' ? 'Écrivez un commentaire' : 'Write a comment')
      return
    }
    setSending(true)
    const res = await apiClient.post<Review>('/api/reviews', {
      productId,
      rating,
      comment: comment.trim(),
    })
    setSending(false)
    if (res.success) {
      setReviews((r) => [res.data, ...r])
      setComment('')
      toast.success(locale === 'fr' ? 'Avis publié' : 'Review published')
    } else {
      toast.error(res.error)
    }
  }

  return (
    <div className="mt-10">
      <h2 className="text-xl font-bold">{t('reviews')} ({reviews.length})</h2>

      <div className="mt-4 space-y-4">
        {reviews.length === 0 ? (
          <p className="text-muted-foreground">{t('no_reviews')}</p>
        ) : (
          reviews.map((r) => (
            <div key={r.id} className="rounded-xl border bg-card p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Stars value={r.rating} />
                  <span className="font-medium">{r.authorName}</span>
                </div>
                <span className="text-xs text-muted-foreground">{formatDate(r.createdAt, locale)}</span>
              </div>
              {r.comment && <p className="mt-2 text-sm text-muted-foreground">{r.comment}</p>}
            </div>
          ))
        )}
      </div>

      {isLoggedIn ? (
        <form onSubmit={submit} className="mt-6 rounded-2xl border bg-card p-4">
          <h3 className="font-semibold">{t('write_review')}</h3>
          <div className="mt-3 flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((n) => (
              <button key={n} type="button" onClick={() => setRating(n)} aria-label={`${n} stars`}>
                <Star className={cn('h-6 w-6', n <= rating ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground')} />
              </button>
            ))}
          </div>
          <Textarea
            className="mt-3"
            placeholder={t('your_comment')}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={3}
          />
          <Button type="submit" className="mt-3" disabled={sending}>{t('submit_review')}</Button>
        </form>
      ) : (
        <Link href="/login" className="mt-6 inline-block text-sm font-medium text-primary hover:underline">
          {t('login_required_review')}
        </Link>
      )}
    </div>
  )
}

function Stars({ value }: { value: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star key={n} className={cn('h-4 w-4', n <= value ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground')} />
      ))}
    </div>
  )
}
