import assert from 'node:assert/strict'
import test from 'node:test'

import { filterCatalogRowsForStorefront } from './catalog-storefront'

test('catalog storefront excludes flash-sale standalone products', () => {
  const rows = [
    { id: 'p1', published: 1 },
    { id: 'p2', published: 1 },
    { id: 'p3', published: 0 },
  ]

  const filtered = filterCatalogRowsForStorefront(rows, new Set(['p2']))

  assert.deepEqual(filtered.map((row) => row.id), ['p1'])
})
