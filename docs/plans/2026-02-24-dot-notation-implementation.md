# Dot-Notation Library Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Create a JavaScript library with `flatten` and `unflatten` functions that convert between nested JSON strings and flat dot-notation JSON strings, plus an interactive demo UI.

**Architecture:** Pure functional library module (`src/dot-notation.js`) with two exported functions. Demo UI in existing Vite app (`index.html`, `src/main.js`, `src/style.css`). Tests use Node.js built-in `assert` module with no extra dependencies.

**Tech Stack:** Vanilla JavaScript, ES modules, Vite, Node.js `assert` for tests.

---

### Task 1: Scaffold test file and verify test runner works

**Files:**
- Create: `src/dot-notation.js` (empty exports)
- Create: `src/dot-notation.test.js` (test scaffold)

**Step 1: Create minimal library stub with empty exports**

```js
// src/dot-notation.js
export function flatten(jsonString) {
  throw new Error('Not implemented')
}

export function unflatten(jsonString) {
  throw new Error('Not implemented')
}
```

**Step 2: Create test scaffold with one basic test**

```js
// src/dot-notation.test.js
import assert from 'node:assert/strict'
import { flatten, unflatten } from './dot-notation.js'

let passed = 0
let failed = 0

function test(name, fn) {
  try {
    fn()
    passed++
    console.log(`  ✓ ${name}`)
  } catch (e) {
    failed++
    console.log(`  ✗ ${name}`)
    console.log(`    ${e.message}`)
  }
}

console.log('flatten:')

test('flattens a simple nested object', () => {
  const input = '{"a":{"b":1}}'
  const expected = '{"a.b":1}'
  assert.equal(flatten(input), expected)
})

console.log()
console.log(`Results: ${passed} passed, ${failed} failed`)
if (failed > 0) process.exit(1)
```

**Step 3: Run test to verify it fails**

Run: `node src/dot-notation.test.js`
Expected: FAIL with "Not implemented"

**Step 4: Commit**

```bash
git add src/dot-notation.js src/dot-notation.test.js
git commit -m "chore: scaffold test runner and library stub"
```

---

### Task 2: Implement basic flatten

**Files:**
- Modify: `src/dot-notation.test.js` (add flatten tests)
- Modify: `src/dot-notation.js` (implement flatten)

**Step 1: Write failing tests for flatten**

Add these tests to `src/dot-notation.test.js` under the `flatten:` section:

```js
test('flattens a simple nested object', () => {
  const input = '{"a":{"b":1}}'
  const expected = '{"a.b":1}'
  assert.equal(flatten(input), expected)
})

test('flattens deeply nested objects', () => {
  const input = '{"a":{"b":{"c":{"d":42}}}}'
  const expected = '{"a.b.c.d":42}'
  assert.equal(flatten(input), expected)
})

test('flattens multiple keys', () => {
  const input = '{"a":{"b":1},"c":{"d":2}}'
  const expected = '{"a.b":1,"c.d":2}'
  assert.equal(flatten(input), expected)
})

test('flattens arrays with dot-index notation', () => {
  const input = '{"items":[10,20,30]}'
  const expected = '{"items.0":10,"items.1":20,"items.2":30}'
  assert.equal(flatten(input), expected)
})

test('flattens nested objects inside arrays', () => {
  const input = '{"users":[{"name":"Alice"},{"name":"Bob"}]}'
  const expected = '{"users.0.name":"Alice","users.1.name":"Bob"}'
  assert.equal(flatten(input), expected)
})

test('preserves null values', () => {
  const input = '{"a":{"b":null}}'
  const expected = '{"a.b":null}'
  assert.equal(flatten(input), expected)
})

test('preserves boolean values', () => {
  const input = '{"a":{"b":true,"c":false}}'
  const expected = '{"a.b":true,"a.c":false}'
  assert.equal(flatten(input), expected)
})

test('preserves string values', () => {
  const input = '{"a":{"b":"hello"}}'
  const expected = '{"a.b":"hello"}'
  assert.equal(flatten(input), expected)
})

test('handles empty object', () => {
  const input = '{}'
  const expected = '{}'
  assert.equal(flatten(input), expected)
})

test('handles flat object (no nesting)', () => {
  const input = '{"a":1,"b":2}'
  const expected = '{"a":1,"b":2}'
  assert.equal(flatten(input), expected)
})

test('handles empty nested object', () => {
  const input = '{"a":{}}'
  const expected = '{"a":{}}'
  assert.equal(flatten(input), expected)
})

test('handles empty nested array', () => {
  const input = '{"a":[]}'
  const expected = '{"a":[]}'
  assert.equal(flatten(input), expected)
})

test('throws SyntaxError for invalid JSON', () => {
  assert.throws(() => flatten('not json'), SyntaxError)
})
```

