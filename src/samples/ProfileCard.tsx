import type { ReactNode } from "react"
import type { UIState } from "../types.ts"

type ProfileCardProps = {
  state: UIState
}

type ProfileStat = {
  label: string
  value: string
}

const profileStats: readonly ProfileStat[] = [
  { label: "Followers", value: "1,284" },
  { label: "Following", value: "312" },
  { label: "Posts", value: "86" },
]

const longName =
  "Alexandria Montgomery-Hale Worthington, Distinguished Research Fellow (Emeritus)"

const longBio =
  "ThisUnbrokenBiographyStringExistsSoThePlaygroundCanExposeRealOverflowAndWrappingDefectsInTheProfileCardLayoutXXXXExample"

const longTags = [
  "layout",
  "overflow",
  "typography",
  "spacing",
  "contrast",
  "alignment",
  "wrapping",
  "truncation",
  "responsive",
  "accessibility",
  "motion",
  "focus",
  "buttons",
  "avatars",
  "cards",
  "grids",
  "flexbox",
  "breakpoints",
  "padding",
  "margins",
  "borders",
  "shadows",
  "icons",
  "states",
  "loading",
  "empty",
  "errors",
  "content",
  "tokens",
  "density",
] as const

export function ProfileCard({ state }: ProfileCardProps) {
  switch (state) {
    case "success":
      return (
        <ProfileLayout
          initials="AH"
          name="Alexandra Hale"
          bio="Product designer studying how interfaces fail at the edges of layout, content, and state."
          stats={profileStats}
          action={<ActionButton>Follow</ActionButton>}
        />
      )
    case "loading":
      return <LoadingProfile />
    case "empty":
      return <EmptyProfile />
    case "error":
      return <ErrorProfile />
    case "long":
      return (
        <ProfileLayout
          initials="AW"
          name={longName}
          bio={longBio}
          stats={profileStats}
          action={<ActionButton>Follow</ActionButton>}
          tags={longTags}
        />
      )
    default: {
      const unexpected: never = state
      throw new Error(`Unexpected profile state: ${unexpected}`)
    }
  }
}

function ProfileLayout({
  initials,
  name,
  bio,
  stats,
  action,
  tags,
}: {
  initials: string
  name: string
  bio: string
  stats: readonly ProfileStat[]
  action: ReactNode
  tags?: readonly string[]
}) {
  return (
    <article className="w-full rounded-xl border border-zinc-800 bg-zinc-900 p-5 text-zinc-100">
      <div className="flex items-start gap-4">
        <Avatar initials={initials} />
        <div>
          <h2 className="text-lg font-semibold tracking-tight text-zinc-50">{name}</h2>
          <p className="mt-1 text-sm leading-relaxed text-zinc-400">{bio}</p>
        </div>
      </div>
      <dl className="mt-5 grid grid-cols-3 gap-3">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-md border border-zinc-800 bg-zinc-950/70 px-3 py-2"
          >
            <dt className="text-xs text-zinc-500">{stat.label}</dt>
            <dd className="mt-1 text-sm font-semibold text-zinc-100">{stat.value}</dd>
          </div>
        ))}
      </dl>
      <div className="mt-5">{action}</div>
      {tags ? (
        <ul className="mt-5 flex flex-wrap gap-1.5">
          {tags.map((tag) => (
            <li key={tag}>
              <span className="inline-block rounded-full border border-indigo-400/30 bg-indigo-500/10 px-2.5 py-1 text-xs text-indigo-200">
                {tag}
              </span>
            </li>
          ))}
        </ul>
      ) : null}
    </article>
  )
}

function Avatar({ initials }: { initials: string }) {
  return (
    <div
      aria-hidden="true"
      className="grid size-16 shrink-0 place-items-center rounded-full bg-[radial-gradient(circle_at_30%_30%,#c7d2fe,#4f46e5)] text-lg font-semibold text-white"
    >
      {initials}
    </div>
  )
}

function ActionButton({ children }: { children: string }) {
  return (
    <button
      type="button"
      className="rounded-md bg-indigo-500 px-3 py-1.5 text-sm font-medium text-white shadow-[0_0_0_1px_rgba(99,102,241,0.45)] hover:bg-indigo-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-300"
    >
      {children}
    </button>
  )
}

function LoadingProfile() {
  return (
    <article
      aria-busy="true"
      aria-live="polite"
      className="w-full rounded-xl border border-zinc-800 bg-zinc-900 p-5"
    >
      <span className="sr-only">Loading profile</span>
      <div className="flex items-start gap-4">
        <div className="size-16 shrink-0 animate-pulse rounded-full bg-zinc-800" />
        <div className="flex-1">
          <div className="h-5 w-40 animate-pulse rounded bg-zinc-800" />
          <div className="mt-3 h-3 w-full animate-pulse rounded bg-zinc-800" />
          <div className="mt-2 h-3 w-4/5 animate-pulse rounded bg-zinc-800" />
        </div>
      </div>
      <div className="mt-5 grid grid-cols-3 gap-3">
        {profileStats.map((stat) => (
          <div
            key={stat.label}
            className="h-14 animate-pulse rounded-md border border-zinc-800 bg-zinc-800/80"
          />
        ))}
      </div>
      <div className="mt-5 h-8 w-20 animate-pulse rounded-md bg-zinc-800" />
    </article>
  )
}

function EmptyProfile() {
  return (
    <article className="flex w-full flex-col items-center rounded-xl border border-zinc-800 bg-zinc-900 px-5 py-10 text-center">
      <EmptyIcon />
      <p className="mt-3 text-sm text-zinc-300">No profile found</p>
    </article>
  )
}

function ErrorProfile() {
  return (
    <article className="w-full rounded-xl border border-zinc-800 bg-zinc-900 p-5">
      <p role="alert" className="text-sm text-rose-300">
        This profile could not be loaded.
      </p>
      <div className="mt-4">
        <ActionButton>Retry</ActionButton>
      </div>
    </article>
  )
}

function EmptyIcon() {
  return (
    <svg
      viewBox="0 0 48 48"
      className="size-12 text-indigo-300"
      aria-hidden="true"
    >
      <circle
        cx="24"
        cy="24"
        r="18"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <circle cx="24" cy="20" r="5" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M14 34c1.8-4 5-6 10-6s8.2 2 10 6"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  )
}
