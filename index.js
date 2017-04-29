const { MERGE, ARRAY_TOGGLE, transform } = require('./lib/transform.js')
const { eachKey, mapKeys } = require('./lib/helpers.js')
const { tachyons } = require('./lib/css.js')

const tag = name => style => innerHtml =>
  `<${name} style="${style}">${innerHtml}</${name}>`

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
    const styleTogglers = mapKeys(
      (key, value) => ({
        key,
        value: () => component(transform(styleToggleSpec(key), config))
      }),
      engine.style
    )

    const styleStr = config.style
      .reduce(
        (styleStr, className) => styleStr + engine.style[className],
        ''
      )
      .trim()

      const renderChildren = children =>
        children.map(child => child.render ? child.render() : child)

    const render = () =>
      tag(config.tag)(styleStr)(renderChildren(config.children))

    return { render, sty: styleTogglers }
  }

  const styleToggler = (key, config) =>
    component(transform(styleToggleSpec(key)), config)

  return component
}

module.exports = {
  svl: initComponent({ style: tachyons })
}