**Step 2: Run tests to verify they fail**

Run: `node src/dot-notation.test.js`
Expected: FAIL — all flatten tests fail with "Not implemented"

**Step 3: Implement flatten**

```js
export function flatten(jsonString) {
  const obj = JSON.parse(jsonString)
  const result = {}

  function recurse(current, prefix) {
    if (current !== null && typeof current === 'object') {
      const keys = Array.isArray(current) ? current.keys() : Object.keys(current)
      const entries = [...keys]
      if (entries.length === 0) {
        result[prefix] = current
        return
      }
      for (const key of entries) {
        const newPrefix = prefix ? `${prefix}.${key}` : `${key}`
        recurse(current[key], newPrefix)
      }
    } else {
      result[prefix] = current
    }
  }

  recurse(obj, '')
  return JSON.stringify(result)
}
```

**Step 4: Run tests to verify they pass**

Run: `node src/dot-notation.test.js`
Expected: PASS — all flatten tests green

**Step 5: Commit**

```bash
git add src/dot-notation.js src/dot-notation.test.js
git commit -m "feat: implement flatten function"
```

---

### Task 3: Implement unflatten

**Files:**
- Modify: `src/dot-notation.test.js` (add unflatten tests)
- Modify: `src/dot-notation.js` (implement unflatten)

**Step 1: Write failing tests for unflatten**

Add a new section to `src/dot-notation.test.js`:

```js
console.log('unflatten:')

test('unflattens a simple dot-notation object', () => {
  const input = '{"a.b":1}'
  const expected = '{"a":{"b":1}}'
  assert.equal(unflatten(input), expected)
})

test('unflattens deeply nested keys', () => {
  const input = '{"a.b.c.d":42}'
  const expected = '{"a":{"b":{"c":{"d":42}}}}'
  assert.equal(unflatten(input), expected)
})

test('unflattens multiple keys', () => {
  const input = '{"a.b":1,"c.d":2}'
  const expected = '{"a":{"b":1},"c":{"d":2}}'
  assert.equal(unflatten(input), expected)
})

test('unflattens arrays from dot-index notation', () => {
  const input = '{"items.0":10,"items.1":20,"items.2":30}'
  const expected = '{"items":[10,20,30]}'
  assert.equal(unflatten(input), expected)
})

test('unflattens nested objects inside arrays', () => {
  const input = '{"users.0.name":"Alice","users.1.name":"Bob"}'
  const expected = '{"users":[{"name":"Alice"},{"name":"Bob"}]}'
  assert.equal(unflatten(input), expected)
})

test('preserves null values', () => {
  const input = '{"a.b":null}'
  const expected = '{"a":{"b":null}}'
  assert.equal(unflatten(input), expected)
})

test('preserves boolean values', () => {
  const input = '{"a.b":true,"a.c":false}'
  const expected = '{"a":{"b":true,"c":false}}'
  assert.equal(unflatten(input), expected)
})

test('handles empty object', () => {
  const input = '{}'
  const expected = '{}'
  assert.equal(unflatten(input), expected)
})

test('handles flat object (no dots)', () => {
  const input = '{"a":1,"b":2}'
  const expected = '{"a":1,"b":2}'
  assert.equal(unflatten(input), expected)
})

test('handles empty nested object value', () => {
  const input = '{"a":{}}'
  const expected = '{"a":{}}'
  assert.equal(unflatten(input), expected)
})

test('handles empty nested array value', () => {
  const input = '{"a":[]}'
  const expected = '{"a":[]}'
  assert.equal(unflatten(input), expected)
})

test('throws SyntaxError for invalid JSON', () => {
  assert.throws(() => unflatten('not json'), SyntaxError)
})
```

**Step 2: Run tests to verify unflatten tests fail**

Run: `node src/dot-notation.test.js`
Expected: flatten tests PASS, unflatten tests FAIL with "Not implemented"

**Step 3: Implement unflatten**

```js
export function unflatten(jsonString) {
  const obj = JSON.parse(jsonString)
  const result = {}

  for (const [key, value] of Object.entries(obj)) {
    const parts = key.split('.')
    let current = result

    for (let i = 0; i < parts.length - 1; i++) {
      const part = parts[i]
      const nextPart = parts[i + 1]
      if (!(part in current)) {
        current[part] = /^\d+$/.test(nextPart) ? [] : {}
      }
      current = current[part]
    }

    const lastPart = parts[parts.length - 1]
    if (typeof value === 'object' && value !== null) {
      current[lastPart] = value
    } else {
      current[lastPart] = value
    }
  }

  return JSON.stringify(result)
}
```

**Step 4: Run tests to verify they pass**

