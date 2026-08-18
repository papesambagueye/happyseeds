'use client'
import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'

function getParts(ms: number) {
  const total = Math.max(0, Math.floor(ms / 1000))
  const d = Math.floor(total / 86400)
  const h = Math.floor((total % 86400) / 3600)
  const m = Math.floor((total % 3600) / 60)
  const s = total % 60
  return { d, h, m, s }
}

function pad(n: number) {
  return String(n).padStart(2, '0')
}

/**
 * Live countdown to a target date. Unit = "j/h/m/s". When the target has
 * passed (or is missing) the timer shows zeros / an ended state.
 */
export function CountdownTimer({
  target,
  label,
  className,
  onEnd,
}: {
  target: string | Date | number | null | undefined
  label?: string
  className?: string
  onEnd?: () => void
}) {
  const targetMs = target ? new Date(target).getTime() : 0
  const [now, setNow] = useState(0)

  useEffect(() => {
    if (!targetMs) return
    const update = () => setNow(Date.now())
    update()
    const id = setInterval(update, 1000)
    return () => clearInterval(id)
  }, [targetMs])

  const ended = !targetMs || targetMs <= now
  useEffect(() => {
    if (ended && onEnd) onEnd()
  }, [ended, onEnd])

  if (!targetMs) return null
  const { d, h, m, s } = getParts(targetMs - now)

  const cells = [
    { v: d, l: label === 'short' ? 'j' : 'jours' },
    { v: h, l: 'h' },
    { v: m, l: 'min' },
    { v: s, l: 's' },
  ]

  return (
    <span className={cn('inline-flex items-center gap-1 font-variant-numeric tabular-nums', className)}>
      {ended ? (
        <span className="font-medium">Offre terminée</span>
      ) : (
        cells.map((c, i) => (
          <span key={i} className="inline-flex items-center gap-1">
            <span className="rounded-md bg-foreground px-1.5 py-0.5 text-xs font-bold text-background">{pad(c.v)}</span>
            <span className="text-[10px] uppercase text-muted-foreground">{c.l}</span>
          </span>
        ))
      )}
    </span>
  )
}
