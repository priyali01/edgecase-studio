import type { ReactNode } from "react"
import { previewWidthLimits, type ScenarioActions } from "../hooks/useScenario.ts"
import type { ComponentId, Scenario, UIState, Viewport } from "../types.ts"

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
            onChange={actions.toggleCompare}
          />
          Compare
        </label>
        <div className="mt-3">
          <p className="mb-1.5 text-xs text-zinc-500">Comparison state</p>
          <ChoiceGroup
            label="Comparison state"
            options={stateOptions}
            value={scenario.compare.stateB}
            onChange={actions.setCompareState}
            disabled={!scenario.compare.enabled}
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
        <p className="rounded-md border border-dashed border-zinc-800 px-3 py-6 text-center text-sm text-zinc-500">
          No saved scenarios
        </p>
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
