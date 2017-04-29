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

const initComponent = engine => {
  const component = config => {
    console.log(config);
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
        children && children.map(child => child.render ? child.render() : child)

    const render = () =>
      tag(config.tag, props, renderChildren(config.children))

    return { render, sty: styleTogglers }
  }

  const styleToggler = (key, config) =>
    component(transform(styleToggleSpec(key)), config)

  return component
}

module.exports = {
  svl: initComponent({ style: tachyons })
}
