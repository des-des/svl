const { ARRAY_TOGGLE, transform } = require('./transform.js')
const { eachKey } = require('./helpers.js')
const { tachyons } = require('./css.js')

const tag = (tag, props, innerHtml) => {
  const propsStr = Object.keys(props)
    .map(key => ({key, value: props[key]}))
    .map(({ key, value }) => value ? `${key}="${value}"` : key)
    .reduce((html, prop) => html + prop, '')
    .trim()

  return `<${tag} ${propsStr}>${innerHtml || ''}</${tag}>`
}

const parseArgs = (spec, first, ...args) => {
  if (first === undefined) return spec

  if (typeof first === 'string') {
    spec.style = first
    parseArgs(spec, ...args)
    return
  }

  if (!first.isComponent) {
    parseArgs(Object.assign(spec, first), ...args)
    return
  }

  spec.children = [first, ...args]
}

const mergeStyles = (newStyle, style) => (newStyle || []).reduce(
  (mergedStyles, className) => transform({
    op: ARRAY_TOGGLE,
    spec: className
  }, mergedStyles), style || [])

const componentBuilder = component => tag => (spec = {}) => (...args) => {
  const newSpec = {}
  newSpec.tag = tag

  parseArgs(newSpec, ...args)

  if (typeof newSpec.style === 'string') {
    newSpec.style = newSpec.style.split(' ')
  }

  newSpec.style = mergeStyles(newSpec.style, spec.style)

  newSpec.children = (newSpec.children || [])
    .map(child => child.isComponent ? child.spec : child)

  return component(Object.assign({}, spec, newSpec))
}

const getTagAttributes = (stylesheet, config) => {
  const internals = ['children', 'tag']
  const attr = {}

  eachKey(k => {
    if (!internals.includes(k)) {
      attr[k] = config[k]
    }
  }, config)

  attr.style = (config.style || [])
    .reduce((styleStr, className) => styleStr + stylesheet[className], '')
    .trim()

  return attr
}

const svl = ({ stylesheet }) => {
  const renderChildren = children => (children || [])
    .map(child => render(child)).join('')

  const render = spec => typeof spec === 'string' ? spec : tag(
    spec.tag,
    getTagAttributes(stylesheet, spec),
    renderChildren(spec.children)
  )

  const text = text => component({ children: [text] })

  const makeComponent = tag => componentBuilder(component)(tag)()

  const component = spec => {
    const self = componentBuilder(component)(spec.tag)(spec)

    self.spec = spec

    const html = () => render(spec)
    self.html = html

    self.isComponent = true

    return self
  }

  const components = {}
  require('./tags.js').forEach(tag => {
    components[tag] = makeComponent(tag)
  })

  return Object.assign(components, {
    component,
    makeComponent,
    text
  })
}

module.exports = svl({ stylesheet: tachyons })
