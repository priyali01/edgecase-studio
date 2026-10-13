import { useEffect, useState } from "react"
import { Preview } from "./components/Preview.tsx"
import { Sidebar } from "./components/Sidebar.tsx"
import { useScenario } from "./hooks/useScenario.ts"
import { useStudioShortcuts } from "./hooks/useStudioShortcuts.ts"

export default function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
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
    <div className="flex h-svh flex-col overflow-hidden border-t-2 border-indigo-500 bg-zinc-950 text-zinc-100">
      <header className="flex h-12 shrink-0 items-center gap-3 border-b border-zinc-800 bg-zinc-950 px-3">
        <button
          type="button"
          className="grid size-8 shrink-0 place-items-center rounded-md border border-zinc-800 text-zinc-300 hover:border-indigo-400/40 hover:text-indigo-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-400 md:hidden"
          aria-expanded={sidebarOpen}
          aria-controls="studio-sidebar"
          onClick={() => setSidebarOpen((open) => !open)}
        >
          <MenuIcon open={sidebarOpen} />
          <span className="sr-only">
            {sidebarOpen ? "Close sidebar" : "Open sidebar"}
          </span>
        </button>
        <div className="flex min-w-0 flex-1 items-baseline gap-3">
          <h1 className="shrink-0 text-sm font-semibold tracking-tight text-zinc-50">
            EdgeCase Studio
          </h1>
          <p className="truncate text-sm text-zinc-400">See how your UI breaks.</p>
        </div>
      </header>

      <div className="relative flex min-h-0 min-w-0 flex-1 overflow-hidden">
        {sidebarOpen ? (
          <button
            type="button"
            className="absolute inset-0 z-20 bg-zinc-950/70 md:hidden"
            aria-label="Close sidebar"
            onClick={() => setSidebarOpen(false)}
          />
        ) : null}

        <aside
          id="studio-sidebar"
          className={`absolute inset-y-0 left-0 z-30 w-[280px] max-w-full border-r border-zinc-800 bg-zinc-950 transition-transform duration-200 md:static md:shrink-0 md:translate-x-0 ${
            sidebarOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <Sidebar scenario={scenario} actions={actions} />
        </aside>

        <Preview scenario={scenario} actions={actions} />
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
