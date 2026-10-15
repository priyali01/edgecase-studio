import { useEffect, useState } from "react"
import { Preview } from "./components/Preview.tsx"
import { Sidebar } from "./components/Sidebar.tsx"
import { useScenario } from "./hooks/useScenario.ts"
import { useStudioShortcuts } from "./hooks/useStudioShortcuts.ts"
import type { Scenario, UIState } from "./types.ts"

const stateLabels: Record<UIState, string> = {
  success: "Success",
  loading: "Loading",
  empty: "Empty",
  error: "Error",
  long: "Long",
}

function studioStatus(scenario: Scenario): string {
  const component = scenario.component === "profile" ? "Profile" : "Products"
  const mode = scenario.matrix.enabled ? "Matrix" : scenario.compare.enabled ? "Compare" : null
  return [component, stateLabels[scenario.state], `${scenario.width}px`, mode].filter(Boolean).join(" · ")
}

function useNarrowLayout() {
  const [narrow, setNarrow] = useState(() => window.matchMedia("(max-width: 767px)").matches)

  useEffect(() => {
    const media = window.matchMedia("(max-width: 767px)")
    const update = () => setNarrow(media.matches)
    update()
    media.addEventListener("change", update)
    return () => media.removeEventListener("change", update)
  }, [])

  return narrow
}

export default function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const narrow = useNarrowLayout()
  const { scenario, actions } = useScenario()
  useStudioShortcuts(scenario, actions)

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setSidebarOpen(false)
      }
    }

    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [])

  return (
    <div className="studio-backdrop h-svh p-2 text-zinc-100 sm:p-3">
    <div className="glass-window flex h-full min-h-0 flex-col overflow-hidden rounded-[22px]">
      <header className="glass-bar flex h-10 shrink-0 items-center gap-2.5 border-b border-white/10 px-3">
        <button
          type="button"
          className="grid size-7 shrink-0 place-items-center rounded-md border border-white/10 text-zinc-300 transition-colors duration-150 hover:border-white/20 hover:bg-white/[0.04] hover:text-zinc-100 motion-reduce:transition-none md:hidden"
          aria-expanded={sidebarOpen}
          aria-controls="studio-sidebar"
          onClick={() => setSidebarOpen((open) => !open)}
        >
          <MenuIcon open={sidebarOpen} />
          <span className="sr-only">
            {sidebarOpen ? "Close sidebar" : "Open sidebar"}
          </span>
        </button>
        <div className="flex min-w-0 flex-1 items-center gap-2.5">
          <span aria-hidden="true" className="size-1.5 shrink-0 rounded-full bg-indigo-400" />
          <h1 className="shrink-0 text-[13px] font-medium tracking-tight text-zinc-50">
            EdgeCase Studio
          </h1>
          <p className="hidden truncate text-[13px] text-zinc-500 sm:block">See how your UI breaks.</p>
        </div>
        <p className="hidden max-w-[46%] truncate font-mono text-[11px] text-zinc-500 md:block">
          {studioStatus(scenario)}
        </p>
      </header>

      <div className="relative flex min-h-0 min-w-0 flex-1 overflow-hidden">
        {sidebarOpen ? (
          <button
            type="button"
            className="studio-fade absolute inset-0 z-20 bg-black/35 backdrop-blur-sm md:hidden"
            aria-label="Close sidebar"
            onClick={() => setSidebarOpen(false)}
          />
        ) : null}

        <aside
          id="studio-sidebar"
          aria-label="Studio sidebar"
          inert={narrow && !sidebarOpen}
          className={`glass-bar absolute inset-y-0 left-0 z-30 w-64 max-w-full border-r border-white/10 transition-transform duration-200 ease-out motion-reduce:transition-none md:static md:shrink-0 md:translate-x-0 ${
            sidebarOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <Sidebar scenario={scenario} actions={actions} />
        </aside>

        <Preview scenario={scenario} actions={actions} />
      </div>
    </div>
    </div>
  )
}

function MenuIcon({ open }: { open: boolean }) {
  return (
    <svg viewBox="0 0 20 20" className="size-4" aria-hidden="true">
      {open ? (
        <path
          d="M5 5l10 10M15 5L5 15"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      ) : (
        <path
          d="M3.5 5.5h13M3.5 10h13M3.5 14.5h13"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      )}
    </svg>
  )
}
