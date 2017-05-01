const { eachKey, filterKeys } = require('./helpers.js')
const { transform, SET } = require('./transform.js')

const initComponent = ({ specRenderTransform = x => x }) => {
  const component = (spec, props) => {
    const self = {}

    const getChildren = () => spec.children || []
    self.getChildren = getChildren

    const getSpec = () => spec
    self.getSpec = getSpec

    const applyUpdate = (spec, update) => transform({
      op: SET,
      spec: update
    }, spec)

    const update = props => {
      if (!props) return self
      const updateListeners = spec.updateListeners || {}

      const updates = []
      const updateNames = []
      eachKey(
        (name, value) => {
          if (updateListeners[name]) {
            updateNames.push(name)
            updateListeners[name].forEach(path => {
              updates.push({ path, value: props[name] })
            })
          }
        },
        props
      )
      const newSpec = updates.reduce(applyUpdate, spec)
      updateNames.forEach(name => { delete newSpec[name] })

      const newChildren = newSpec.children
      if (newChildren) {
        newSpec.children = newChildren
          .map(child => child.isComponent ? child.update(props) : child)
      }
      return updates.length ? component(newSpec) : self
    }
    self.update = update

    const getChildHtml = () => getChildren().map(child =>
      typeof child === 'string' ? child : child.getHtml()).join('')
    self.getChildHtml = getChildHtml

    const getHtml = () => {
      if (!spec.tag) return spec.innerHtml

      const innerHtml = self.getChildHtml()

      const tag = spec.tag

      const props = specRenderTransform(
        filterKeys(['children', 'tag', 'props', 'updateListeners'], spec))

      const propsStr = Object.keys(props)
        .map(key => ({key, value: props[key]}))
        .map(({ key, value }) => value !== null ? `${key}="${value}"` : `${key} `)
        .reduce((html, prop) => html + prop, '')
        .trim()

      const tagStr = tag + (propsStr ? ` ${propsStr}` : '')

      return `<${tagStr}>${innerHtml}</${tag}>`
    }
    self.getHtml = getHtml

    const isComponent = true
    self.isComponent = isComponent

    return props ? self.update(props) : self
  }
  return component
}

module.exports = { initComponent }
