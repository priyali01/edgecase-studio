import { useState } from "react"
import type { ReactNode } from "react"
import { previewWidthLimits, type ScenarioActions } from "../hooks/useScenario.ts"
import type { ComponentId, Scenario, UIState, Viewport } from "../types.ts"
import {
  deleteSavedScenario,
  readSavedScenarios,
  replaceSavedScenarios,
  saveScenario,
  type SavedScenario,
  type StorageError,
  type StorageMutationResult,
  type StorageReadResult,
} from "../utils/storage.ts"

const componentOptions: readonly { id: ComponentId; label: string }[] = [
  { id: "profile", label: "Profile" },
  { id: "products", label: "Products" },
]

const stateOptions: readonly { id: UIState; label: string }[] = [
  { id: "success", label: "Success" },
  { id: "loading", label: "Loading" },
  { id: "empty", label: "Empty" },
  { id: "error", label: "Error" },
  { id: "long", label: "Long content" },
]

const viewportOptions: readonly { id: Viewport; label: string }[] = [
  { id: "mobile", label: "Mobile" },
  { id: "tablet", label: "Tablet" },
  { id: "desktop", label: "Desktop" },
  { id: "custom", label: "Custom" },
]

type SidebarProps = {
  scenario: Scenario
  actions: ScenarioActions
}

export function Sidebar({ scenario, actions }: SidebarProps) {
  return (
    <div className="flex h-full min-h-0 flex-col overflow-y-auto overscroll-contain">
      <SidebarSection title="Component">
        <ChoiceGroup
          label="Component"
          options={componentOptions}
          value={scenario.component}
          onChange={actions.selectComponent}
        />
      </SidebarSection>

      <SidebarSection title="State">
        <ChoiceGroup
          label="State"
          options={stateOptions}
          value={scenario.state}
          onChange={actions.setState}
        />
        <label className="mt-3 flex items-center gap-2 text-sm text-zinc-200">
          <input
            type="checkbox"
            className="size-3.5 accent-indigo-500"
            checked={scenario.compare.enabled}
            onChange={(event) => actions.setCompareEnabled(event.currentTarget.checked)}
          />
          Compare
        </label>
        <label className="mt-2 flex items-center gap-2 text-sm text-zinc-200">
          <input
            type="checkbox"
            className="size-3.5 accent-indigo-500"
            checked={scenario.matrix.enabled}
            onChange={(event) => actions.setMatrixEnabled(event.currentTarget.checked)}
          />
          Matrix
        </label>
        <div className="mt-3">
          <p className="mb-1.5 text-xs text-zinc-500">Comparison state</p>
          <ChoiceGroup
            label="Comparison state"
            options={stateOptions}
            value={scenario.compare.stateB}
            onChange={actions.setCompareState}
          />
        </div>
      </SidebarSection>

      <SidebarSection title="Viewport">
        <ChoiceGroup
          label="Viewport"
          options={viewportOptions}
          value={scenario.viewport}
          onChange={actions.selectViewport}
        />
        <label className="mt-3 block text-xs text-zinc-500">
          Width
          <input
            type="number"
            min={previewWidthLimits.min}
            max={previewWidthLimits.max}
            value={scenario.width}
            onChange={(event) => {
              const nextWidth = event.currentTarget.valueAsNumber
              if (Number.isFinite(nextWidth)) actions.setCustomWidth(nextWidth)
            }}
            className="mt-1 w-full rounded-md border border-zinc-800 bg-zinc-950 px-2.5 py-1.5 font-mono text-sm text-zinc-100 outline-none focus:border-indigo-400"
          />
        </label>
      </SidebarSection>

      <SidebarSection title="Saved Scenarios">
        <SavedScenarios scenario={scenario} actions={actions} />
      </SidebarSection>

      <div className="px-4 py-4">
        <button
          type="button"
          onClick={actions.reset}
          className="w-full rounded-md border border-zinc-700 px-2.5 py-1.5 text-sm text-zinc-300 hover:border-indigo-400/40 hover:text-indigo-200"
        >
          Reset
        </button>
      </div>
    </div>
  )
}

function SidebarSection({
  title,
  children,
}: {
  title: string
  children: ReactNode
}) {
  return (
    <section className="border-b border-zinc-800 px-4 py-4">
      <h2 className="font-mono text-[11px] font-medium tracking-[0.16em] text-zinc-500 uppercase">
        {title}
      </h2>
      <div className="mt-3">{children}</div>
    </section>
  )
}

