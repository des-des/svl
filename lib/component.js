const { ARRAY_TOGGLE, MERGE, transform } = require('./transform.js')
const { eachKey, mapKeys, filterKeys } = require('./helpers.js')
const htmlTags = require('./tags.js')

const svl = ({ specRenderTransform = x => x }) => {
  const svl = {}

  const mergeSpec = (...specs) => [...specs].reduce(
    (finalSpec, newSpec) => {
      transform({
        op: MERGE,
        spec: newSpec
      }, finalSpec)
      return finalSpec
    },
    {}
  )

  const newSpec = (...args) => {
    const newSpec = {}
    let i = 0

    if (args.length === 0) return component(oldSpec)

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
    return split(newClass).reduce((mergedClass, className) => {
      const transformOutput = transform({
        op: ARRAY_TOGGLE,
        spec: className
      }, mergedClass)
      return transformOutput
    }, split(oldClass)).join(' ')
  }

  const createComponentFactory = (oldSpec = {}) => (...args) => {
    const specPassed = newSpec(...args)
    specPassed.class = mergeClasses(oldSpec.class, specPassed.class)
    return component(mergeSpec(oldSpec, specPassed))
  }

  const text = text => component({ children: [text], isPlainText: true })
  svl.text = text

  const htmlDocument = (...children) => {
    const childHtml = children.map(child => child.getHtml()).join('')
    return {
      getHtml: () => `<!doctype html>\n${childHtml}`
    }
  }
  svl.htmlDocument = htmlDocument

  const makeComponent = tag => createComponentFactory({ tag })
  svl.makeComponent = makeComponent

  const component = spec => {
    const self = createComponentFactory(spec)

    spec.children = spec.children || []

    const getSpec = () => spec
    self.getSpec = getSpec

    const getHtml = () => {
      if (!spec.tag) return spec.innerHtml

      const innerHtml = spec.children.map(child =>
        typeof child === 'string' ? child : child.getHtml()).join('')

      const tag = spec.tag

      const props = specRenderTransform(
        filterKeys(['children', 'tag'], spec))

      const propsStr = Object.keys(props)
        .map(key => ({key, value: props[key]}))
        .map(({ key, value }) => value !== null ? `${key}="${value}"` : `${key} `)
        .reduce((html, prop) => html + prop, '')
        .trim()

      return `<${tag} ${propsStr}>${innerHtml}</${tag}>`
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
