import { previewWidthLimits, viewportPresets } from "../hooks/useScenario.ts"
import type { CompareConfig, ComponentId, UIState, Viewport } from "../types.ts"

export const savedScenariosStorageKey = "edgecase-studio.scenarios"

const savedScenarioVersion = 1
const labelMaxLength = 80

const componentIds = ["profile", "products"] as const satisfies readonly ComponentId[]
const uiStates = ["success", "loading", "empty", "error", "long"] as const satisfies readonly UIState[]
const viewports = ["mobile", "tablet", "desktop", "custom"] as const satisfies readonly Viewport[]

export type SavedScenario = {
  id: string
  name: string
  component: ComponentId
  state: UIState
  viewport: Viewport
  width: number
  compare: CompareConfig
}

export type StorageError =
  | "unavailable"
  | "malformed"
  | "incompatible"
  | "duplicate-name"
  | "empty-name"
  | "invalid"
  | "not-found"
  | "write-failed"

export type StorageReadResult =
  | { ok: true; scenarios: SavedScenario[]; dropped: number }
  | { ok: false; error: Extract<StorageError, "unavailable" | "malformed" | "incompatible">; scenarios: [] }

export type StorageMutationResult =
  | { ok: true; scenarios: SavedScenario[]; saved?: SavedScenario }
  | { ok: false; error: StorageError; scenarios: SavedScenario[] }

