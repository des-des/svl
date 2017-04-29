const test = require('tape')

const {
  decsToStyle
} = require('./')

test('decsToStyle', t => {
  t.equal(
    decsToStyle([]),
    '',
    'empty decs gives empty style'
  )
  t.equal(
    decsToStyle([{ type: 'declaration', property: 'p', value: 'v' }]),
    'p: v;',
    'single dec gives correct style'
  )

  t.equal(
    decsToStyle([
      { type: 'declaration', property: 'p', value: 'v' },
      { type: 'declaration', property: 'p2', value: 'v2' }
    ]),
    'p: v; p2: v2;',
    'pair also works'
  )
  t.equal(
    decsToStyle([
      [{ type: 'declaration', property: 'p', value: 'v' }],
      { type: 'declaration', property: 'p2', value: 'v2' }
    ]),
    'p: v; p2: v2;',
    'works with nested arrays'
  )
  t.end()
})
