export const FREE_DELIVERY_THRESHOLD = 1500000
export const DELIVERY_FEE = 100000

export function getDeliveryFee(subtotal: number): number {
  return subtotal > FREE_DELIVERY_THRESHOLD ? 0 : DELIVERY_FEE
}
