const fs = require('fs')
const path = require('path')
const css = require('css')

const ruleStyle = rule => rule.declarations
  .filter(dec => dec.type === 'declaration' || dec.length)
  .reduce((style, dec) => `${style}${dec.property}: ${dec.value}; `, '')

const tachyonsPath = path.join(
  __dirname,
  '..',
  'node_modules',
  'tachyons',
  'css',
  'tachyons.css'
)

const tachyons = fs.readFileSync(tachyonsPath, 'utf8')

const set = (k, v, o) => { o[k] = v; return o }

const isSingleClassSelector = selector =>
  selector.length === 1 && selector[0][0] === '.'

const cssToTokens = rawCss => {
  const validRules = css.parse(rawCss).stylesheet.rules
  .filter(rule => rule.type == 'rule')
  .filter(rule => isSingleClassSelector(rule.selectors))

  return validRules.reduce(
    (styles, rule) => set(
      rule.selectors[0].slice(1),
      ruleStyle(rule),
      styles
    ),
    Object.create(null)
  )
}

module.exports = {
  tachyons: cssToTokens(tachyons)
}
