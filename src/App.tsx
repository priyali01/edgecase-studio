export default function App() {
  return (
    <div className="flex min-h-svh flex-col border-t-2 border-indigo-500 bg-zinc-950 text-zinc-100">
      <header className="border-b border-zinc-800 bg-zinc-950">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <span
              aria-hidden="true"
              className="grid size-8 shrink-0 place-items-center rounded-md bg-indigo-500 text-xs font-semibold tracking-tight text-white shadow-[0_0_0_1px_rgba(99,102,241,0.45)]"
            >
              EC
            </span>
            <span className="truncate text-sm font-medium text-zinc-200">
              EdgeCase Studio
            </span>
          </div>
          <span className="rounded-full border border-indigo-400/30 bg-indigo-500/10 px-2.5 py-1 font-mono text-[11px] uppercase tracking-wider text-indigo-300">
            Dev
          </span>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-4 py-8 sm:px-6 sm:py-12">
        <section className="flex flex-1 flex-col justify-center rounded-xl border border-zinc-800 bg-zinc-900/70 px-6 py-12 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] sm:px-10 sm:py-16">
          <p className="font-mono text-xs uppercase tracking-[0.22em] text-indigo-400">
            UI playground
          </p>
          <h1 className="mt-4 max-w-3xl text-4xl font-semibold tracking-tight text-zinc-50 sm:text-5xl">
            EdgeCase Studio
          </h1>
          <p className="mt-4 max-w-xl text-lg leading-relaxed text-zinc-400 sm:text-xl">
            See how your UI breaks.
          </p>
        </section>
      </main>

      <footer className="border-t border-zinc-800">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-3 px-4 py-2.5 font-mono text-xs text-zinc-500 sm:px-6">
          <span className="inline-flex items-center gap-2">
            <span className="size-1.5 rounded-full bg-indigo-400" aria-hidden="true" />
            Ready
          </span>
          <span>shell</span>
        </div>
      </footer>
    </div>
  )
}
