import { useEffect, useRef, useState } from "react"
import type { KeyboardEvent, ReactNode } from "react"
import { SelectionMark } from "./SelectionMark.tsx"
import { previewWidthLimits, type ScenarioActions } from "../hooks/useScenario.ts"
import { clampPreviewWidth } from "../utils/guards.ts"
import { shortcutHelp } from "../hooks/useStudioShortcuts.ts"
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
  const [widthNotice, setWidthNotice] = useState<string | null>(null)
  const acceptedWidth = useRef<number | null>(null)

  useEffect(() => {
    if (acceptedWidth.current === scenario.width) {
      acceptedWidth.current = null
      return
    }
    setWidthNotice(null)
  }, [scenario.width, scenario.viewport])

  function onWidthInput(value: number) {
    if (!Number.isFinite(value)) return
    const nextWidth = clampPreviewWidth(value)
    if (nextWidth === null) return
    if (value < previewWidthLimits.min || value > previewWidthLimits.max) {
      acceptedWidth.current = nextWidth
      setWidthNotice(
        `Width must be from ${previewWidthLimits.min} to ${previewWidthLimits.max} pixels.`,
      )
    } else {
      acceptedWidth.current = null
      setWidthNotice(null)
    }
    actions.setCustomWidth(value)
  }

  return (
    <div
      tabIndex={0}
      aria-label="Sidebar"
      className="flex h-full min-h-0 flex-col overflow-y-auto overscroll-contain"
    >
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
        <label className="mt-3 flex items-center gap-2 text-[13px] text-zinc-300">
          <input
            type="checkbox"
            className="size-3.5 accent-indigo-500"
            checked={scenario.compare.enabled}
            onChange={(event) => actions.setCompareEnabled(event.currentTarget.checked)}
          />
          Compare
        </label>
        <label className="mt-2 flex items-center gap-2 text-[13px] text-zinc-300">
          <input
            type="checkbox"
            className="size-3.5 accent-indigo-500"
            checked={scenario.matrix.enabled}
            onChange={(event) => actions.setMatrixEnabled(event.currentTarget.checked)}
          />
          Matrix
        </label>
        <div className="mt-3">
          <p className="mb-1.5 text-[11px] font-medium tracking-wide text-zinc-400 uppercase">Comparison state</p>
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
          onChange={(viewport) => {
            setWidthNotice(null)
            acceptedWidth.current = null
            actions.selectViewport(viewport)
          }}
        />
        <label className="mt-3 block text-[11px] font-medium tracking-wide text-zinc-400 uppercase">
          Width
          <span className="sr-only"> in pixels</span>
          <input
            type="number"
            min={previewWidthLimits.min}
            max={previewWidthLimits.max}
            value={scenario.width}
            onChange={(event) => onWidthInput(event.currentTarget.valueAsNumber)}
            aria-describedby={widthNotice ? "width-notice" : undefined}
            className="mt-1.5 w-full rounded-lg border border-white/10 bg-white/[0.04] px-2.5 py-1.5 font-mono text-[13px] text-zinc-100 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] transition-colors duration-150 focus:border-white/25 motion-reduce:transition-none"
          />
        </label>
        {widthNotice ? (
          <p id="width-notice" role="status" className="mt-2 text-xs text-amber-200">
            {widthNotice}
          </p>
        ) : null}
      </SidebarSection>

      <SidebarSection title="Saved Scenarios">
        <SavedScenarios scenario={scenario} actions={actions} />
      </SidebarSection>

      <SidebarSection title="Shortcuts">
        <ul className="grid grid-cols-2 gap-x-3 gap-y-1.5" aria-label="Keyboard shortcuts">
          {shortcutHelp.map((item) => (
            <li key={item.key} className="flex min-w-0 items-center gap-2 text-[12px]">
              <kbd className="inline-grid h-5 min-w-5 shrink-0 place-items-center rounded border border-white/10 bg-white/[0.04] px-1 font-mono text-[10px] text-zinc-300">
                {item.key}
              </kbd>
              <span className="truncate text-zinc-400">{item.label}</span>
            </li>
          ))}
        </ul>
      </SidebarSection>

      <div className="px-3 py-3">
        <button
          type="button"
          onClick={actions.reset}
          className="w-full rounded-md border border-zinc-700 px-2.5 py-1.5 text-[13px] text-zinc-300 transition-colors duration-150 hover:border-zinc-500 hover:bg-white/[0.03] hover:text-zinc-100 motion-reduce:transition-none"
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
    <section className="border-b border-white/8 px-3 py-3">
      <h2 className="text-[11px] font-medium tracking-[0.08em] text-zinc-400 uppercase">
        {title}
      </h2>
      <div className="mt-2.5">{children}</div>
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
  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (disabled) return
    const buttons = [...event.currentTarget.querySelectorAll<HTMLButtonElement>("[data-choice]")]
    const focused = buttons.findIndex((button) => button === document.activeElement)
    const current = focused >= 0 ? focused : options.findIndex((option) => option.id === value)
    if (current < 0 || buttons.length === 0) return
    let next = current
    if (event.key === "ArrowDown" || event.key === "ArrowRight") {
      next = (current + 1) % options.length
    } else if (event.key === "ArrowUp" || event.key === "ArrowLeft") {
      next = (current - 1 + options.length) % options.length
    } else if (event.key === "Home") {
      next = 0
    } else if (event.key === "End") {
      next = options.length - 1
    } else {
      return
    }
    event.preventDefault()
    const option = options[next]
    if (!option) return
    onChange(option.id)
    buttons[next]?.focus()
  }

  return (
    <div role="radiogroup" aria-label={label} className="flex flex-col gap-1" onKeyDown={onKeyDown}>
      {options.map((option) => {
        const selected = option.id === value
        return (
          <button
            key={option.id}
            type="button"
            role="radio"
            data-choice={option.id}
            aria-checked={selected}
            tabIndex={selected ? 0 : -1}
            disabled={disabled}
            onClick={() => onChange(option.id)}
            className={`flex w-full items-center gap-2 rounded-md border px-2 py-1.5 text-left text-[13px] transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-40 motion-reduce:transition-none ${
              selected
                ? "border-white/15 bg-white/10 font-medium text-zinc-50 shadow-[inset_0_1px_0_rgba(255,255,255,0.12)]"
                : "border-transparent text-zinc-300 hover:border-white/10 hover:bg-white/[0.04]"
            }`}
          >
            <SelectionMark selected={selected} />
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
    case "invalid-name":
      return "Use a name up to 80 characters, without line breaks."
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
  const mutationLock = useRef(false)

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
    if (result.saved) actions.rememberSaved(result.saved)
    setFeedback({ tone: "ok", message: success })
  }

  function runMutation(apply: () => void) {
    if (mutationLock.current) return
    mutationLock.current = true
    try {
      apply()
    } finally {
      mutationLock.current = false
    }
  }

  function onSave() {
    runMutation(() => {
      const result = saveScenario(draft(), false)
      const name = result.ok ? result.saved?.name ?? scenario.name.trim() : scenario.name.trim()
      applyMutation(result, `Saved "${name}".`)
    })
  }

  function confirmPending() {
    if (!pending) return
    const change = pending
    runMutation(() => {
      if (change.kind === "delete") {
        const loaded = scenario.id === change.id
        const result = deleteSavedScenario(change.id)
        if (loaded && (result.ok || result.error === "not-found")) actions.releaseSaved(change.id)
        applyMutation(
          result,
          loaded
            ? `Deleted "${change.name}". The preview is unchanged.`
            : `Deleted "${change.name}".`,
        )
        return
      }
      if (change.kind === "overwrite") {
        const result = saveScenario(draft(), true)
        const name = result.ok ? result.saved?.name ?? change.name : change.name
        applyMutation(result, `Replaced saved scenario "${name}".`)
        return
      }
      const result = replaceSavedScenarios(draft())
      const name = result.ok ? result.saved?.name ?? change.name : change.name
      applyMutation(result, `Replaced stored scenarios with "${name}".`)
    })
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
    if (!actions.loadScenario(entry)) {
      setPending(null)
      setFeedback({ tone: "error", message: "That saved scenario could not be loaded." })
      return
    }
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
      <label className="block text-[11px] font-medium tracking-wide text-zinc-400 uppercase" htmlFor="scenario-name">
        Scenario name
        <input
          id="scenario-name"
          type="text"
          maxLength={80}
          value={scenario.name}
          aria-describedby={visibleFeedback ? "saved-scenario-status" : undefined}
          onChange={(event) => {
            const nextName = event.currentTarget.value
            actions.setName(nextName)
            if (pending && pending.kind !== "delete" && pending.name !== nextName.trim()) {
              setPending(null)
              setFeedback(null)
            }
          }}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault()
              onSave()
            }
          }}
          className="mt-1.5 w-full rounded-lg border border-white/10 bg-white/[0.04] px-2.5 py-1.5 text-[13px] text-zinc-100 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] transition-colors duration-150 focus:border-white/25 motion-reduce:transition-none"
        />
      </label>
      <button
        type="button"
        onClick={onSave}
        className="mt-2 w-full rounded-md border border-indigo-400/40 bg-indigo-500/15 px-2.5 py-1.5 text-[13px] font-medium text-indigo-100 transition-colors duration-150 hover:border-indigo-300/60 hover:bg-indigo-500/25 motion-reduce:transition-none"
      >
        Save
      </button>
      {visibleFeedback ? (
        <p
          key={visibleFeedback.message}
          id="saved-scenario-status"
          role={visibleFeedback.tone === "error" ? "alert" : "status"}
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
            className={`rounded-md border px-2 py-1 text-[12px] transition-colors duration-150 motion-reduce:transition-none ${
              visiblePending.kind === "delete"
                ? "border-rose-400/40 bg-rose-500/10 text-rose-100 hover:bg-rose-500/20"
                : "border-indigo-400/40 bg-indigo-500/15 text-indigo-100 hover:bg-indigo-500/25"
            }`}
          >
            {visiblePending.kind === "delete" ? "Delete" : "Replace"}
          </button>
          <button
            type="button"
            onClick={cancelPending}
            className="rounded-md border border-zinc-700 px-2 py-1 text-[12px] text-zinc-300 transition-colors duration-150 hover:border-zinc-500 hover:text-zinc-100 motion-reduce:transition-none"
          >
            Cancel
          </button>
        </div>
      ) : null}
      {entries.length === 0 && visibleFeedback?.tone !== "error" ? (
        <p className="mt-3 rounded-md border border-dashed border-white/10 px-3 py-4 text-center text-[13px] text-zinc-400">
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
                className="rounded-xl border border-white/10 bg-white/[0.04] px-2.5 py-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] transition-colors duration-150 hover:border-white/20 motion-reduce:transition-none"
              >
                <p className="truncate text-sm text-zinc-100" title={entry.name}>
                  {entry.name}
                </p>
                <p className="mt-0.5 truncate font-mono text-[11px] text-zinc-400" title={detail}>
                  {detail}
                </p>
                <div className="mt-2 flex gap-1.5">
                  <button
                    type="button"
                    aria-label={`Load ${entry.name}`}
                    onClick={() => onLoad(entry)}
                    className="rounded-md border border-zinc-700 px-2 py-1 text-[12px] text-zinc-200 transition-colors duration-150 hover:border-indigo-400/50 hover:text-indigo-100 motion-reduce:transition-none"
                  >
                    Load
                  </button>
                  <button
                    type="button"
                    aria-label={`Delete ${entry.name}`}
                    onClick={() => onDelete(entry)}
                    className="rounded-md border border-zinc-700 px-2 py-1 text-[12px] text-zinc-300 transition-colors duration-150 hover:border-rose-400/50 hover:text-rose-200 motion-reduce:transition-none"
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
