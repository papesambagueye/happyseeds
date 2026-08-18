import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatPrice(cents: number, currency: string): string {
  return `${(cents / 100).toLocaleString('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 2 })} ${currency}`
}

export function formatDate(input: string | Date, locale = 'fr'): string {
  const d = typeof input === 'string' ? new Date(input) : input
  return d.toLocaleDateString(locale, { day: 'numeric', month: 'short', year: 'numeric' })
}