Run: `node src/dot-notation.test.js`
Expected: PASS — all tests green

**Step 5: Commit**

```bash
git add src/dot-notation.js src/dot-notation.test.js
git commit -m "feat: implement unflatten function"
```

---

### Task 4: Add round-trip tests

**Files:**
- Modify: `src/dot-notation.test.js` (add round-trip tests)

**Step 1: Write round-trip tests**

Add a new section to `src/dot-notation.test.js`:

```js
console.log('round-trip:')

test('round-trips a complex nested object', () => {
  const input = '{"user":{"name":"Alice","scores":[10,20],"active":true,"meta":null}}'
  assert.equal(unflatten(flatten(input)), input)
})

test('round-trips an already-flat object', () => {
  const input = '{"a":1,"b":"two","c":true}'
  assert.equal(unflatten(flatten(input)), input)
})

test('round-trips empty object', () => {
  const input = '{}'
  assert.equal(unflatten(flatten(input)), input)
})

test('round-trips deeply nested structure', () => {
  const input = '{"a":{"b":{"c":{"d":{"e":1}}}}}'
  assert.equal(unflatten(flatten(input)), input)
})
```

**Step 2: Run tests to verify they pass**

Run: `node src/dot-notation.test.js`
Expected: PASS — all tests green (these should pass if flatten/unflatten are correct)

**Step 3: Commit**

```bash
git add src/dot-notation.test.js
git commit -m "test: add round-trip tests"
```

---

### Task 5: Build demo UI

**Files:**
- Modify: `index.html`
- Modify: `src/main.js`
- Modify: `src/style.css`
- Delete: `src/counter.js` (no longer needed)

**Step 1: Update index.html**

Replace contents of `index.html`:

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>dot-notation</title>
  </head>
  <body>
    <div id="app">
      <h1>dot-notation</h1>
      <p class="subtitle">Convert between nested JSON and flat dot-notation</p>
      <div class="converter">
        <div class="panel">
          <label for="nested">Nested JSON</label>
          <textarea id="nested" spellcheck="false"></textarea>
        </div>
        <div class="controls">
          <button id="flatten-btn">Flatten →</button>
          <button id="unflatten-btn">← Unflatten</button>
        </div>
        <div class="panel">
          <label for="flat">Dot-Notation JSON</label>
          <textarea id="flat" spellcheck="false"></textarea>
        </div>
      </div>
      <p id="error" class="error" hidden></p>
    </div>
    <script type="module" src="/src/main.js"></script>
  </body>
</html>
```

**Step 2: Update src/main.js**

Replace contents of `src/main.js`:

```js
import './style.css'
import { flatten, unflatten } from './dot-notation.js'

const nestedEl = document.querySelector('#nested')
const flatEl = document.querySelector('#flat')
const flattenBtn = document.querySelector('#flatten-btn')
const unflattenBtn = document.querySelector('#unflatten-btn')
const errorEl = document.querySelector('#error')

const sampleJson = JSON.stringify({
  user: {
    name: 'Alice',
    age: 30,
    active: true,
    address: {
      street: '123 Main St',
      city: 'Springfield'
    },
    scores: [95, 87, 92]
  }
}, null, 2)

nestedEl.value = sampleJson

function showError(message) {
  errorEl.textContent = message
  errorEl.hidden = false
}

function clearError() {
  errorEl.textContent = ''
  errorEl.hidden = true
}

flattenBtn.addEventListener('click', () => {
  clearError()
  try {
    const result = flatten(nestedEl.value)
    flatEl.value = JSON.stringify(JSON.parse(result), null, 2)
  } catch (e) {
    showError(`Flatten error: ${e.message}`)
  }
})

unflattenBtn.addEventListener('click', () => {
  clearError()
  try {
    const result = unflatten(flatEl.value)
    nestedEl.value = JSON.stringify(JSON.parse(result), null, 2)
  } catch (e) {
    showError(`Unflatten error: ${e.message}`)
  }
})
```

**Step 3: Update src/style.css**

Replace contents of `src/style.css` with demo-appropriate styles.

**Step 4: Delete src/counter.js**

```bash
rm src/counter.js
```

**Step 5: Verify demo works**

Run: `npx vite --open`
Verify: Page loads with two text areas, sample JSON, buttons work.

**Step 6: Commit**

```bash
git add -A
git commit -m "feat: add interactive demo UI"
```

---

### Task 6: Add test script to package.json

**Files:**
- Modify: `package.json`

**Step 1: Add test script**

Add to scripts in `package.json`:
```json
"test": "node src/dot-notation.test.js"
```

**Step 2: Verify**

Run: `npm test`
Expected: All tests pass

**Step 3: Commit**

```bash
git add package.json
git commit -m "chore: add test script to package.json"
```
