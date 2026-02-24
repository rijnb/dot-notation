import './style.css'
import { flatten, unflatten } from './dot-notation.js'

const nestedEl = document.querySelector('#nested')
const flatEl = document.querySelector('#flat')
const flattenBtn = document.querySelector('#flatten-btn')
const unflattenBtn = document.querySelector('#unflatten-btn')
const errorEl = document.querySelector('#error')

const sampleJson = JSON.stringify([
  'Alice',
  { age: '30' },
  { address: { street: '123 Main St', city: 'Springfield' } }
], null, 2)

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
    flatEl.value = flatten(nestedEl.value)
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
