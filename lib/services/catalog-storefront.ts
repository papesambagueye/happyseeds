type CatalogRowLike = {
  id: string
  published?: number | boolean
}

export function filterCatalogRowsForStorefront<T extends CatalogRowLike>(
  rows: T[],
  hiddenProductIds: Set<string>
): T[] {
  return rows.filter((product) => {
    if (product.published !== undefined && product.published !== 1 && product.published !== true) return false
    return !hiddenProductIds.has(product.id)
  })
}

export function excludeHiddenProductIds<T extends { id: string }>(
  rows: T[],
  hiddenProductIds: Set<string>
): T[] {
  return rows.filter((row) => !hiddenProductIds.has(row.id))
}
