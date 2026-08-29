import assert from 'node:assert/strict'
import test from 'node:test'

import { validatePromotionPrice } from './promo-rules'
import { excludeHiddenProductIds, filterCatalogRowsForStorefront } from './catalog-storefront'

test('catalog storefront excludes flash-sale standalone products', () => {
  const rows = [
    { id: 'p1', published: 1 },
    { id: 'p2', published: 1 },
    { id: 'p3', published: 0 },
  ]

  const filtered = filterCatalogRowsForStorefront(rows, new Set(['p2']))

  assert.deepEqual(filtered.map((row) => row.id), ['p1'])
})

test('promotion rows also exclude active flash-sale products', () => {
  const rows = [
    { id: 'p1', published: 1 },
    { id: 'p2', published: 1 },
    { id: 'p3', published: 1 },
  ]

  const filtered = excludeHiddenProductIds(rows, new Set(['p2']))

  assert.deepEqual(filtered.map((row) => row.id), ['p1', 'p3'])
})

test('promotion price must be lower than the regular price', () => {
  assert.doesNotThrow(() => validatePromotionPrice(100000, 70000))
  assert.throws(() => validatePromotionPrice(100000, 100000), /inférieur au prix actuel/)
  assert.throws(() => validatePromotionPrice(100000, 110000), /inférieur au prix actuel/)
})
