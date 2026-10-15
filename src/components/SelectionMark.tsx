export function SelectionMark({ selected }: { selected: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={`grid size-3 shrink-0 place-items-center rounded-[3px] border text-[9px] leading-none transition-colors duration-150 motion-reduce:transition-none ${
        selected ? "border-indigo-300 text-indigo-200" : "border-zinc-500"
      }`}
    >
      {selected ? "✓" : ""}
    </span>
  )
}
