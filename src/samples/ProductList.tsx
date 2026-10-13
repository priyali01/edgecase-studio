import type { UIState } from "../types.ts"
import { isUIState } from "../utils/guards.ts"

type ProductListProps = {
  state: UIState
}

type Product = {
  id: string
  title: string
  price: string
  initials: string
}

const successProducts: readonly Product[] = [
  { id: "aurora-lamp", title: "Aurora Desk Lamp", price: "$49.00", initials: "AL" },
  { id: "field-notes", title: "Field Notes Trio", price: "$14.50", initials: "FN" },
  { id: "trail-mug", title: "Trail Enamel Mug", price: "$22.00", initials: "TM" },
  { id: "mono-backpack", title: "Mono Day Backpack", price: "$89.00", initials: "MB" },
  { id: "pulse-headphones", title: "Pulse Headphones", price: "$129.00", initials: "PH" },
  { id: "slate-watch", title: "Slate Steel Watch", price: "$199.00", initials: "SW" },
]

const longTitlePrefix =
  "Limited-Edition Extra-Wide Panoramic Studio Monitor Stand With Cable Management"

const longProducts: readonly Product[] = Array.from({ length: 42 }, (_, index) => {
  const number = index + 1
  return {
    id: `long-product-${number}`,
    title:
      number % 7 === 0
        ? `SuperUltraWideUnbrokenProductTitleDesignedToExposeOverflowAndWrappingDefectsInGridLayoutsNumber${number}XXXX`
        : `${longTitlePrefix} — Model ${number} With An Exceptionally Long Descriptive Name For Testing`,
    price:
      number % 5 === 0
        ? `$1,299.99/month billed annually plus setup, shipping, taxes, and extended warranty fees — plan ${number}`
        : `$${(number * 37.5).toFixed(2)} with a very long price note for order ${number}`,
    initials: `P${number}`,
  }
})

export function ProductList({ state }: ProductListProps) {
  if (!isUIState(state)) return <UnavailablePreview />
  switch (state) {
    case "success":
      return <ProductGrid products={successProducts} />
    case "loading":
      return <LoadingProducts />
    case "empty":
      return <EmptyProducts />
    case "error":
      return <ErrorProducts />
    case "long":
      return <ProductGrid products={longProducts} />
    default: {
      const unexpected: never = state
      return <UnavailablePreview state={unexpected} />
    }
  }
}

function UnavailablePreview({ state }: { state?: never }) {
  void state
  return (
    <p role="alert" className="rounded-xl border border-zinc-800 bg-zinc-900 p-5 text-sm text-rose-300">
      This preview isn't available.
    </p>
  )
}

function ProductGrid({ products }: { products: readonly Product[] }) {
  return (
    <div className="@container w-full">
      <ul className="grid w-full grid-cols-1 gap-3 @min-[640px]:grid-cols-2 @min-[1024px]:grid-cols-3">
      {products.map((product) => (
        <li
          key={product.id}
          className="flex flex-col rounded-xl border border-zinc-800 bg-zinc-900 p-4"
        >
          <div
            aria-hidden="true"
            className="grid h-24 place-items-center rounded-lg bg-[radial-gradient(circle_at_30%_25%,#312e81,#09090b)] text-lg font-semibold text-indigo-200"
          >
            {product.initials}
          </div>
          <h3 className="mt-3 text-sm font-semibold text-zinc-50">{product.title}</h3>
          <p className="mt-1 text-sm text-zinc-400">{product.price}</p>
          <div className="mt-3">
            <button
              type="button"
              aria-label={`Add ${product.title}`}
              className="rounded-md bg-indigo-500 px-3 py-1.5 text-sm font-medium text-white shadow-[0_0_0_1px_rgba(99,102,241,0.45)] hover:bg-indigo-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-300"
            >
              Add
            </button>
          </div>
        </li>
      ))}
      </ul>
    </div>
  )
}

function LoadingProducts() {
  return (
    <div className="@container w-full" aria-busy="true" aria-live="polite">
      <span className="sr-only">Loading products</span>
      <ul className="grid w-full grid-cols-1 gap-3 @min-[640px]:grid-cols-2 @min-[1024px]:grid-cols-3">
      {successProducts.map((product) => (
        <li
          key={product.id}
          className="rounded-xl border border-zinc-800 bg-zinc-900 p-4"
        >
          <div className="h-24 animate-pulse rounded-lg bg-zinc-800" />
          <div className="mt-3 h-4 w-3/4 animate-pulse rounded bg-zinc-800" />
          <div className="mt-2 h-4 w-1/3 animate-pulse rounded bg-zinc-800" />
          <div className="mt-3 h-8 w-16 animate-pulse rounded-md bg-zinc-800" />
        </li>
      ))}
      </ul>
    </div>
  )
}

function EmptyProducts() {
  return (
    <div className="flex w-full flex-col items-center rounded-xl border border-zinc-800 bg-zinc-900 px-5 py-10 text-center">
      <svg viewBox="0 0 48 48" className="size-12 text-indigo-300" aria-hidden="true">
        <path
          d="M8 16l4-7h24l4 7v20a3 3 0 0 1-3 3H11a3 3 0 0 1-3-3V16z"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
        />
        <path
          d="M8 16h32M18 22v7M24 22v7M30 22v7"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </svg>
      <p className="mt-3 text-sm text-zinc-300">No products</p>
    </div>
  )
}

function ErrorProducts() {
  return (
    <div className="w-full rounded-xl border border-zinc-800 bg-zinc-900 p-5">
      <p role="alert" className="text-sm text-rose-300">
        These products could not be loaded.
      </p>
      <div className="mt-4">
        <button
          type="button"
          className="rounded-md bg-indigo-500 px-3 py-1.5 text-sm font-medium text-white shadow-[0_0_0_1px_rgba(99,102,241,0.45)] hover:bg-indigo-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-300"
        >
          Retry
        </button>
      </div>
    </div>
  )
}
