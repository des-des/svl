const { eachKey } = require('./helpers.js')

const MERGE = 'MERGE'
const ARRAY_TOGGLE = 'ARRAY_TOGGLE'
const SET = 'SET'

const transform = (spec, input) => {
  const op = transformers[spec.op]
  if (!op) return input

  return op(spec.spec, input)
}

const set = ({ path, value }, input) => {
  if (path.length === 0) return input

  const newInput = Array.isArray(input) ? input.slice(0) : Object.assign({}, input)
  const key = path[0]
  if (path.length === 1) {
    newInput[key] = value
    return newInput
  }
  newInput[key] = set({
    path: path.slice(1),
    value
  }, newInput[key])

  return newInput
}

const merge = (spec, input) => {
  if (spec.op) {
    return transform(spec, input)
  }

  const newInput = Object.assign({}, input)

  eachKey((key, innerSpec) => {
    if (
      typeof innerSpec !== 'object' ||
      Array.isArray(innerSpec) ||
      innerSpec === null
    ) {
      newInput[key] = innerSpec
      return
    }

    if (input[key] === undefined) {
      newInput[key] = {}
    }

    newInput[key] = merge(innerSpec, newInput[key])
  }, spec)

  return newInput
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
  [ARRAY_TOGGLE]: arrayToggle,
  [SET]: set
}

module.exports = {
  transform,
  SET,
  MERGE,
  ARRAY_TOGGLE
}
