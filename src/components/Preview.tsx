import { useRef, useState, type ReactNode } from "react"
import {
  previewWidthLimits,
  viewportPresets,
  type ScenarioActions,
} from "../hooks/useScenario.ts"
import { ProductList } from "../samples/ProductList.tsx"
import { ProfileCard } from "../samples/ProfileCard.tsx"
import type { ComponentId, Scenario, UIState } from "../types.ts"

const stateChoices: readonly { id: UIState; label: string }[] = [
  { id: "success", label: "Success" },
  { id: "loading", label: "Loading" },
  { id: "empty", label: "Empty" },
  { id: "error", label: "Error" },
  { id: "long", label: "Long content" },
]

type PreviewProps = {
  scenario: Scenario
  actions: ScenarioActions
}

type LayoutFrameReport = {
  label: string
  viewportWidth: number
  contentScrollWidth: number
  overflow: number
}

function readLayoutReport(canvas: HTMLElement): LayoutFrameReport[] {
  return [...canvas.querySelectorAll<HTMLElement>("[data-preview-frame]")].map((frame) => {
    const content = frame.querySelector<HTMLElement>("[data-preview-content]") ?? frame
    const viewportWidth = Math.round(frame.getBoundingClientRect().width)
    const contentScrollWidth = content.scrollWidth
    const overflow = Math.max(0, contentScrollWidth - content.clientWidth)
    return {
      label: frame.getAttribute("data-preview-label") ?? "Preview",
      viewportWidth,
      contentScrollWidth,
      overflow,
    }
  })
}

export function Preview({ scenario, actions }: PreviewProps) {
  const canvasRef = useRef<HTMLDivElement>(null)
  const [layoutReport, setLayoutReport] = useState<LayoutFrameReport[] | null>(null)

  function checkLayout() {
    const canvas = canvasRef.current
    setLayoutReport(canvas ? readLayoutReport(canvas) : [])
  }

  return (
    <main className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-zinc-950">
      <div className="shrink-0 border-b border-zinc-800">
      <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-2 px-3 py-2">
        <div className="flex flex-wrap gap-1" role="group" aria-label="View mode">
          <ModeButton
            pressed={scenario.compare.enabled}
            onClick={() => actions.setCompareEnabled(!scenario.compare.enabled)}
          >
            Compare
          </ModeButton>
          <ModeButton
            pressed={scenario.matrix.enabled}
            onClick={() => actions.setMatrixEnabled(!scenario.matrix.enabled)}
          >
            Matrix
          </ModeButton>
        </div>
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
        <label className="flex min-w-44 flex-1 items-center gap-2">
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
        <button
          type="button"
          onClick={checkLayout}
          className="rounded-md border border-zinc-800 bg-zinc-900 px-2.5 py-1 text-xs text-zinc-300 hover:border-zinc-700"
        >
          Check layout
        </button>
      </div>
      {layoutReport ? <LayoutReport frames={layoutReport} /> : null}
      </div>

      <div ref={canvasRef} className="min-h-0 min-w-0 flex-1 overflow-auto" data-preview-scroll>
        {scenario.matrix.enabled ? (
          <MatrixView
            component={scenario.component}
            width={scenario.width}
            onSelect={(state) => {
              actions.setState(state)
              actions.setMatrixEnabled(false)
            }}
          />
        ) : (
          <div className="flex min-h-full w-fit min-w-full justify-center p-4">
            <div
              className={`flex items-start gap-4 ${
                scenario.compare.enabled ? "flex-col md:flex-row" : ""
              }`}
            >
              <PreviewFrame
                title="Frame A"
                state={scenario.state}
                width={scenario.width}
                onStateChange={actions.setState}
              >
                <Sample component={scenario.component} state={scenario.state} />
              </PreviewFrame>
              {scenario.compare.enabled ? (
                <PreviewFrame
                  title="Frame B"
                  state={scenario.compare.stateB}
                  width={scenario.width}
                  onStateChange={actions.setCompareState}
                >
                  <Sample component={scenario.component} state={scenario.compare.stateB} />
                </PreviewFrame>
              ) : null}
            </div>
          </div>
        )}
      </div>
    </main>
  )
}

