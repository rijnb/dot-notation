import "./style.css"
import {flatten, flattenDotOnly, unflatten} from "./dot-notation.js"

const nestedEl = document.querySelector("#nested")
const flatEl = document.querySelector("#flat")
const flattenGroupedBtn = document.querySelector("#flatten-grouped-btn")
const flattenDotBtn = document.querySelector("#flatten-dot-btn")
const unflattenBtn = document.querySelector("#unflatten-btn")
const errorEl = document.querySelector("#error")

const sampleJson = JSON.stringify([
  {
    "a": {
      "b": {
        "x": [
          "p",
          "q"
        ]
      },
      "c": "z"
    }
  }
], null, 2)

nestedEl.value = sampleJson

function showError(message) {
  errorEl.textContent = message
  errorEl.hidden = false
}

function clearError() {
  errorEl.textContent = ""
  errorEl.hidden = true
}

flattenGroupedBtn.addEventListener("click", () => {
  clearError()
  try {
    flatEl.value = flatten(nestedEl.value)
  } catch (e) {
    showError(`Flatten error: ${e.message}`)
  }
})

flattenDotBtn.addEventListener("click", () => {
  clearError()
  try {
    flatEl.value = flattenDotOnly(nestedEl.value)
  } catch (e) {
    showError(`Flatten error: ${e.message}`)
  }
})

unflattenBtn.addEventListener("click", () => {
  clearError()
  try {
    const result = unflatten(flatEl.value)
    nestedEl.value = JSON.stringify(JSON.parse(result), null, 2)
  } catch (e) {
    showError(`Unflatten error: ${e.message}`)
  }
})
