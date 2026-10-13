import type { CompareConfig, ComponentId, UIState, Viewport } from "../types.ts"

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

const labelMaxLength = 80

const componentIds = ["profile", "products"] as const satisfies readonly ComponentId[]
const uiStates = ["success", "loading", "empty", "error", "long"] as const satisfies readonly UIState[]
const viewports = ["mobile", "tablet", "desktop", "custom"] as const satisfies readonly Viewport[]

export type ScenarioRecord = {
  id: string
  name: string
  component: ComponentId
  state: UIState
  viewport: Viewport
  width: number
  compare: CompareConfig
}

export function isComponentId(value: unknown): value is ComponentId {
  return typeof value === "string" && componentIds.some((item) => item === value)
}

export function isUIState(value: unknown): value is UIState {
  return typeof value === "string" && uiStates.some((item) => item === value)
}

export function isViewport(value: unknown): value is Viewport {
  return typeof value === "string" && viewports.some((item) => item === value)
}

export function clampPreviewWidth(width: number): number | null {
  if (!Number.isFinite(width)) return null
  return Math.min(previewWidthLimits.max, Math.max(previewWidthLimits.min, Math.round(width)))
}

export function sanitizeLiveName(name: string): string {
  let result = ""
  for (const character of name) {
    const code = character.codePointAt(0)
    if (code === undefined || code <= 31 || code === 127) continue
    result += character
    if (result.length >= labelMaxLength) break
  }
  return result
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function isValidLabel(value: string): boolean {
  if (value.length === 0 || value.length > labelMaxLength) return false
  for (const character of value) {
    const code = character.codePointAt(0)
    if (code !== undefined && (code <= 31 || code === 127)) return false
  }
  return true
}

function isStoredWidth(viewport: Viewport, width: unknown): width is number {
  if (typeof width !== "number" || !Number.isInteger(width)) return false
  if (width < previewWidthLimits.min || width > previewWidthLimits.max) return false
  if (viewport === "custom") return true
  return viewportPresets.some((preset) => preset.id === viewport && preset.width === width)
}

export function nameProblem(name: string): "empty-name" | "invalid-name" | null {
  const trimmed = name.trim()
  if (trimmed.length === 0) return "empty-name"
  if (!isValidLabel(trimmed)) return "invalid-name"
  return null
}

export function readScenarioRecord(value: unknown): ScenarioRecord | null {
  if (!isRecord(value)) return null
  if (typeof value.id !== "string" || typeof value.name !== "string") return null
  if (!isComponentId(value.component) || !isUIState(value.state) || !isViewport(value.viewport)) return null
  if (!isStoredWidth(value.viewport, value.width)) return null
  if (!isRecord(value.compare)) return null
  if (typeof value.compare.enabled !== "boolean" || !isUIState(value.compare.stateB)) return null

  const id = value.id.trim()
  const name = value.name.trim()
  if (!isValidLabel(id) || !isValidLabel(name)) return null

  return {
    id,
    name,
    component: value.component,
    state: value.state,
    viewport: value.viewport,
    width: value.width,
    compare: {
      enabled: value.compare.enabled,
      stateB: value.compare.stateB,
    },
  }
}

export function sameScenarioContent(left: ScenarioRecord, right: ScenarioRecord): boolean {
  return (
    left.component === right.component &&
    left.state === right.state &&
    left.viewport === right.viewport &&
    left.width === right.width &&
    left.compare.enabled === right.compare.enabled &&
    left.compare.stateB === right.compare.stateB
  )
}
