const { eachKey } = require('./helpers.js')

const MERGE = 'MERGE'
const ARRAY_TOGGLE = 'ARRAY_TOGGLE'

const transform = (spec, input) => {
  const op = transformers[spec.op]
  if (!op) return input

  return op(spec.spec, input)
}

const merge = (spec, input) => {
  if (spec.op) {
    return transform(spec, input)
  }
  eachKey((key, innerSpec) => {
    if (typeof innerSpec !== 'object') {
      input[key] = innerSpec
      return
    }
    if (input[key] === undefined) input[key] = {}

    input[key] = merge(innerSpec, input[key])
    return input
  }, spec)

  return input
}

const arrayToggle = (spec, input) => {
  let found = false
  const toggled = []

  if (!input.forEach) {
    console.error(`failed to toggle value ${spec} on ${JSON.stringify(input)}`)
    return
  }
  input.forEach(value => {
    if (value === spec) {
      found = true
      return
    }
    toggled.push(value)
  })
  if (!found) toggled.push(spec)
  return toggled
}

const transformers = {
  [MERGE]: merge,
  [ARRAY_TOGGLE]: arrayToggle
}

module.exports = {
  transform,
  MERGE,
  ARRAY_TOGGLE
}
