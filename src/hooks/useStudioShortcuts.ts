import { useEffect, useRef } from "react"
import type { Scenario, UIState } from "../types.ts"
import type { ScenarioActions } from "./useScenario.ts"

export const shortcutHelp: readonly { key: string; label: string }[] = [
  { key: "1", label: "Success" },
  { key: "2", label: "Loading" },
  { key: "3", label: "Empty" },
  { key: "4", label: "Error" },
  { key: "5", label: "Long" },
  { key: "C", label: "Compare" },
  { key: "M", label: "Matrix" },
]

const stateByKey: Record<string, UIState> = {
  "1": "success",
  "2": "loading",
  "3": "empty",
  "4": "error",
  "5": "long",
}

function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false
  if (target.isContentEditable) return true
  return target.closest("input, textarea, select") !== null
}

export function useStudioShortcuts(scenario: Scenario, actions: ScenarioActions) {
  const latest = useRef({ scenario, actions })

  useEffect(() => {
    latest.current = { scenario, actions }
  })

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.repeat || event.ctrlKey || event.altKey || event.metaKey || event.isComposing) return
      if (isTypingTarget(event.target)) return

      const { scenario: current, actions: currentActions } = latest.current
      const state = stateByKey[event.key]
      if (state) {
        currentActions.setState(state)
      } else if (event.key === "c" || event.key === "C") {
        currentActions.toggleCompare()
      } else if (event.key === "m" || event.key === "M") {
        currentActions.setMatrixEnabled(!current.matrix.enabled)
      } else {
        return
      }

      event.preventDefault()
    }

    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [])
}
