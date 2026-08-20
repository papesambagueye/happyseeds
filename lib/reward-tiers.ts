export const REWARD_TIERS = [
  { points: 30, maxPrice: 500000, label: 'Produit jusqu’à 5 000 FCFA' },
  { points: 50, maxPrice: 1000000, label: 'Produit jusqu’à 10 000 FCFA' },
  { points: 100, maxPrice: 1500000, label: 'Produit jusqu’à 15 000 FCFA' },
] as const

export function getRewardTier(price: number) {
  return REWARD_TIERS.find((tier) => price <= tier.maxPrice) ?? null
}