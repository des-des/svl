const { MERGE, ARRAY_TOGGLE, transform } = require('./transform.js')
const { eachKey, mapKeys } = require('./helpers.js')
const { tachyons } = require('./css.js')

const tag = (tag, props, innerHtml) => {
  const propsStr = Object.keys(props)
    .map(key => ({key, value: props[key]}))
    .map(({ key, value }) => value ? `${key}="${value}"` : key)
    .reduce((html, prop) => html + prop, '')
    .trim()

  return `<${tag} ${propsStr}>${innerHtml || ''}</${tag}>`
}

const styleToggleSpec = key => ({
  op: MERGE,
  spec: {
    style: {
      op: ARRAY_TOGGLE,
      spec: key
    }
  }
})

const componentBuilder = component => tag => (config = {}) => (...args) => {
  const newConfig = {}
  newConfig.tag = tag

  if (typeof args[0] === 'string') {
    newConfig.style = args[0]
    parseArgs(newConfig, ...args.slice(1))
  } else {
    parseArgs(newConfig, ...args)
  }

  if (typeof newConfig.style === 'string') {
    newConfig.style = newConfig.style.split(' ')
  }
  newConfig.style = (newConfig.style || []).reduce(
    (newStyle, className) => transform({
      op: ARRAY_TOGGLE,
      spec: className
    }, newStyle), config.style || [])

  return component(Object.assign({}, config, newConfig))
}

const getTagAttributes = (stylesheet, config) => {
  const internals = ['children', 'tag']
  const attr = {}

  eachKey(k => {
    if (!internals.includes(k)) {
      attr[k] = config[k]
    }
  }, config)

  attr.style = config.style
    .reduce((styleStr, className) => styleStr + stylesheet[className], '')
    .trim()

  return attr
}

const svl = ({ stylesheet }) => {
  const component = config => {

    const self = componentBuilder(component)(config.tag)(config)

    self.config = config

    const styleTogglers = mapKeys(
      (key, value) => ({
        key,
        value: () => component(transform(styleToggleSpec(key), config))
      }),
      stylesheet
    )
    self.sty = styleTogglers

    const renderChildren = children =>
        children && children.map(child =>
          child.render ? child.render() : child).join('')

    const render = () => tag(
      config.tag,
      getTagAttributes(stylesheet, config),
      renderChildren(config.children)
    )
    self.render = render

    self.isComponent = true

    self.json = () => {
      return JSON.stringify(
        config,
        (k, v) => {
          return v.isComponent ? v.config : v
        },
        4
      )
    }

    return self
  }

  return {
    component,
    componentBuilder: tag => componentBuilder(component)(tag)()
  }
}

const parseArgs = (result, first, ...args) => {
  if (first === undefined) return result

  if (typeof first === 'object' && !first.isComponent) {
    return parseArgs(Object.assign(result, first), ...args)
  }
  result.children = [first, ...args]
}

module.exports = svl({ stylesheet: tachyons })
