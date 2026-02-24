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

test('flattens a string element preserving case', () => {
  assert.equal(flatten('["A"]'), 'A')
})

test('flattens an object element to dot-notation', () => {
  assert.equal(flatten('[{"B": "C"}]'), 'B.C')
})

test('flattens mixed string and object elements', () => {
  assert.equal(flatten('["A", {"B": "C"}]'), 'A, B.C')
})

test('flattens deeply nested objects', () => {
  assert.equal(flatten('[{"B": {"C": "D"}}]'), 'B.C.D')
})

test('flattens object with multiple keys into multiple dot-paths', () => {
  assert.equal(flatten('[{"B": "C", "D": "E"}]'), 'B.C, D.E')
})

test('flattens multiple elements of different types', () => {
  assert.equal(flatten('["X", {"A": "B"}, "Y"]'), 'X, A.B, Y')
})

test('preserves case of all parts', () => {
  assert.equal(flatten('["HELLO", {"FOO": "BAR"}]'), 'HELLO, FOO.BAR')
})

test('handles number elements', () => {
  assert.equal(flatten('[42]'), '42')
})

test('handles boolean elements', () => {
  assert.equal(flatten('[true, false]'), 'true, false')
})

test('handles null elements', () => {
  assert.equal(flatten('[null]'), 'null')
})

test('handles empty array', () => {
  assert.equal(flatten('[]'), '')
})

test('handles multiple nested objects', () => {
  assert.equal(flatten('[{"A": {"B": "C"}}, {"D": "E"}]'), 'A.B.C, D.E')
})

test('flattens null leaf values without appending null', () => {
  assert.equal(
    flatten('[{"A": {"B": {"X": {"P": null, "Q": null}, "Y": null}, "C": {"Z": null}}}]'),
    'A.B.X.P, A.B.X.Q, A.B.Y, A.C.Z'
  )
})

test('throws SyntaxError for invalid JSON', () => {
  assert.throws(() => flatten('not json'), SyntaxError)
})

test('throws TypeError for non-array JSON', () => {
  assert.throws(() => flatten('{"a": 1}'), TypeError)
})

test('flattens arrays without numeric indices', () => {
  assert.equal(
    flatten('[{"a":{"b":["c","d"]}},{"a":"c"}]'),
    'a.b.c, a.b.d, a.c'
  )
})

console.log()
console.log('unflatten:')

test('unflattens a plain string to array element', () => {
  assert.equal(unflatten('a'), '["a"]')
})

test('unflattens dot-notation to nested object', () => {
  assert.equal(unflatten('b.c'), '[{"b":"c"}]')
})

test('unflattens deeply nested dot-notation', () => {
  assert.equal(unflatten('b.c.d'), '[{"b":{"c":"d"}}]')
})

test('unflattens comma-separated items', () => {
  assert.equal(unflatten('a, b.c'), '["a",{"b":"c"}]')
})

test('unflattens multiple dot-notation items into merged object', () => {
  assert.equal(unflatten('a.b.c, d.e'), '[{"a":{"b":"c"},"d":"e"}]')
})

test('unflattens numbers as strings', () => {
  assert.equal(unflatten('42'), '["42"]')
})

test('handles empty string', () => {
  assert.equal(unflatten(''), '[]')
})

test('handles multiple plain strings', () => {
  assert.equal(unflatten('x, y, z'), '["x","y","z"]')
})

test('unflattens shared prefix paths into arrays', () => {
  assert.equal(
    unflatten('a.b.c, a.b.d, a.c'),
    '[{"a":{"b":["c","d"]}},{"a":"c"}]'
  )
})

test('unflattens with conflict into separate elements', () => {
  assert.equal(
    unflatten('a.b.x.p, a.b.x.q, a.b.y, a.c.z'),
    '[{"a":{"b":{"x":["p","q"]}}},{"a":{"b":"y","c":"z"}}]'
  )
})

console.log()
console.log('round-trip:')

test('round-trips a mixed array', () => {
  const input = '["a", {"b": "c"}]'
  assert.equal(unflatten(flatten(input)), '["a",{"b":"c"}]')
})

test('round-trips plain strings', () => {
  const input = '["hello", "world"]'
  assert.equal(unflatten(flatten(input)), '["hello","world"]')
})

test('round-trips deeply nested objects', () => {
  const input = '[{"a": {"b": {"c": "d"}}}]'
  assert.equal(unflatten(flatten(input)), '[{"a":{"b":{"c":"d"}}}]')
})

test('round-trips empty array', () => {
  const input = '[]'
  assert.equal(unflatten(flatten(input)), '[]')
})

test('round-trips object with multiple keys', () => {
  const input = '[{"a": "b", "c": "d"}]'
  const flattened = flatten(input)
  assert.equal(flattened, 'a.b, c.d')
  assert.equal(unflatten(flattened), '[{"a":"b","c":"d"}]')
})

test('round-trips array values without numeric indices', () => {
  const input = '[{"a":{"b":["c","d"]}},{"a":"c"}]'
  const flattened = flatten(input)
  assert.equal(flattened, 'a.b.c, a.b.d, a.c')
  assert.equal(unflatten(flattened), '[{"a":{"b":["c","d"]}},{"a":"c"}]')
})

console.log()
console.log(`Results: ${passed} passed, ${failed} failed`)
if (failed > 0) process.exit(1)
