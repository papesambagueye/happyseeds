import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatPrice(amount: number, currency: string): string {
  return `${amount.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} ${currency}`
}

export function formatDate(input: string | Date, locale = 'fr'): string {
  const d = typeof input === 'string' ? new Date(input) : input
  return d.toLocaleDateString(locale, { day: 'numeric', month: 'short', year: 'numeric' })
}