type StoredEnvelope = {
  version: typeof savedScenarioVersion
  scenarios: SavedScenario[]
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function isOneOf<T extends string>(value: unknown, allowed: readonly T[]): value is T {
  return typeof value === "string" && allowed.some((item) => item === value)
}

function isValidLabel(value: string): boolean {
  if (value.length === 0 || value.length > labelMaxLength) return false
  for (const character of value) {
    const code = character.codePointAt(0)
    if (code !== undefined && (code <= 31 || code === 127)) return false
  }
  return true
}

function isValidWidth(viewport: Viewport, width: unknown): width is number {
  if (typeof width !== "number" || !Number.isInteger(width)) return false
  if (width < previewWidthLimits.min || width > previewWidthLimits.max) return false
  if (viewport === "custom") return true
  return viewportPresets.some((preset) => preset.id === viewport && preset.width === width)
}

function getLocalStorage(): Storage | null {
  try {
    if (typeof globalThis.localStorage !== "object" || globalThis.localStorage === null) {
      return null
    }
    void globalThis.localStorage.length
    return globalThis.localStorage
  } catch {
    return null
  }
}

function isQuotaError(error: unknown): boolean {
  return (
    error instanceof DOMException &&
    (error.name === "QuotaExceededError" ||
      error.name === "NS_ERROR_DOM_QUOTA_REACHED" ||
      error.code === 22)
  )
}

function parseSavedScenario(value: unknown): SavedScenario | null {
  if (!isRecord(value)) return null
  if (typeof value.id !== "string" || typeof value.name !== "string") return null
  if (!isOneOf(value.component, componentIds)) return null
  if (!isOneOf(value.state, uiStates)) return null
  if (!isOneOf(value.viewport, viewports)) return null
  if (!isValidWidth(value.viewport, value.width)) return null
  if (!isRecord(value.compare)) return null
  if (typeof value.compare.enabled !== "boolean") return null
  if (!isOneOf(value.compare.stateB, uiStates)) return null

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

function collectValidScenarios(items: readonly unknown[]): { scenarios: SavedScenario[]; dropped: number } {
  const scenarios: SavedScenario[] = []
  const ids = new Set<string>()
  const names = new Set<string>()
  let dropped = 0

  for (const item of items) {
    const scenario = parseSavedScenario(item)
    if (!scenario || ids.has(scenario.id) || names.has(scenario.name)) {
      dropped += 1
      continue
    }
    ids.add(scenario.id)
    names.add(scenario.name)
    scenarios.push(scenario)
  }

  return { scenarios, dropped }
}

export function readSavedScenarios(): StorageReadResult {
  const storage = getLocalStorage()
  if (!storage) return { ok: false, error: "unavailable", scenarios: [] }

  let raw: string | null
  try {
    raw = storage.getItem(savedScenariosStorageKey)
  } catch {
    return { ok: false, error: "unavailable", scenarios: [] }
  }

  if (raw === null || raw.trim() === "") {
    return { ok: true, scenarios: [], dropped: 0 }
  }

  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    return { ok: false, error: "malformed", scenarios: [] }
  }

  // Unknown versions stay on disk until the user confirms a replacement.
  if (!isRecord(parsed) || parsed.version !== savedScenarioVersion || !Array.isArray(parsed.scenarios)) {
    return { ok: false, error: "incompatible", scenarios: [] }
  }

  const { scenarios, dropped } = collectValidScenarios(parsed.scenarios)
  return { ok: true, scenarios, dropped }
}

function writeSavedScenarios(
  scenarios: readonly SavedScenario[],
): { ok: true } | { ok: false; error: Extract<StorageError, "unavailable" | "write-failed"> } {
  const storage = getLocalStorage()
  if (!storage) return { ok: false, error: "unavailable" }

  const envelope: StoredEnvelope = {
    version: savedScenarioVersion,
    scenarios: scenarios.map((scenario) => ({
      id: scenario.id,
      name: scenario.name,
      component: scenario.component,
      state: scenario.state,
      viewport: scenario.viewport,
      width: scenario.width,
      compare: {
        enabled: scenario.compare.enabled,
        stateB: scenario.compare.stateB,
      },
    })),
  }

  try {
    storage.setItem(savedScenariosStorageKey, JSON.stringify(envelope))
    return { ok: true }
  } catch (error) {
    return { ok: false, error: isQuotaError(error) ? "write-failed" : "unavailable" }
  }
}

function createSavedScenarioId(existing: readonly SavedScenario[]): string {
  const used = new Set(existing.map((scenario) => scenario.id))
  let id = ""
  do {
    id =
      typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
        ? crypto.randomUUID()
        : `scenario-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
  } while (used.has(id))
  return id
}

function draftScenario(input: SavedScenario, id: string, name: string): SavedScenario | null {
  return parseSavedScenario({
    id,
    name,
    component: input.component,
    state: input.state,
    viewport: input.viewport,
    width: input.width,
    compare: {
      enabled: input.compare.enabled,
      stateB: input.compare.stateB,
    },
  })
}

export function saveScenario(input: SavedScenario, overwrite: boolean): StorageMutationResult {
  const name = input.name.trim()
  if (name.length === 0) {
    const current = readSavedScenarios()
    return { ok: false, error: "empty-name", scenarios: current.ok ? current.scenarios : [] }
  }

  const current = readSavedScenarios()
  if (!current.ok) return { ok: false, error: current.error, scenarios: [] }

  const existing = current.scenarios.find((scenario) => scenario.name === name)
  if (existing && !overwrite) {
    return { ok: false, error: "duplicate-name", scenarios: current.scenarios }
  }

  const scenario = draftScenario(input, existing?.id ?? createSavedScenarioId(current.scenarios), name)
  if (!scenario) return { ok: false, error: "invalid", scenarios: current.scenarios }

  const scenarios = existing
    ? current.scenarios.map((item) => (item.id === existing.id ? scenario : item))
    : [...current.scenarios, scenario]
  const written = writeSavedScenarios(scenarios)
  if (!written.ok) return { ok: false, error: written.error, scenarios: current.scenarios }
  return { ok: true, scenarios, saved: scenario }
}

export function replaceSavedScenarios(input: SavedScenario): StorageMutationResult {
  const name = input.name.trim()
  if (name.length === 0) return { ok: false, error: "empty-name", scenarios: [] }

  const scenario = draftScenario(input, createSavedScenarioId([]), name)
  if (!scenario) return { ok: false, error: "invalid", scenarios: [] }

  const written = writeSavedScenarios([scenario])
  if (!written.ok) return { ok: false, error: written.error, scenarios: [] }
  return { ok: true, scenarios: [scenario], saved: scenario }
}

export function deleteSavedScenario(id: string): StorageMutationResult {
  const current = readSavedScenarios()
  if (!current.ok) return { ok: false, error: current.error, scenarios: [] }

  if (!current.scenarios.some((scenario) => scenario.id === id)) {
    return { ok: false, error: "not-found", scenarios: current.scenarios }
  }

  const scenarios = current.scenarios.filter((scenario) => scenario.id !== id)
  const written = writeSavedScenarios(scenarios)
  if (!written.ok) return { ok: false, error: written.error, scenarios: current.scenarios }
  return { ok: true, scenarios }
}
