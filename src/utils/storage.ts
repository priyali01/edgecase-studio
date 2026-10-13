import {
  nameProblem,
  readScenarioRecord,
  sameScenarioContent,
  type ScenarioRecord,
} from "./guards.ts"

export const savedScenariosStorageKey = "edgecase-studio.scenarios"

const savedScenarioVersion = 1

export type SavedScenario = ScenarioRecord

export type StorageError =
  | "unavailable"
  | "malformed"
  | "incompatible"
  | "duplicate-name"
  | "empty-name"
  | "invalid"
  | "invalid-name"
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
  return readScenarioRecord(value)
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

function rejectName(name: string, scenarios: SavedScenario[]): StorageMutationResult | null {
  const problem = nameProblem(name)
  if (!problem) return null
  return { ok: false, error: problem, scenarios }
}

export function saveScenario(input: SavedScenario, overwrite: boolean): StorageMutationResult {
  const name = input.name.trim()
  const current = readSavedScenarios()
  const stored = current.ok ? current.scenarios : []
  const rejected = rejectName(name, stored)
  if (rejected) return rejected
  if (!current.ok) return { ok: false, error: current.error, scenarios: [] }

  const existing = current.scenarios.find((scenario) => scenario.name === name)
  const scenario = draftScenario(input, existing?.id ?? createSavedScenarioId(current.scenarios), name)
  if (!scenario) {
    return {
      ok: false,
      error: nameProblem(name) ?? "invalid",
      scenarios: current.scenarios,
    }
  }
  if (existing && sameScenarioContent(existing, scenario)) {
    return { ok: true, scenarios: current.scenarios, saved: existing }
  }
  if (existing && !overwrite) {
    return { ok: false, error: "duplicate-name", scenarios: current.scenarios }
  }

  const scenarios = existing
    ? current.scenarios.map((item) => (item.id === existing.id ? scenario : item))
    : [...current.scenarios, scenario]
  const written = writeSavedScenarios(scenarios)
  if (!written.ok) return { ok: false, error: written.error, scenarios: current.scenarios }
  return { ok: true, scenarios, saved: scenario }
}

export function replaceSavedScenarios(input: SavedScenario): StorageMutationResult {
  const name = input.name.trim()
  const rejected = rejectName(name, [])
  if (rejected) return rejected

  const scenario = draftScenario(input, createSavedScenarioId([]), name)
  if (!scenario) return { ok: false, error: nameProblem(name) ?? "invalid", scenarios: [] }

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