function ChoiceGroup<T extends string>({
  label,
  options,
  value,
  onChange,
  disabled = false,
}: {
  label: string
  options: readonly { id: T; label: string }[]
  value: T
  onChange: (id: T) => void
  disabled?: boolean
}) {
  return (
    <div role="radiogroup" aria-label={label} className="flex flex-col gap-1.5">
      {options.map((option) => {
        const selected = option.id === value
        return (
          <button
            key={option.id}
            type="button"
            role="radio"
            aria-checked={selected}
            disabled={disabled}
            onClick={() => onChange(option.id)}
            className={`w-full rounded-md border px-2.5 py-1.5 text-left text-sm disabled:cursor-not-allowed disabled:opacity-40 ${
              selected
                ? "border-indigo-400/70 bg-indigo-500/15 text-indigo-100"
                : "border-zinc-800 bg-zinc-900 text-zinc-200 hover:border-zinc-700"
            }`}
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}

type Feedback = {
  tone: "ok" | "error"
  message: string
}

type PendingChange =
  | { kind: "overwrite"; name: string }
  | { kind: "replace-storage"; name: string }
  | { kind: "delete"; id: string; name: string }

function storageErrorMessage(error: StorageError, name = ""): string {
  switch (error) {
    case "empty-name":
      return "Enter a scenario name before saving."
    case "duplicate-name":
      return `A scenario named "${name}" already exists. Replace it?`
    case "unavailable":
      return "Saved scenarios are unavailable in this browser."
    case "malformed":
      return `Saved scenarios could not be read. Replace stored data with "${name}"?`
    case "incompatible":
      return `Saved scenarios use an unsupported format. Replace stored data with "${name}"?`
    case "write-failed":
      return "Couldn't update saved scenarios because browser storage is full."
    case "invalid":
      return "This scenario could not be saved."
    case "not-found":
      return "That saved scenario is no longer stored."
  }
}

function initialFeedback(result: StorageReadResult): Feedback | null {
  if (!result.ok) {
    return {
      tone: "error",
      message:
        result.error === "malformed"
          ? "Saved scenarios could not be read."
          : result.error === "incompatible"
            ? "Saved scenarios use an unsupported format."
            : storageErrorMessage(result.error),
    }
  }
  if (result.dropped === 0) return null
  return {
    tone: "error",
    message:
      result.dropped === 1
        ? "Ignored 1 invalid saved scenario."
        : `Ignored ${result.dropped} invalid saved scenarios.`,
  }
}

function optionLabel<T extends string>(
  options: readonly { id: T; label: string }[],
  id: T,
): string {
  return options.find((option) => option.id === id)?.label ?? id
}

function scenarioDetail(entry: SavedScenario): string {
  const viewport =
    entry.viewport === "custom"
      ? `${entry.width}px`
      : `${optionLabel(viewportOptions, entry.viewport)} ${entry.width}px`
  const parts = [
    optionLabel(componentOptions, entry.component),
    optionLabel(stateOptions, entry.state),
    viewport,
  ]
  if (entry.compare.enabled) {
    parts.push(`Compare ${optionLabel(stateOptions, entry.compare.stateB)}`)
  }
  return parts.join(" · ")
}

function SavedScenarios({ scenario, actions }: SidebarProps) {
  const [stored] = useState(readSavedScenarios)
  const [entries, setEntries] = useState(stored.ok ? stored.scenarios : [])
  const [feedback, setFeedback] = useState<Feedback | null>(initialFeedback(stored))
  const [pending, setPending] = useState<PendingChange | null>(null)

  function draft(): SavedScenario {
    return {
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
    }
  }

  function applySavedName(saved: SavedScenario | undefined) {
    if (saved && saved.name !== scenario.name) actions.setName(saved.name)
  }

  function applyMutation(result: StorageMutationResult, success: string) {
    if (
      result.ok ||
      result.error === "duplicate-name" ||
      result.error === "not-found" ||
      result.error === "invalid" ||
      result.error === "write-failed"
    ) {
      setEntries(result.scenarios)
    }
    if (!result.ok) {
      const name = scenario.name.trim()
      if (result.error === "duplicate-name") {
        setPending({ kind: "overwrite", name })
      } else if (result.error === "malformed" || result.error === "incompatible") {
        setPending({ kind: "replace-storage", name })
      } else {
        setPending(null)
      }
      setFeedback({ tone: "error", message: storageErrorMessage(result.error, name) })
      return
    }
    setPending(null)
    applySavedName(result.saved)
    setFeedback({ tone: "ok", message: success })
  }

  function onSave() {
    const result = saveScenario(draft(), false)
    const name = result.ok ? result.saved?.name ?? scenario.name.trim() : scenario.name.trim()
    applyMutation(result, `Saved "${name}".`)
  }

  function confirmPending() {
    if (!pending) return
    if (pending.kind === "delete") {
      const result = deleteSavedScenario(pending.id)
      applyMutation(result, `Deleted "${pending.name}".`)
      return
    }
    if (pending.kind === "overwrite") {
      const result = saveScenario(draft(), true)
      const name = result.ok ? result.saved?.name ?? pending.name : pending.name
      applyMutation(result, `Replaced saved scenario "${name}".`)
      return
    }
    const result = replaceSavedScenarios(draft())
    const name = result.ok ? result.saved?.name ?? pending.name : pending.name
    applyMutation(result, `Replaced stored scenarios with "${name}".`)
  }

  function cancelPending() {
    if (!pending) return
    const message =
      pending.kind === "delete"
        ? `Kept "${pending.name}".`
        : `Left "${pending.name}" unchanged.`
    setPending(null)
    setFeedback({ tone: "ok", message })
  }

  function onLoad(entry: SavedScenario) {
    actions.loadScenario(entry)
    setPending(null)
    setFeedback({ tone: "ok", message: `Loaded "${entry.name}".` })
  }

  function onDelete(entry: SavedScenario) {
    setPending({ kind: "delete", id: entry.id, name: entry.name })
    setFeedback({
      tone: "error",
      message: `Delete "${entry.name}"? This removes it from this browser.`,
    })
  }

  const pendingName = scenario.name.trim()
  const promptMatches = !pending || pending.kind === "delete" || pending.name === pendingName
  const visiblePending = promptMatches ? pending : null
  const visibleFeedback = promptMatches ? feedback : null

  return (
    <div>
      <label className="block text-xs text-zinc-500" htmlFor="scenario-name">
        Scenario name
        <input
          id="scenario-name"
          type="text"
          maxLength={80}
          value={scenario.name}
          aria-describedby={visibleFeedback ? "saved-scenario-status" : undefined}
          onChange={(event) => actions.setName(event.currentTarget.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault()
              onSave()
            }
          }}
          className="mt-1 w-full rounded-md border border-zinc-800 bg-zinc-950 px-2.5 py-1.5 text-sm text-zinc-100 outline-none focus:border-indigo-400"
        />
      </label>
      <button
        type="button"
        onClick={onSave}
        className="mt-2 w-full rounded-md border border-indigo-400/70 bg-indigo-500/15 px-2.5 py-1.5 text-sm text-indigo-100 hover:bg-indigo-500/25"
      >
        Save
      </button>
      {visibleFeedback ? (
        <p
          id="saved-scenario-status"
          role="status"
          data-scenario-feedback={visibleFeedback.tone}
          className={`mt-3 text-sm ${visibleFeedback.tone === "ok" ? "text-emerald-300" : "text-rose-300"}`}
        >
          {visibleFeedback.message}
        </p>
      ) : null}
      {visiblePending ? (
        <div className="mt-2 flex flex-wrap gap-1.5" role="group" aria-label="Confirm saved scenario change">
          <button
            type="button"
            onClick={confirmPending}
            className={`rounded-md border px-2 py-1 text-xs ${
              visiblePending.kind === "delete"
                ? "border-rose-400/50 bg-rose-500/10 text-rose-100"
                : "border-indigo-400/70 bg-indigo-500/15 text-indigo-100"
            }`}
          >
            {visiblePending.kind === "delete" ? "Delete" : "Replace"}
          </button>
          <button
            type="button"
            onClick={cancelPending}
            className="rounded-md border border-zinc-700 px-2 py-1 text-xs text-zinc-300 hover:border-zinc-500"
          >
            Cancel
          </button>
        </div>
      ) : null}
      {entries.length === 0 && visibleFeedback?.tone !== "error" ? (
        <p className="mt-3 rounded-md border border-dashed border-zinc-800 px-3 py-6 text-center text-sm text-zinc-500">
          No saved scenarios
        </p>
      ) : null}
      {entries.length > 0 ? (
        <ul className="mt-3 flex flex-col gap-2" aria-label="Saved scenarios">
          {entries.map((entry) => {
            const detail = scenarioDetail(entry)
            return (
              <li
                key={entry.id}
                data-saved-scenario={entry.id}
                className="rounded-md border border-zinc-800 bg-zinc-900 px-2.5 py-2"
              >
                <p className="truncate text-sm text-zinc-100" title={entry.name}>
                  {entry.name}
                </p>
                <p className="mt-0.5 truncate font-mono text-[11px] text-zinc-500" title={detail}>
                  {detail}
                </p>
                <div className="mt-2 flex gap-1.5">
                  <button
                    type="button"
                    aria-label={`Load ${entry.name}`}
                    onClick={() => onLoad(entry)}
                    className="rounded-md border border-zinc-700 px-2 py-1 text-xs text-zinc-200 hover:border-indigo-400/40 hover:text-indigo-200"
                  >
                    Load
                  </button>
                  <button
                    type="button"
                    aria-label={`Delete ${entry.name}`}
                    onClick={() => onDelete(entry)}
                    className="rounded-md border border-zinc-700 px-2 py-1 text-xs text-zinc-300 hover:border-rose-400/50 hover:text-rose-200"
                  >
                    Delete
                  </button>
                </div>
              </li>
            )
          })}
        </ul>
      ) : null}
    </div>
  )
}
