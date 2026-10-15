import { useRef, useState, type ReactNode } from "react"
import { SelectionMark } from "./SelectionMark.tsx"
import {
  previewWidthLimits,
  viewportPresets,
  type ScenarioActions,
} from "../hooks/useScenario.ts"
import { isComponentId, isUIState } from "../utils/guards.ts"
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

const stateLabels: Record<UIState, string> = {
  success: "Success",
  loading: "Loading",
  empty: "Empty",
  error: "Error",
  long: "Long content",
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

function formatTestReport(scenario: Scenario | null | undefined, frames: readonly LayoutFrameReport[]): string {
  const name =
    typeof scenario?.name === "string" && scenario.name.trim()
      ? scenario.name.trim()
      : "Unnamed scenario"
  const width = Number.isFinite(scenario?.width) ? `${scenario?.width}px` : "Unavailable"
  const state = scenario ? stateLabels[scenario.state] ?? "Unknown" : "Unknown"
  const overflow = frames.length === 0
    ? "Not detected"
    : frames.some((frame) => frame.overflow > 0)
      ? frames
          .filter((frame) => frame.overflow > 0)
          .map((frame) => `${frame.label}: ${frame.overflow}px`)
          .join(", ")
      : "None detected"

  return [
    "EdgeCase Studio test report",
    `Scenario: ${name}`,
    `Viewport width: ${width}`,
    `Selected state: ${state}`,
    `Horizontal overflow: ${overflow}`,
  ].join("\n")
}

export function Preview({ scenario, actions }: PreviewProps) {
  const canvasRef = useRef<HTMLDivElement>(null)
  const [layoutReport, setLayoutReport] = useState<LayoutFrameReport[] | null>(null)
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null)

  function checkLayout() {
    const canvas = canvasRef.current
    setLayoutReport(canvas ? readLayoutReport(canvas) : [])
  }

  async function copyTestReport() {
    const canvas = canvasRef.current
    const frames = canvas ? readLayoutReport(canvas) : []
    setLayoutReport(frames)
    const report = formatTestReport(scenario, frames)

    if (!navigator.clipboard) {
      setCopyFeedback("Couldn't copy the test report in this browser.")
      return
    }

    try {
      await navigator.clipboard.writeText(report)
      setCopyFeedback("Test report copied.")
    } catch {
      setCopyFeedback("Couldn't copy the test report.")
    }
  }

  return (
    <main className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
      <div className="glass-bar shrink-0 border-b border-white/10">
      <div className="flex min-w-0 flex-wrap items-center gap-x-2.5 gap-y-1.5 px-2.5 py-1.5">
        <div className="flex rounded-lg border border-white/10 bg-white/[0.04] p-0.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]" role="group" aria-label="View mode">
          <ModeButton
            pressed={scenario.compare.enabled}
            onClick={() => actions.toggleCompare()}
          >
            Compare
          </ModeButton>
          <ModeButton
            pressed={scenario.matrix.enabled}
            onClick={() => actions.toggleMatrix()}
          >
            Matrix
          </ModeButton>
        </div>
        <div className="flex rounded-lg border border-white/10 bg-white/[0.04] p-0.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]" role="group" aria-label="Viewport presets">
          {viewportPresets.map((preset) => {
            const selected = scenario.viewport === preset.id
            return (
              <button
                key={preset.id}
                type="button"
                aria-pressed={selected}
                onClick={() => actions.selectViewport(preset.id)}
                className={`inline-flex items-center gap-1.5 rounded-[5px] px-2 py-1 text-[12px] transition-colors duration-150 motion-reduce:transition-none ${
                  selected
                    ? "bg-white/10 font-medium text-zinc-50 shadow-[inset_0_1px_0_rgba(255,255,255,0.14)]"
                    : "text-zinc-400 hover:bg-white/[0.04] hover:text-zinc-200"
                }`}
              >
                <SelectionMark selected={selected} />
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
            aria-valuetext={`${scenario.width} pixels`}
            onChange={(event) => {
              actions.setCustomWidth(event.currentTarget.valueAsNumber)
            }}
            className="min-w-24 flex-1 accent-indigo-500"
          />
          <span className="w-14 shrink-0 text-right font-mono text-[11px] text-zinc-300 tabular-nums">
            {scenario.width}px
          </span>
        </label>
        <button
          type="button"
          onClick={checkLayout}
          className="rounded-md border border-zinc-700 bg-black/30 px-2.5 py-1 text-[12px] text-zinc-300 transition-colors duration-150 hover:border-zinc-500 hover:text-zinc-100 motion-reduce:transition-none"
        >
          Check layout
        </button>
        <button
          type="button"
          onClick={() => void copyTestReport()}
          className="rounded-md border border-zinc-700 bg-black/30 px-2.5 py-1 text-[12px] text-zinc-300 transition-colors duration-150 hover:border-zinc-500 hover:text-zinc-100 motion-reduce:transition-none"
        >
          Copy test report
        </button>
      </div>
      {layoutReport ? <LayoutReport frames={layoutReport} /> : null}
      {copyFeedback ? (
        <p role="status" aria-live="polite" className="border-t border-white/10 px-3 py-1.5 text-[11px] text-zinc-400">
          {copyFeedback}
        </p>
      ) : null}
      </div>

      <div
        ref={canvasRef}
        tabIndex={0}
        aria-label="Preview canvas"
        className="min-h-0 min-w-0 flex-1 overflow-auto"
        data-preview-scroll
      >
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
          <div className="flex min-h-full w-fit min-w-full justify-center p-3 md:p-5">
            <div
              className={`flex items-start gap-5 ${
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
      className="grid gap-5 p-3 md:p-5"
      style={{
        gridTemplateColumns: `repeat(auto-fill, minmax(${width}px, ${width}px))`,
      }}
    >
      {stateChoices.map((choice) => (
        <div
          key={choice.id}
          data-matrix-card={choice.id}
          onClick={() => onSelect(choice.id)}
          style={{ width }}
          className="group min-w-0 cursor-pointer"
        >
          <button
            type="button"
            aria-label={`Select ${choice.label}`}
            className="mb-1.5 block w-full truncate text-left text-[12px] font-medium tracking-wide text-zinc-400 uppercase transition-colors duration-150 group-hover:text-zinc-100 motion-reduce:transition-none"
          >
            {choice.label}
          </button>
          <PreviewSurface label={choice.label} width={width}>
            <div inert>
              <Sample component={component} state={choice.id} />
            </div>
          </PreviewSurface>
        </div>
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
      className={`inline-flex items-center gap-1.5 rounded-[5px] px-2 py-1 text-[12px] transition-colors duration-150 motion-reduce:transition-none ${
        pressed
          ? "bg-white/10 font-medium text-zinc-50 shadow-[inset_0_1px_0_rgba(255,255,255,0.14)]"
          : "text-zinc-400 hover:bg-white/[0.04] hover:text-zinc-200"
      }`}
    >
      <SelectionMark selected={pressed} />
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
      <div className="mb-1.5 flex min-w-0 items-center justify-between gap-2" style={{ width }}>
        <h2 className="min-w-0 truncate text-[11px] font-medium tracking-[0.08em] text-zinc-400 uppercase">
          {title}
        </h2>
        <select
          aria-label={`${title} state`}
          value={state}
          onChange={(event) => {
            const nextState = event.currentTarget.value
            if (isUIState(nextState)) onStateChange(nextState)
          }}
          className="max-w-[65%] shrink-0 rounded-lg border border-white/10 bg-white/[0.05] px-2 py-1 text-[12px] text-zinc-100 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] transition-colors duration-150 hover:border-white/20 motion-reduce:transition-none"
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
      className="glass-panel overflow-hidden rounded-[20px] p-1.5 transition-[border-color,box-shadow] duration-150 group-hover:border-white/20 motion-reduce:transition-none"
    >
      <div
        data-preview-content
        tabIndex={0}
        aria-label={`${label} preview`}
        className="@container w-full min-w-0 overflow-x-auto overscroll-x-contain"
      >
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
      aria-atomic="true"
      data-layout-report
      className="glass-bar border-t border-white/10 px-3 py-2"
    >
      <p className="text-[11px] text-zinc-400">
        Measured from the current preview. This is not a full visual check.
      </p>
      {frames.length === 0 ? (
        <p className="mt-2 text-xs text-amber-200">Warning: No preview frame to measure.</p>
      ) : (
        <ul className="mt-2 flex flex-col gap-2">
          {frames.map((frame) => (
            <li key={frame.label}>
              <p className="text-xs font-medium text-zinc-200">{frame.label}</p>
              <p className="font-mono text-[11px] text-zinc-400">
                Viewport {frame.viewportWidth} pixels. Content scroll width {frame.contentScrollWidth} pixels.
                Overflow {frame.overflow} pixels.
              </p>
              {frame.overflow > 0 ? (
                <p className="text-xs text-amber-200">
                  Warning: {frame.label} has horizontal overflow of {frame.overflow} pixels.
                </p>
              ) : (
                <p className="text-xs text-emerald-200">OK: {frame.label} has no horizontal overflow.</p>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function Sample({ component, state }: { component: ComponentId; state: UIState }) {
  if (!isComponentId(component) || !isUIState(state)) {
    return (
      <p role="alert" className="rounded-xl border border-zinc-800 bg-zinc-900 p-5 text-sm text-rose-300">
        This preview isn't available.
      </p>
    )
  }
  switch (component) {
    case "profile":
      return <ProfileCard state={state} />
    case "products":
      return <ProductList state={state} />
    default: {
      const unexpected: never = component
      return unexpected
    }
  }
}
