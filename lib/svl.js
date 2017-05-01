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

  const parseArgs = (...args) => {
    if (args.length === 0) return {}

    if (args.length === 1) {
      if (typeof args[0] === 'string') return { children: [args[0]] }
    }

    const newSpec = {}
    let i = 0
    while (i < args.length) {
      const next = args[i]
      if (typeof next === 'string' && i === 0) {
        newSpec.class = next
        i++
      } else if (!next.isComponent && typeof next !== 'string') {
        Object.assign(newSpec, next)
        i++
      } else {
        break
      }
    }

    if (args.length > i) {
      newSpec.children = args.slice(i)
    }
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

  const componentBuilder = (componentFactory, component, ...args) => {
    const newSpec = parseArgs(...args)
    const oldSpec = component.getSpec()

    const newClass = mergeClasses(oldSpec.class, newSpec.class)
    if (newClass) newSpec.class = newClass
    parseAnchors(newSpec)

    const finalSpec = mergeSpec(oldSpec, newSpec)
    return componentFactory(mergeSpec(finalSpec), newSpec.props)
  }

  const setApplyFactory = (combinationFactory, oldFactory) => {
    const setApply = instance => {
      const newFactory = (...args) => {
        const newInstance = combinationFactory(oldFactory, instance, ...args)
        return setApply(newInstance)
      }
      return Object.assign(
        newFactory,
        instance
      )
    }
    return setApply
  }

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

    return props ? self.update(props) : self
  }
  svl.component = component

  const makeApplyFactory = setApplyFactory(componentBuilder, component)

  const makeComponent = tag => makeApplyFactory(component({ tag }))
  svl.makeComponent = makeComponent

  const htmlDocument = (spec, props) => {
    if (!spec.children || spec.children[0] !== '<!doctype html>\n') {
      spec.children = ['<!doctype html>\n', ...(spec.children || [])]
    }
    const self = component(spec, props)

    const getHtml = () => self.getChildHtml()
    self.getHtml = getHtml

    return self
  }
  svl.htmlDocument = setApplyFactory(componentBuilder, htmlDocument)(htmlDocument({}))

  const text = str => makeApplyFactory(component({ innerHtml: str }))
  svl.text = text

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
