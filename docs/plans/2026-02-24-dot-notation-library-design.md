# Dot-Notation Library Design

## Overview

A JavaScript library that converts between nested JSON and flat dot-notation JSON, with a visual demo.

## API

### Module: `src/dot-notation.js`

Two exported functions, both string-in / string-out:

```js
export function flatten(jsonString)   // nested JSON string → flat dot-notation JSON string
export function unflatten(jsonString) // flat dot-notation JSON string → nested JSON string
```

### Examples

```js
flatten('{"user": {"name": "Alice", "scores": [10, 20]}}')
// Returns: '{"user.name": "Alice", "user.scores.0": 10, "user.scores.1": 20}'

unflatten('{"user.name": "Alice", "user.scores.0": 10, "user.scores.1": 20}')
// Returns: '{"user": {"name": "Alice", "scores": [10, 20]}}'
```

### Behavior

- **Array notation**: Dot-index notation (e.g., `items.0`, `items.1`) — consistent with library name.
- **Type preservation**: `null`, booleans, numbers, strings, empty objects `{}`, and empty arrays `[]` all round-trip faithfully.
- **Array detection in `unflatten`**: Keys with consecutive integer indices starting from 0 (e.g., `a.0`, `a.1`) are reconstructed as arrays. Non-sequential or mixed indices produce objects.
- **Error handling**: Both functions throw `SyntaxError` if the input is not valid JSON.

## Project Structure

```
src/
  dot-notation.js        — library (flatten + unflatten exports)
  dot-notation.test.js   — tests (Node.js assertions, no framework)
  main.js                — demo app wiring
  style.css              — demo styling
index.html               — demo page markup
```

The library module has zero DOM dependencies — it's a pure function module.

## Demo UI

Replaces the Vite boilerplate in `index.html` + `src/main.js` + `src/style.css`:

- Two text areas side by side: left for nested JSON, right for flat dot-notation JSON.
- Two buttons: "Flatten →" and "← Unflatten" between the text areas.
- Inline error message below if input is invalid JSON.
- Pre-populated with a meaningful example on page load.

## Testing

Test file: `src/dot-notation.test.js`, runnable with `node src/dot-notation.test.js`.

Test cases:
1. Basic flatten: nested objects → dot-notation
2. Basic unflatten: dot-notation → nested objects
3. Round-trip: `unflatten(flatten(x)) === x` for various inputs
4. Arrays: correct dot-index handling in both directions
5. Special values: `null`, booleans, numbers, empty objects/arrays
6. Deep nesting: 3+ levels deep
7. Error cases: invalid JSON input throws `SyntaxError`
8. Edge cases: empty object `{}`, single key, top-level array
