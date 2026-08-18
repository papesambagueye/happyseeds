'use client'
import Link from 'next/link'
import Image from 'next/image'
import { useCallback, useEffect, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { pickLocal, useI18n } from '@/lib/i18n'
import { Button } from '@/components/ui/button'

type Slide = {
  id: string
  title: string
  titleEn: string
  subtitle: string | null
  subtitleEn: string | null
  image: string
  link: string | null
}

export function HeroCarousel({ slides, shopLabel }: { slides: Slide[]; shopLabel: string }) {
  const { locale } = useI18n()
  const [index, setIndex] = useState(0)

  const next = useCallback(() => setIndex((i) => (i + 1) % Math.max(slides.length, 1)), [slides.length])
  const prev = useCallback(() => setIndex((i) => (i - 1 + Math.max(slides.length, 1)) % Math.max(slides.length, 1)), [slides.length])

  useEffect(() => {
    if (slides.length <= 1) return
    const id = setInterval(next, 6000)
    return () => clearInterval(id)
  }, [slides.length, next])

  if (slides.length === 0) return null

  const slide = slides[index]

  return (
    <section className="relative overflow-hidden">
      <div key={`${slide.id}-${index}`} className="flex">
        <div className="relative w-full aspect-[16/9] sm:aspect-[21/8]">
          {slide.image && (
            <Image src={slide.image} alt={pickLocal(locale, slide.title, slide.titleEn)} fill priority className="object-cover" unoptimized />
          )}
          <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-transparent" />
          <div className="absolute inset-0 flex items-center">
            <div className="mx-auto w-full max-w-7xl px-4">
              <div className="max-w-xl text-white">
                <h1 className="text-3xl font-bold leading-tight sm:text-5xl">
                  {pickLocal(locale, slide.title, slide.titleEn)}
                </h1>
                {slide.subtitle && (
                  <p className="mt-3 text-sm text-white/85 sm:text-lg">{pickLocal(locale, slide.subtitle, slide.subtitleEn)}</p>
                )}
                <div className="mt-6">
                  <Button asChild size="lg" className="bg-white text-black hover:bg-white/90">
                    <Link href={slide.link ?? '/catalogue'}>{shopLabel}</Link>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {slides.length > 1 && (
        <>
          <button onClick={prev} className="absolute left-3 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-white/15 text-white backdrop-blur hover:bg-white/25" aria-label="Previous">
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button onClick={next} className="absolute right-3 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-white/15 text-white backdrop-blur hover:bg-white/25" aria-label="Next">
            <ChevronRight className="h-5 w-5" />
          </button>
          <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-2">
            {slides.map((s, i) => (
              <button key={s.id} onClick={() => setIndex(i)} className={`h-2 rounded-full transition-all ${i === index ? 'w-6 bg-white' : 'w-2 bg-white/50'}`} aria-label={`Slide ${i + 1}`} />
            ))}
          </div>
        </>
      )}
    </section>
  )
}
