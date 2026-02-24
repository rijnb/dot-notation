export function flatten(jsonString) {
  const arr = JSON.parse(jsonString)
  if (!Array.isArray(arr)) {
    throw new TypeError('Input must be a JSON array')
  }

  const paths = []

  function flattenElement(element) {
    if (element === null || typeof element !== 'object') {
      paths.push(String(element))
    } else {
      flattenObject(element, '')
    }
  }

  function flattenObject(obj, prefix) {
    if (Array.isArray(obj)) {
      for (const element of obj) {
        if (element !== null && typeof element === 'object') {
          flattenObject(element, prefix)
        } else if (element === null) {
          paths.push(prefix)
        } else {
          paths.push(prefix ? `${prefix}.${String(element)}` : String(element))
        }
      }
    } else {
      for (const [key, value] of Object.entries(obj)) {
        const path = prefix ? `${prefix}.${key}` : key
        if (value !== null && typeof value === 'object') {
          flattenObject(value, path)
        } else if (value === null) {
          paths.push(path)
        } else {
          paths.push(`${path}.${String(value)}`)
        }
      }
    }
  }

  for (const element of arr) {
    flattenElement(element)
  }

  return paths.join(', ')
}

export function unflatten(dotNotation) {
  if (dotNotation === '') {
    return '[]'
  }

  const items = dotNotation.split(', ')
  const result = []
  let currentObj = null

  function tryMerge(obj, keys, value) {
    let node = obj
    for (let i = 0; i < keys.length; i++) {
      const key = keys[i]
      if (i === keys.length - 1) {
        if (!(key in node)) {
          node[key] = value
          return true
        }
        const existing = node[key]
        if (Array.isArray(existing)) {
          existing.push(value)
          return true
        }
        if (typeof existing === 'string') {
          node[key] = [existing, value]
          return true
        }
        return false
      }
      if (!(key in node)) {
        node[key] = {}
        node = node[key]
      } else if (typeof node[key] === 'object' && node[key] !== null && !Array.isArray(node[key])) {
        node = node[key]
      } else {
        return false
      }
    }
    return true
  }

  for (const item of items) {
    const parts = item.split('.')
    if (parts.length === 1) {
      if (currentObj !== null) {
        result.push(currentObj)
        currentObj = null
      }
      result.push(parts[0])
    } else {
      const keys = parts.slice(0, -1)
      const value = parts[parts.length - 1]
      if (currentObj !== null && tryMerge(currentObj, keys, value)) {
        continue
      }
      if (currentObj !== null) {
        result.push(currentObj)
      }
      currentObj = {}
      tryMerge(currentObj, keys, value)
    }
  }

  if (currentObj !== null) {
    result.push(currentObj)
  }

  return JSON.stringify(result)
}
