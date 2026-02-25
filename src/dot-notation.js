export function flatten(jsonString) {
  return flattenInternal(jsonString, true)
}

export function flattenDotOnly(jsonString) {
  return flattenInternal(jsonString, false)
}

function flattenInternal(jsonString, useGrouped) {
  const arr = JSON.parse(jsonString)
  if (!Array.isArray(arr)) {
    throw new TypeError('Input must be a JSON array')
  }

  const elements = []

  function flattenElement(element) {
    if (element === null || typeof element !== 'object') {
      elements.push(String(element))
    } else {
      elements.push(buildTree(element))
    }
  }

  function buildTree(obj) {
    const tree = {}
    collectPaths(obj, [], tree)
    return serializeTree(tree)
  }

  function collectPaths(obj, path, tree) {
    if (Array.isArray(obj)) {
      for (const element of obj) {
        if (element !== null && typeof element === 'object') {
          collectPaths(element, path, tree)
        } else if (element === null) {
          insertPath(tree, path, null)
        } else {
          insertPath(tree, [...path, String(element)], null)
        }
      }
    } else {
      for (const [key, value] of Object.entries(obj)) {
        const newPath = [...path, key]
        if (value !== null && typeof value === 'object') {
          collectPaths(value, newPath, tree)
        } else if (value === null) {
          insertPath(tree, newPath, null)
        } else {
          insertPath(tree, [...newPath, String(value)], null)
        }
      }
    }
  }

  function insertPath(tree, parts, _value) {
    let node = tree
    for (const part of parts) {
      if (!node[part]) {
        node[part] = {}
      }
      node = node[part]
    }
  }

  function serializeTree(tree) {
    const keys = Object.keys(tree)
    if (keys.length === 0) {
      return ''
    }
    if (useGrouped) {
      return keys.map(key => serializeNode(key, tree[key])).join(', ')
    }
    return collectDotPaths(tree).join(', ')
  }

  function serializeNode(name, subtree) {
    const children = Object.keys(subtree)
    if (children.length === 0) {
      return name
    }
    if (children.length === 1) {
      return `${name}.${serializeNode(children[0], subtree[children[0]])}`
    }
    const inner = children.map(child => serializeNode(child, subtree[child])).join(', ')
    return `${name}(${inner})`
  }

  function collectDotPaths(tree, prefix) {
    const paths = []
    for (const key of Object.keys(tree)) {
      const fullKey = prefix ? `${prefix}.${key}` : key
      const children = Object.keys(tree[key])
      if (children.length === 0) {
        paths.push(fullKey)
      } else {
        paths.push(...collectDotPaths(tree[key], fullKey))
      }
    }
    return paths
  }

  for (const element of arr) {
    flattenElement(element)
  }

  return elements.join(', ')
}

export function unflatten(dotNotation) {
  if (dotNotation === '') {
    return '[]'
  }

  const tokens = tokenize(dotNotation)
  const fields = parseFieldList(tokens, 0)
  if (fields.pos !== tokens.length) {
    throw new SyntaxError('Unexpected tokens after field list')
  }

  const result = []
  let currentObj = null

  for (const field of fields.items) {
    if (field.type === 'leaf') {
      if (currentObj !== null) {
        result.push(currentObj)
        currentObj = null
      }
      result.push(field.name)
    } else {
      const obj = fieldToTopLevelObj(field)
      if (currentObj !== null && tryMergeJson(currentObj, obj)) {
        continue
      }
      if (currentObj !== null) {
        result.push(currentObj)
      }
      currentObj = deepCopy(obj)
    }
  }

  if (currentObj !== null) {
    result.push(currentObj)
  }

  return JSON.stringify(result)
}

function fieldToTopLevelObj(field) {
  if (field.type === 'dotField') {
    const child = fieldToJsonValue(field.child)
    return { [field.name]: child }
  }
  if (field.type === 'fieldSet') {
    return { [field.name]: buildFieldSetValue(field.children) }
  }
  return { [field.name]: field.name }
}

function fieldToJsonValue(field) {
  if (field.type === 'leaf') {
    return field.name
  }
  if (field.type === 'dotField') {
    const child = fieldToJsonValue(field.child)
    return { [field.name]: child }
  }
  if (field.type === 'fieldSet') {
    return { [field.name]: buildFieldSetValue(field.children) }
  }
}

function buildFieldSetValue(children) {
  const hasOnlyLeaves = children.every(c => c.type === 'leaf')
  if (hasOnlyLeaves) {
    return children.map(c => c.name)
  }

  const obj = {}
  for (const child of children) {
    mergeFieldInto(obj, child)
  }
  return obj
}

