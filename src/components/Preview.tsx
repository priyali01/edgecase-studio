import type { ReactNode } from "react"
import {
  previewWidthLimits,
  viewportPresets,
  type ScenarioActions,
} from "../hooks/useScenario.ts"
import { ProductList } from "../samples/ProductList.tsx"
import { ProfileCard } from "../samples/ProfileCard.tsx"
import type { ComponentId, Scenario, UIState } from "../types.ts"

type PreviewProps = {
  scenario: Scenario
  actions: ScenarioActions
}

export function Preview({ scenario, actions }: PreviewProps) {
  return (
    <main className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-zinc-950">
      <div className="flex shrink-0 flex-wrap items-center gap-x-3 gap-y-2 border-b border-zinc-800 px-3 py-2">
        <div className="flex flex-wrap gap-1" role="group" aria-label="Viewport presets">
          {viewportPresets.map((preset) => {
            const selected = scenario.viewport === preset.id
            return (
              <button
                key={preset.id}
                type="button"
                aria-pressed={selected}
                onClick={() => actions.selectViewport(preset.id)}
                className={`rounded-md border px-2.5 py-1 text-xs ${
                  selected
                    ? "border-indigo-400/70 bg-indigo-500/15 text-indigo-100"
                    : "border-zinc-800 bg-zinc-900 text-zinc-300 hover:border-zinc-700"
                }`}
              >
                {preset.label}
              </button>
            )
          })}
        </div>
        <label className="flex min-w-0 flex-1 items-center gap-2">
          <span className="sr-only">Preview width</span>
          <input
            type="range"
            min={previewWidthLimits.min}
            max={previewWidthLimits.max}
            value={scenario.width}
            onChange={(event) => {
              actions.setCustomWidth(event.currentTarget.valueAsNumber)
            }}
            className="min-w-24 flex-1 accent-indigo-500"
          />
          <span className="w-14 shrink-0 text-right font-mono text-xs text-indigo-300">
            {scenario.width}px
          </span>
        </label>
      </div>

      <div className="min-h-0 min-w-0 flex-1 overflow-auto" data-preview-scroll>
        <div className="flex min-h-full w-fit min-w-full justify-center p-4">
          <div
            data-preview-frame
            style={{ width: scenario.width }}
            className="shrink-0 rounded-[1.35rem] border border-zinc-700 bg-zinc-950 p-2 shadow-[0_0_0_1px_rgba(99,102,241,0.18)]"
          >
            <div className="@container w-full">
              {scenario.compare.enabled ? (
                <div className="flex flex-col gap-4 @min-[720px]:flex-row">
                  <Pane label={`A · ${scenario.state}`}>
                    <Sample component={scenario.component} state={scenario.state} />
                  </Pane>
                  <Pane label={`B · ${scenario.compare.stateB}`}>
                    <Sample component={scenario.component} state={scenario.compare.stateB} />
                  </Pane>
                </div>
              ) : (
                <Sample component={scenario.component} state={scenario.state} />
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}

function Pane({ label, children }: { label: string; children: ReactNode }) {
  return (
    <section className="min-w-0 flex-1">
      <p className="mb-2 font-mono text-[11px] tracking-[0.14em] text-zinc-500 uppercase">
        {label}
      </p>
      {children}
    </section>
  )
}

function Sample({ component, state }: { component: ComponentId; state: UIState }) {
  switch (component) {
    case "profile":
      return <ProfileCard state={state} />
    case "products":
      return <ProductList state={state} />
    default: {
      const unexpected: never = component
      throw new Error(`Unexpected component: ${unexpected}`)
    }
  }
}
