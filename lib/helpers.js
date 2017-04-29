const eachKey = (f, o) => Object.keys(o).forEach(k => f(k, o[k]))

const mapKeys = (f, o) => {
  const out = Object.create(null)
  eachKey((oldKey, oldValue) => {
    const { key, value } = f(oldKey, oldValue)
    out[key] = value }, o)
  return out
}

module.exports = {
  eachKey,
  mapKeys
}
