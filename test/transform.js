const test = require('tape')

const { transform, MERGE, ARRAY_TOGGLE, SET } = require('../lib/transform.js')

test('transform', t => {
  t.deepEqual(
    transform({}, { k: 'v' }),
    { k: 'v' },
    'emtpy transform does nothing'
  )

  t.end()
})

test('transform MERGE', t => {
  t.deepEqual(
    transform(
      { op: MERGE, spec: { k: 'v' } },
      {}
    ),
    { k: 'v' },
    'simple merge sets key on empty object'
  )

  t.deepEqual(
    transform(
      { op: MERGE, spec: { k1: { k2: 'v' } } },
      {}
    ),
    { k1: { k2: 'v' } },
    'deeper merge sets key on empty object'
  )

  t.deepEqual(
    transform(
      { op: MERGE, spec: { k2: 'v2' } },
      { k1: 'v1' }
    ),
    { k1: 'v1', k2: 'v2' },
    'simple merge sets key on populated object'
  )

  t.deepEqual(
    transform(
      { op: MERGE, spec: { k1: { k2: 'v' } } },
      { k1: { k3: 'v2' } }
    ),
    { k1: { k2: 'v', k3: 'v2' } },
    'deeper merge sets key on populated object'
  )

  t.end()
})

test('transform ARRAY_TOGGLE', t => {
  t.deepEqual(
    transform(
      { op: ARRAY_TOGGLE, spec: 'eoin' },
      ['eoin']
    ),
    [],
    'can toggle away single element'
  )

  t.deepEqual(
    transform(
      { op: ARRAY_TOGGLE, spec: 'des' },
      ['des', 'des']
    ),
    [],
    'can toggle away multiple elements'
  )

  t.deepEqual(
    transform(
      { op: ARRAY_TOGGLE, spec: 'des' },
      []
    ),
    ['des'],
    'missing element is added'
  )

  t.end()
})

test('transform SET', t => {
  t.deepEqual(
    transform(
      { op: SET, spec: { path: ['arr', 0], value: 'v' } },
      { arr: [] }
    ),
    { arr: ['v'] },
    'can toggle away single element'
  )
  t.end()
})

test('transform MERGE with nested ARRAY_TOGGLE', t => {
  t.deepEqual(
    transform(
      {
        op: MERGE,
        spec: { k1: { op: ARRAY_TOGGLE, spec: 'des' } }
      },
      { k1: ['des'] }
    ),
    { k1: [] },
    'deeper merge sets key on populated object'
  )

  t.end()
})
