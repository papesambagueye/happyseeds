export const REWARD_TIERS = [
  { points: 30, maxPrice: 6000, label: 'Produit jusqu’à 6 000 FCFA' },
  { points: 50, maxPrice: 12000, label: 'Produit jusqu’à 12 000 FCFA' },
  { points: 100, maxPrice: 23000, label: 'Produit jusqu’à 23 000 FCFA' },
] as const

export function getRewardTier(price: number) {
  return REWARD_TIERS.find((tier) => price <= tier.maxPrice) ?? null
}