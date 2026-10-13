import { useState } from "react"
import type { ComponentId, Scenario, UIState, Viewport } from "../types.ts"
import {
  clampPreviewWidth,
  isComponentId,
  isUIState,
  isViewport,
  previewWidthLimits,
  readScenarioRecord,
  sanitizeLiveName,
  viewportPresets,
} from "../utils/guards.ts"

export { previewWidthLimits, viewportPresets }

export function createDefaultScenario(): Scenario {
  return {
    id: "current",
    name: "Current scenario",
    component: "profile",
    state: "success",
    viewport: "desktop",
    width: 1280,
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
  toggleMatrix: () => void
  setMatrixEnabled: (enabled: boolean) => void
  setName: (name: string) => void
  loadScenario: (saved: unknown) => boolean
  rememberSaved: (saved: unknown) => void
  releaseSaved: (id: unknown) => void
  reset: () => void
}

function presetWidth(viewport: Exclude<Viewport, "custom">): number | null {
  return viewportPresets.find((preset) => preset.id === viewport)?.width ?? null
}

export function useScenario(): { scenario: Scenario; actions: ScenarioActions } {
  const [scenario, setScenario] = useState<Scenario>(createDefaultScenario)

  const actions: ScenarioActions = {
    selectComponent(component) {
      if (!isComponentId(component)) return
      setScenario((current) => (current.component === component ? current : { ...current, component }))
    },
    setState(state) {
      if (!isUIState(state)) return
      setScenario((current) => (current.state === state ? current : { ...current, state }))
    },
    selectViewport(viewport) {
      if (!isViewport(viewport)) return
      setScenario((current) => {
        if (viewport === "custom") {
          return current.viewport === "custom" ? current : { ...current, viewport: "custom" }
        }
        const width = presetWidth(viewport)
        if (width === null) return current
        if (current.viewport === viewport && current.width === width) return current
        return { ...current, viewport, width }
      })
    },
    setCustomWidth(width) {
      const nextWidth = clampPreviewWidth(width)
      if (nextWidth === null) return
      setScenario((current) =>
        current.viewport === "custom" && current.width === nextWidth
          ? current
          : { ...current, viewport: "custom", width: nextWidth },
      )
    },
    toggleCompare() {
      setScenario((current) => {
        const enabled = !current.compare.enabled
        return {
          ...current,
          compare: { ...current.compare, enabled },
          matrix: { enabled: enabled ? false : current.matrix.enabled },
        }
      })
    },
    setCompareEnabled(enabled) {
      if (typeof enabled !== "boolean") return
      setScenario((current) => {
        if (current.compare.enabled === enabled && (!enabled || !current.matrix.enabled)) return current
        return {
          ...current,
          compare: { ...current.compare, enabled },
          matrix: { enabled: enabled ? false : current.matrix.enabled },
        }
      })
    },
    setCompareState(stateB) {
      if (!isUIState(stateB)) return
      setScenario((current) =>
        current.compare.stateB === stateB
          ? current
          : { ...current, compare: { ...current.compare, stateB } },
      )
    },
    toggleMatrix() {
      setScenario((current) => {
        const enabled = !current.matrix.enabled
        return {
          ...current,
          matrix: { enabled },
          compare: { ...current.compare, enabled: enabled ? false : current.compare.enabled },
        }
      })
    },
    setMatrixEnabled(enabled) {
      if (typeof enabled !== "boolean") return
      setScenario((current) => {
        if (current.matrix.enabled === enabled && (!enabled || !current.compare.enabled)) return current
        return {
          ...current,
          matrix: { enabled },
          compare: { ...current.compare, enabled: enabled ? false : current.compare.enabled },
        }
      })
    },
    setName(name) {
      if (typeof name !== "string") return
      const nextName = sanitizeLiveName(name)
      setScenario((current) => (current.name === nextName ? current : { ...current, name: nextName }))
    },
    loadScenario(saved) {
      const record = readScenarioRecord(saved)
      if (!record) return false
      setScenario({
        id: record.id,
        name: record.name,
        component: record.component,
        state: record.state,
        viewport: record.viewport,
        width: record.width,
        compare: {
          enabled: record.compare.enabled,
          stateB: record.compare.stateB,
        },
        matrix: { enabled: false },
      })
      return true
    },
    rememberSaved(saved) {
      const record = readScenarioRecord(saved)
      if (!record) return
      setScenario((current) =>
        current.id === record.id && current.name === record.name
          ? current
          : { ...current, id: record.id, name: record.name },
      )
    },
    releaseSaved(id) {
      if (typeof id !== "string" || id.length === 0) return
      setScenario((current) => (current.id === id ? { ...current, id: "current" } : current))
    },
    reset() {
      setScenario(createDefaultScenario())
    },
  }

  return { scenario, actions }
}
