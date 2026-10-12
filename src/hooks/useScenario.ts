import { useState } from "react"
import type { ComponentId, Scenario, UIState, Viewport } from "../types.ts"

const MIN_WIDTH = 240
const MAX_WIDTH = 1600

const presetWidths = {
  mobile: 390,
  tablet: 768,
  desktop: 1280,
} as const satisfies Record<Exclude<Viewport, "custom">, number>

export function createDefaultScenario(): Scenario {
  return {
    id: "current",
    name: "Current scenario",
    component: "profile",
    state: "success",
    viewport: "desktop",
    width: presetWidths.desktop,
    compare: {
      enabled: false,
      stateB: "empty",
    },
  }
}

export type ScenarioActions = {
  selectComponent: (component: ComponentId) => void
  setState: (state: UIState) => void
  selectViewport: (viewport: Viewport) => void
  setCustomWidth: (width: number) => void
  toggleCompare: () => void
  setCompareState: (stateB: UIState) => void
  reset: () => void
}

export function useScenario(): { scenario: Scenario; actions: ScenarioActions } {
  const [scenario, setScenario] = useState<Scenario>(createDefaultScenario)

  const actions: ScenarioActions = {
    selectComponent(component) {
      setScenario((current) => ({ ...current, component }))
    },
    setState(state) {
      setScenario((current) => ({ ...current, state }))
    },
    selectViewport(viewport) {
      setScenario((current) => ({
        ...current,
        viewport,
        width: viewport === "custom" ? current.width : presetWidths[viewport],
      }))
    },
    setCustomWidth(width) {
      if (!Number.isFinite(width)) return
      const nextWidth = Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, Math.round(width)))
      setScenario((current) => ({
        ...current,
        viewport: "custom",
        width: nextWidth,
      }))
    },
    toggleCompare() {
      setScenario((current) => ({
        ...current,
        compare: { ...current.compare, enabled: !current.compare.enabled },
      }))
    },
    setCompareState(stateB) {
      setScenario((current) => ({
        ...current,
        compare: { ...current.compare, stateB },
      }))
    },
    reset() {
      setScenario(createDefaultScenario())
    },
  }

  return { scenario, actions }
}
