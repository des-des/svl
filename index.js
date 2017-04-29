const fs = require('fs')
const path = require('path')
const css = require('css')

// (o => str => o) => o => o
const reduceKeys = f => o => Object.keys(o).reduce(f, Object.create(null))

// (str => o => { str, a }) => o => o
const mapKeys = f => o => reduceKeys((acc, k) => {
  const { key, value } = f(k)(o)
  // console.log({value});
  return setMut(key, value, acc)
})(o)

const isSingleClassSelector = selector =>
  selector.length === 1 && selector[0][0] === '.'

fL = x => { console.log(x); return x }
fLL = label => x => {console.log(label); console.log(x); return x }

const decsToStyleNoTrim = decs => (decs
  .filter(dec => dec.type === 'declaration' || dec.length)
  .reduce((style, dec) => dec.length ? `${style}${decsToStyle(dec)}` : `${style}${dec.property}: ${dec.value}; `, '')
)

const decsToStyle = decs => (decs
  .filter(dec => dec.type === 'declaration' || dec.length)
  .reduce((style, dec) => dec.length ? `${style}${decsToStyleNoTrim(dec)}` : `${style}${dec.property}: ${dec.value}; `, '')
  .trim()
)
const setMut = (k, v, o) => { o[k] = v; return o }

const cssToTokens = rawCss => css.parse(rawCss).stylesheet.rules
  .filter(rule => rule.type == 'rule')
  .filter(rule => isSingleClassSelector(rule.selectors))
  .map(rule => ({
    name: rule.selectors[0].slice(1),
    declarations: rule.declarations
  }))
  .reduce((cssMap, rule) =>
    setMut(rule.name, rule.declarations, cssMap),
    Object.create(null))

const tag = name => style => innerHtml =>
  `<${name} style="${style}">${innerHtml}</${name}>`

// str => o => o
const toggleStyle = toggle => styles => {
  console.log({styles});
  const { found, newStyles } = styles.reduce(({ newStyles, found }, style) => {
    if (style === toggle) {
      return { found: true, newStyles }
    }
    return { found, newStyles: newStyles.concat(style) }
  }, { found: false, newStyles: []})

  return found ? newStyles : newStyles.concat(toggle)
}
//
// mapKeys(k => o => ({
//   key: k,
//   value: k === toggleKey ? !o[k] : o[k]
// }))

const initComponent = engine => {
  const component = config => {
    const component = initComponent(engine)
    console.log(config);
    const createStyleToggler = key => styles => ({
      key: key,
      value: () => component(Object.assign({}, config, {style: toggleStyle(key)(config.style) }))
    })

    const styleTogglers = mapKeys(createStyleToggler)(engine.style)

    // console.log(styleT);

    const styleStr = decsToStyle(config.style.map(className =>
        engine.style[className]))

    const render = () => (tag
      (config.tag)
      (styleStr)
      (config.children.map(child => child.render ? child.render() : child)))

    return { render, sty: styleTogglers }
  }

  return component
}

const go = config => {
  const cssTokens = cssToTokens(config.style)

  return initComponent({ style: cssTokens })
  // const div = component({ tag: 'div', style: ['fl', 'w-100', 'w-50'], children: [] })
  // console.log(div.render());
}

const tachyonsPath = path.join(
  __dirname,
  'node_modules',
  'tachyons',
  'css',
  'tachyons.css'
)

const tachyons = fs.readFileSync(tachyonsPath, 'utf8')

go({ style: tachyons })

module.exports = {
  decsToStyle,
  svl: go({ style: tachyons })
}
