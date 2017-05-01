const { ARRAY_TOGGLE, MERGE, SET, transform } = require('./transform.js')
const { eachKey, filterKeys } = require('./helpers.js')
const htmlTags = require('./tags.js')

const svl = ({ specRenderTransform = x => x }) => {
  const svl = {}

  const mergeSpec = (...specs) => [...specs].reduce(
    (finalSpec, newSpec) =>
      transform({
        op: MERGE,
        spec: newSpec
      }, finalSpec)
    ,
    {}
  )

  const newSpec = (...args) => {
    const newSpec = {}
    let i = 0

    if (args.length === 1) {
      const arg = args[0]

      if (typeof arg === 'string') {
        return { class: arg }
      }

      return arg
    }

    if (typeof args[i] === 'string') {
      newSpec.class = args[i]
      i++
    }

    if (!args[i].isComponent && typeof args[i] !== 'string') {
      Object.assign(newSpec, args[i])
      i++
    }

    newSpec.children = args.slice(i)
    return newSpec
  }

  const split = s => s ? s.split(' ') : []

  const mergeClasses = (oldClass, newClass) => {
    return split(newClass).reduce((mergedClass, className) =>
      transform({
        op: ARRAY_TOGGLE,
        spec: className
      }, mergedClass)
    , split(oldClass)).join(' ')
  }

  const pushOrCreate = (o, k, v) => {
    const xs = o[k] || []
    xs.push(v)
    return xs
  }

  const parseAnchors = spec => {
    const listeners = {}
    eachKey(
      (key, value) => {
        if (value && value.isAnchor) {
          const name = value.getName()
          listeners[name] = pushOrCreate(
            listeners,
            name,
            [key]
          )
          delete spec[key]
        }
      },
      spec
    )
    ; (spec.children || []).forEach((child, i) => {
      if (child.isAnchor) {
        const name = child.getName()
        listeners[name] = pushOrCreate(
          listeners,
          name,
          ['children', i]
        )
        spec.children.splice(i, 1)
      }
    })
    spec.updateListeners = Object.assign(spec.updateListeners || {}, listeners)
  }

  const createComponentFactory = (oldSpec = {}) => (...args) => {
    const specPassed = newSpec(...args)
    specPassed.class = mergeClasses(oldSpec.class, specPassed.class)
    parseAnchors(specPassed)
    oldSpec.children = (oldSpec.children || [])
      .map(child => child.isComponent ? child.update(specPassed.props) : child)
    return component(mergeSpec(oldSpec, specPassed)).update(specPassed.props)
  }

  const makeComponent = tag => createComponentFactory({ tag })
  svl.makeComponent = makeComponent

  const anchor = name => {
    const self = component({ name })

    const getName = () => name
    self.getName = getName

    self.isAnchor = true

    const getHtml = () => ''
    self.getHtml = getHtml

    return self
  }
  svl.anchor = anchor

  const component = spec => {
    const self = createComponentFactory(spec)

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
      eachKey(
        (name, value) => {
          if (updateListeners[name]) {
            updateListeners[name].forEach(path => {
              updates.push({ path, value: props[name] })
            })
          }
        },
        props
      )
      const newSpec = updates.reduce(applyUpdate, spec)

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

    return self
  }
  svl.component = component

  Object.assign(
    svl,
    htmlTags.reduce((builders, tag) => {
      builders[tag] = makeComponent(tag)
      return builders
    }, {})
  )

  return svl
}

module.exports = svl