function MatrixView({
  component,
  width,
  onSelect,
}: {
  component: ComponentId
  width: number
  onSelect: (state: UIState) => void
}) {
  return (
    <div
      data-matrix-grid
      className="grid gap-4 p-4"
      style={{
        gridTemplateColumns: `repeat(auto-fill, minmax(${width}px, ${width}px))`,
      }}
    >
      {stateChoices.map((choice) => (
        <button
          key={choice.id}
          type="button"
          data-matrix-card={choice.id}
          onClick={() => onSelect(choice.id)}
          style={{ width }}
          className="block min-w-0 text-left"
        >
          <span className="mb-2 block truncate text-sm font-medium text-indigo-200">{choice.label}</span>
          <PreviewSurface label={choice.label} width={width}>
            <div inert>
              <Sample component={component} state={choice.id} />
            </div>
          </PreviewSurface>
        </button>
      ))}
    </div>
  )
}

function ModeButton({
  pressed,
  onClick,
  children,
}: {
  pressed: boolean
  onClick: () => void
  children: string
}) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      onClick={onClick}
      className={`rounded-md border px-2.5 py-1 text-xs ${
        pressed
          ? "border-indigo-400/70 bg-indigo-500/15 text-indigo-100"
          : "border-zinc-800 bg-zinc-900 text-zinc-300 hover:border-zinc-700"
      }`}
    >
      {children}
    </button>
  )
}

function PreviewFrame({
  title,
  state,
  width,
  onStateChange,
  children,
}: {
  title: string
  state: UIState
  width: number
  onStateChange: (state: UIState) => void
  children: ReactNode
}) {
  return (
    <section className="shrink-0" data-compare-frame={title}>
      <div className="mb-2 flex min-w-0 items-center justify-between gap-2" style={{ width }}>
        <h2 className="min-w-0 truncate font-mono text-[11px] font-medium tracking-[0.14em] text-indigo-300 uppercase">
          {title}
        </h2>
        <select
          aria-label={`${title} state`}
          value={state}
          onChange={(event) => {
            const nextState = event.currentTarget.value
            if (isUIState(nextState)) onStateChange(nextState)
          }}
          className="max-w-[65%] shrink-0 rounded-md border border-zinc-700 bg-zinc-900 px-2 py-1 text-xs text-zinc-100"
        >
          {stateChoices.map((choice) => (
            <option key={choice.id} value={choice.id}>
              {choice.label}
            </option>
          ))}
        </select>
      </div>
      <PreviewSurface label={title} width={width}>
        {children}
      </PreviewSurface>
    </section>
  )
}

function PreviewSurface({
  label,
  width,
  children,
}: {
  label: string
  width: number
  children: ReactNode
}) {
  return (
    <div
      data-preview-frame
      data-preview-label={label}
      style={{ width }}
      className="overflow-hidden rounded-[1.35rem] border border-zinc-700 bg-zinc-950 p-2 shadow-[0_0_0_1px_rgba(99,102,241,0.18)]"
    >
      <div data-preview-content className="@container w-full min-w-0 overflow-x-auto overscroll-x-contain">
        {children}
      </div>
    </div>
  )
}

function LayoutReport({ frames }: { frames: readonly LayoutFrameReport[] }) {
  return (
    <div
      role="status"
      aria-live="polite"
      data-layout-report
      className="border-t border-zinc-800 px-3 py-2"
    >
      <p className="text-[11px] text-zinc-500">
        Measured from the current preview. This is not a full visual check.
      </p>
      {frames.length === 0 ? (
        <p className="mt-2 text-xs text-amber-300">No preview frame to measure.</p>
      ) : (
        <ul className="mt-2 flex flex-col gap-2">
          {frames.map((frame) => (
            <li key={frame.label}>
              <p className="text-xs font-medium text-zinc-200">{frame.label}</p>
              <p className="font-mono text-[11px] text-zinc-400">
                Viewport {frame.viewportWidth}px · Content scroll width {frame.contentScrollWidth}px · Overflow{" "}
                {frame.overflow}px
              </p>
              {frame.overflow > 0 ? (
                <p className="text-xs text-amber-300">Horizontal overflow of {frame.overflow}px.</p>
              ) : (
                <p className="text-xs text-emerald-300">No horizontal overflow.</p>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function isUIState(value: string): value is UIState {
  return stateChoices.some((choice) => choice.id === value)
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
