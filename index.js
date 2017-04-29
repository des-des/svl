const { MERGE, ARRAY_TOGGLE, transform } = require('./lib/transform.js')
const { eachKey, mapKeys } = require('./lib/helpers.js')
const { tachyons } = require('./lib/css.js')

const tag = (tag, props, innerHtml) => {
  const propsStr = Object.keys(props)
    .map(key => ({key, value: props[key]}))
    .map(({ key, value}) => value ? `${key}="${value}"` : key)
    .reduce((html, prop) => html + prop, '')
    .trim()

  return `<${tag} ${propsStr}>${innerHtml}</${tag}>`
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

const svl = engine => {
  componentBuilder = tag => (...args) => {
    const config = Object.create(null)
    config.tag = tag

    if (args.length === 1)  {
      config.children = [args[0]]
      return component(config)
    }

    if (typeof args[0] === 'string') {
      config.style = args[0]
      return component(parseArgs(config, ...args.slice(1)))
    }

    return component(parseArgs(config, ...args))
  }


  const component = config => {
    if (typeof config.style === 'string') {
      config.style = config.style.split(' ')
    }
    if (!config.style) config.style = []

    const internals = ['children', 'tag']
    const props = Object.create(null)
    eachKey(k => {
      if (!internals.includes(k)) {
        props[k] = config[k]
      }
    }, config)

    const styleTogglers = mapKeys(
      (key, value) => ({
        key,
        value: () => component(transform(styleToggleSpec(key), config))
      }),
      engine.style
    )

    props.style = props.style
      .reduce(
        (styleStr, className) => styleStr + engine.style[className],
        ''
      )
      .trim()

      const renderChildren = children =>
        children && children.map(child =>
          child.render ? child.render() : child).join('')

    const render = () => {
      return tag(config.tag, props, renderChildren(config.children))
    }
    return { render, sty: styleTogglers, isComponent: true }
  }

  const styleToggler = (key, config) =>
    component(transform(styleToggleSpec(key)), config)

  return { component, componentBuilder }
}

const parseArgs = (result, first, ...args) => {
  if (first === undefined) return result

  if (typeof first === 'object' && !first.isComponent) {
    return parseArgs(Object.assign(result, first), ...args)
  }
  result.children = [first, ...args]
  return result
}

module.exports = svl({ style: tachyons })
