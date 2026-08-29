type CatalogRowLike = {
  id: string
  published: number | boolean
}

export function filterCatalogRowsForStorefront<T extends CatalogRowLike>(
  rows: T[],
  hiddenProductIds: Set<string>
): T[] {
  return rows.filter((product) => product.published === 1 && !hiddenProductIds.has(product.id))
}
