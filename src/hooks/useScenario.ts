import { useState } from "react"
import type { ComponentId, Scenario, UIState, Viewport } from "../types.ts"

export const previewWidthLimits = {
  min: 320,
  max: 1440,
} as const

const presetWidths = {
  mobile: 375,
  tablet: 768,
  desktop: 1280,
} as const satisfies Record<Exclude<Viewport, "custom">, number>

export const viewportPresets: readonly {
  id: Exclude<Viewport, "custom">
  label: string
  width: number
}[] = [
  { id: "mobile", label: "Mobile", width: presetWidths.mobile },
  { id: "tablet", label: "Tablet", width: presetWidths.tablet },
  { id: "desktop", label: "Desktop", width: presetWidths.desktop },
]

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
    matrix: {
      enabled: false,
    },
  }
}

export type ScenarioActions = {
  selectComponent: (component: ComponentId) => void
  setState: (state: UIState) => void
  selectViewport: (viewport: Viewport) => void
  setCustomWidth: (width: number) => void
  toggleCompare: () => void
  setCompareEnabled: (enabled: boolean) => void
  setCompareState: (stateB: UIState) => void
  setMatrixEnabled: (enabled: boolean) => void
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
      const nextWidth = Math.min(
        previewWidthLimits.max,
        Math.max(previewWidthLimits.min, Math.round(width)),
      )
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
        matrix: {
          ...current.matrix,
          enabled: current.compare.enabled ? current.matrix.enabled : false,
        },
      }))
    },
    setCompareEnabled(enabled) {
      setScenario((current) => ({
        ...current,
        compare: { ...current.compare, enabled },
        matrix: { ...current.matrix, enabled: enabled ? false : current.matrix.enabled },
      }))
    },
    setCompareState(stateB) {
      setScenario((current) => ({
        ...current,
        compare: { ...current.compare, stateB },
      }))
    },
    setMatrixEnabled(enabled) {
      setScenario((current) => ({
        ...current,
        matrix: { ...current.matrix, enabled },
        compare: {
          ...current.compare,
          enabled: enabled ? false : current.compare.enabled,
        },
      }))
    },
    reset() {
      setScenario(createDefaultScenario())
    },
  }

  return { scenario, actions }
}
