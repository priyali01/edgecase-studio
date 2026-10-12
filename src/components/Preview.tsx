import type { ReactNode } from "react"
import { ProductList } from "../samples/ProductList.tsx"
import { ProfileCard } from "../samples/ProfileCard.tsx"
import type { ComponentId, Scenario, UIState } from "../types.ts"

export function Preview({ scenario }: { scenario: Scenario }) {
  return (
    <main className="flex min-h-0 min-w-0 flex-1 flex-col bg-zinc-950">
      <div className="flex h-9 shrink-0 items-center justify-between gap-3 border-b border-zinc-800 px-4">
        <span className="font-mono text-[11px] tracking-[0.16em] text-zinc-500 uppercase">
          Preview
        </span>
        <span className="truncate font-mono text-[11px] text-indigo-300">
          {scenario.viewport} · {scenario.width}px
        </span>
      </div>
      <div className="min-h-0 flex-1 overflow-auto p-3 sm:p-4">
        <div className="@container" style={{ width: scenario.width }} data-preview-frame>
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
