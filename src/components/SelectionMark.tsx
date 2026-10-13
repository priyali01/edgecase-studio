export function SelectionMark({ selected }: { selected: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={`grid size-3.5 shrink-0 place-items-center rounded-sm border text-[10px] leading-none ${
        selected ? "border-current" : "border-zinc-400"
      }`}
    >
      {selected ? "✓" : ""}
    </span>
  )
}
