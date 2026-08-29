import { AppError } from '@/lib/errors'

export function validatePromotionPrice(productPrice: number, promotionalPrice: number) {
  if (!Number.isFinite(productPrice) || productPrice <= 0) {
    throw new AppError('Le prix actuel du produit est invalide', 400)
  }
  if (!Number.isInteger(promotionalPrice) || promotionalPrice <= 0) {
    throw new AppError('Le nouveau prix doit être un montant FCFA positif', 400)
  }
  if (promotionalPrice >= productPrice) {
    throw new AppError('Le prix promotionnel doit être inférieur au prix actuel', 400)
  }
  return true
}
