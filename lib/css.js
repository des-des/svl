const fs = require('fs')
const path = require('path')
const css = require('css')

const ruleStyle = rule => rule.declarations
  .filter(dec => dec.type === 'declaration' || dec.length)
  .reduce((style, dec) => `${style}${dec.property}: ${dec.value}; `, '')

const tachyonsDistPath = path.join(
  __dirname,
  '..',
  '..',
  'tachyons',
  'css',
  // 'node_modules',
  // 'tachyons',
  // 'css',
  'tachyons.min.css'
)

const tachyonsDist = fs.readFileSync(tachyonsDistPath, 'utf8')

const set = (k, v, o) => { o[k] = v; return o }

const createTachyonsInliner = () => {
  const tachyonsPath = path.join(
    __dirname,
    '..',
    'node_modules',
    'tachyons',
    'css',
    'tachyons.css'
  )

  const tachyons = fs.readFileSync(tachyonsPath, 'utf8')

  const tackyonsTokens = cssToTokens(tachyons)

  return spec => {
    if (typeof spec.class !== 'string') return spec

    const classList = spec.class.split(' ')
    delete spec.class

    spec.style = classList.reduce((style, className) =>
      style + (tackyonsTokens[className] || ''), '')

    return spec
  }
}

const isSingleClassSelector = selector =>
  selector.length === 1 && selector[0][0] === '.'

const cssToTokens = rawCss => {
  const validRules = css.parse(rawCss).stylesheet.rules
  .filter(rule => rule.type === 'rule')
  .filter(rule => isSingleClassSelector(rule.selectors))

  return validRules.reduce(
    (styles, rule) => set(
      rule.selectors[0].slice(1),
      ruleStyle(rule),
      styles
    ),
    {}
  )
}

module.exports = {
  createTachyonsInliner,
  tachyonsDist
}
