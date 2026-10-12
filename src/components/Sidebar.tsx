import type { ReactNode } from "react"
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

const savedScenarios: readonly Scenario[] = []

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

function PlaceholderChoices({
  options,
}: {
  options: readonly { id: string; label: string }[]
}) {
  return (
    <div className="flex flex-col gap-1.5">
      {options.map((option) => (
        <button
          key={option.id}
          type="button"
          disabled
          className="w-full rounded-md border border-zinc-800 bg-zinc-900 px-2.5 py-1.5 text-left text-sm text-zinc-200 disabled:cursor-default disabled:opacity-100"
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}

export function Sidebar() {
  return (
    <div className="flex h-full min-h-0 flex-col overflow-y-auto overscroll-contain">
      <SidebarSection title="Component">
        <PlaceholderChoices options={componentOptions} />
      </SidebarSection>
      <SidebarSection title="State">
        <PlaceholderChoices options={stateOptions} />
      </SidebarSection>
      <SidebarSection title="Viewport">
        <PlaceholderChoices options={viewportOptions} />
      </SidebarSection>
      <SidebarSection title="Saved Scenarios">
        {savedScenarios.length === 0 ? (
          <p className="rounded-md border border-dashed border-zinc-800 px-3 py-6 text-center text-sm text-zinc-500">
            No saved scenarios
          </p>
        ) : (
          <ul className="flex flex-col gap-1.5">
            {savedScenarios.map((scenario) => (
              <li
                key={scenario.id}
                className="truncate rounded-md border border-zinc-800 bg-zinc-900 px-2.5 py-1.5 text-sm text-zinc-200"
              >
                {scenario.name}
              </li>
            ))}
          </ul>
        )}
      </SidebarSection>
    </div>
  )
}