function mergeFieldInto(obj, field) {
  const key = field.name

  if (field.type === 'leaf') {
    if (!(key in obj)) {
      obj[key] = null
    }
    return
  }

  if (field.type === 'dotField') {
    const val = fieldToJsonValue(field.child)
    if (!(key in obj)) {
      obj[key] = val
    } else {
      const existing = obj[key]
      if (typeof existing === 'string' && typeof val === 'string') {
        obj[key] = [existing, val]
      } else if (Array.isArray(existing) && typeof val === 'string') {
        existing.push(val)
      } else if (typeof existing === 'object' && existing !== null && !Array.isArray(existing) &&
                 typeof val === 'object' && val !== null && !Array.isArray(val)) {
        deepMerge(existing, val)
      }
    }
    return
  }

  if (field.type === 'fieldSet') {
    const val = buildFieldSetValue(field.children)
    if (!(key in obj)) {
      obj[key] = val
    } else {
      const existing = obj[key]
      if (typeof existing === 'object' && existing !== null && !Array.isArray(existing) &&
          typeof val === 'object' && val !== null && !Array.isArray(val)) {
        deepMerge(existing, val)
      }
    }
  }
}

function deepMerge(target, source) {
  for (const [key, val] of Object.entries(source)) {
    if (!(key in target)) {
      target[key] = val
    } else {
      const existing = target[key]
      if (typeof existing === 'string' && typeof val === 'string') {
        target[key] = [existing, val]
      } else if (Array.isArray(existing) && typeof val === 'string') {
        existing.push(val)
      } else if (typeof existing === 'object' && existing !== null && !Array.isArray(existing) &&
                 typeof val === 'object' && val !== null && !Array.isArray(val)) {
        deepMerge(existing, val)
      }
    }
  }
}

function tryMergeJson(target, source) {
  for (const [key, val] of Object.entries(source)) {
    if (!(key in target)) {
      target[key] = deepCopy(val)
      continue
    }
    const existing = target[key]
    if (typeof existing === 'string' && typeof val === 'string') {
      target[key] = [existing, val]
      continue
    }
    if (Array.isArray(existing) && typeof val === 'string') {
      existing.push(val)
      continue
    }
    if (typeof existing === 'object' && existing !== null && !Array.isArray(existing) &&
        typeof val === 'object' && val !== null && !Array.isArray(val)) {
      if (!tryMergeJson(existing, val)) return false
      continue
    }
    return false
  }
  return true
}

function deepCopy(val) {
  if (val === null || typeof val !== 'object') return val
  if (Array.isArray(val)) return val.map(deepCopy)
  const result = {}
  for (const [k, v] of Object.entries(val)) {
    result[k] = deepCopy(v)
  }
  return result
}

function tokenize(input) {
  const tokens = []
  let i = 0
  while (i < input.length) {
    if (input[i] === ' ') {
      i++
      continue
    }
    if (input[i] === ',') {
      tokens.push({ type: 'comma' })
      i++
      continue
    }
    if (input[i] === '(') {
      tokens.push({ type: 'open' })
      i++
      continue
    }
    if (input[i] === ')') {
      tokens.push({ type: 'close' })
      i++
      continue
    }
    if (input[i] === '.') {
      tokens.push({ type: 'dot' })
      i++
      continue
    }
    let name = ''
    while (i < input.length && input[i] !== '.' && input[i] !== ',' && input[i] !== '(' && input[i] !== ')' && input[i] !== ' ') {
      name += input[i]
      i++
    }
    if (name) {
      tokens.push({ type: 'name', value: name })
    }
  }
  return tokens
}

function parseFieldList(tokens, pos) {
  const items = []
  const first = parseField(tokens, pos)
  items.push(first.node)
  pos = first.pos

  while (pos < tokens.length && tokens[pos].type === 'comma') {
    pos++
    const next = parseField(tokens, pos)
    items.push(next.node)
    pos = next.pos
  }

  return { items, pos }
}

function parseField(tokens, pos) {
  if (pos >= tokens.length || tokens[pos].type !== 'name') {
    throw new SyntaxError(`Expected name at position ${pos}`)
  }
  const name = tokens[pos].value
  pos++

  if (pos < tokens.length && tokens[pos].type === 'dot') {
    pos++
    const child = parseField(tokens, pos)
    return { node: { type: 'dotField', name, child: child.node }, pos: child.pos }
  }

  if (pos < tokens.length && tokens[pos].type === 'open') {
    pos++
    const fieldSet = parseFieldList(tokens, pos)
    if (pos >= tokens.length || tokens[fieldSet.pos].type !== 'close') {
      throw new SyntaxError(`Expected ')' at position ${fieldSet.pos}`)
    }
    pos = fieldSet.pos + 1
    return { node: { type: 'fieldSet', name, children: fieldSet.items }, pos }
  }

  return { node: { type: 'leaf', name }, pos }
}
