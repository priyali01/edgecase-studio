export type ComponentId = "profile" | "products"

export type UIState = "success" | "loading" | "empty" | "error" | "long"

export type Viewport = "mobile" | "tablet" | "desktop" | "custom"

export type CompareConfig = {
  enabled: boolean
  stateB: UIState
}

export type Scenario = {
  id: string
  name: string
  component: ComponentId
  state: UIState
  viewport: Viewport
  width: number
  compare: CompareConfig
}
