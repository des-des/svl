const eachKey = (f, o) => Object.keys(o).forEach(k => f(k, o[k]))

const mapKeys = (f, o) => {
  const out = Object.create(null)
  eachKey((oldKey, oldValue) => {
    const { key, value } = f(oldKey, oldValue)
    out[key] = value
  }, o)
  return out
}

const filterKeys = (keys, o) => {
  const filtered = []
  eachKey(k => {
    if (!keys.includes(k)) {
      filtered[k] = o[k]
    }
  }, o)
  return filtered
}

module.exports = {
  eachKey,
  mapKeys,
  filterKeys
}
