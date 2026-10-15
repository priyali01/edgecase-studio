# EdgeCase Studio

See how your UI breaks.

EdgeCase Studio is a local playground for putting interface components through the states and widths where layout usually fails.

## The problem

A component can look fine with a short name, a comfortable desktop width, and a successful response. The same component often overflows, wraps badly, or collapses when the name is long, the request fails, the list is empty, or the frame is only a few hundred pixels wide.

Those cases are easy to skip during normal development because they take time to recreate. EdgeCase Studio keeps the component, the UI state, and the preview width in one place so you can move through them without editing sample data by hand.

## Features

The current version includes:

- **Two samples.** A profile card and a product list. Each sample renders success, loading, empty, error, and long-content states. The long-content samples keep unbroken strings on purpose so overflow stays visible.
- **A real-width preview.** Mobile is 375px, tablet is 768px, and desktop is 1280px. A slider sets any integer width from 320px to 1440px. The frame uses that CSS width. It is not scaled down to fit. If the frame is wider than the canvas, the canvas scrolls.
- **Compare.** Two labeled frames share the component and the width. Each frame has its own state. On a narrow window the frames stack.
- **Matrix.** All five states appear together at the selected width. Choosing a card applies that state and leaves the matrix. Compare and Matrix cannot be on at the same time.
- **Saved scenarios.** Name the current setup and save it in this browser. You can load or delete saved scenarios, and replace one when the name already exists. Saves include the component, primary state, viewport, width, and compare settings. Matrix is not saved.
- **Layout check.** **Check layout** measures the live preview: frame width, content scroll width, and horizontal overflow. Run it again after you change the preview. It is a measurement of the current screen, not a full visual test.
- **Copy test report.** **Copy test report** copies the selected scenario name, viewport width, selected state, and current horizontal-overflow result as readable plain text.
- **Keyboard access.** Controls have visible focus, names, and pressed or checked state. The closed sidebar on a narrow window is removed from the tab order. Layout results and save messages are exposed to assistive technology.
- **Guarded input.** Empty names, duplicate names, widths outside 320–1440, unknown component or state values, and unreadable browser storage are rejected with a short message. The preview stays usable.

There is no account, server, or shared library of components. Everything runs in the browser on your machine.

## Tech stack

- [Vite](https://vite.dev/)
- [React](https://react.dev/)
- [TypeScript](https://www.typescriptlang.org/), with strict checking
- [Tailwind CSS](https://tailwindcss.com/) v4, through the Vite plugin
- [oxlint](https://oxc.rs/docs/guide/usage/linter) for linting

## Installation and running

You need [Node.js](https://nodejs.org/) and npm.

```bash
npm install
npm run dev
```

`npm run dev` starts the Vite development server and prints a local URL.

Other scripts:

| Command | What it does |
| --- | --- |
| `npm run typecheck` | Runs the TypeScript check |
| `npm run lint` | Runs oxlint |
| `npm run build` | Type-checks and writes the production bundle to `dist` |
| `npm run preview` | Serves the production bundle locally |

## Keyboard shortcuts

These keys work when focus is not in a text field, select, or content-editable element. They are ignored with Ctrl, Alt, or Meta, and while a key is repeating.

| Key | Action |
| --- | --- |
| `1` | Success |
| `2` | Loading |
| `3` | Empty |
| `4` | Error |
| `5` | Long content |
| `C` | Toggle Compare |
| `M` | Toggle Matrix |

`Escape` closes the sidebar on a narrow window. The same shortcuts are listed in the sidebar.

## Example usage

1. Start the app with `npm run dev` and open the URL Vite prints.
2. Choose **Products**.
3. Press `5` to show the long-content list.
4. Choose **Mobile**, or drag the width slider to `375px`.
5. Click **Check layout**. The report names the frame and says whether that frame has horizontal overflow.
6. Click **Copy test report**, then paste the readable scenario, viewport, state, and overflow summary into a bug report or note.
7. Press `C` and set the second frame to **Empty** to compare a full list with an empty one.
8. Type a scenario name and click **Save**. **Load** restores that setup later in this browser.

Press `M` when you want every state on screen at once. Select a card to keep that state and return to a single preview.

## Known limitations

- Only the built-in profile card and product list can be previewed. There is no way to register another component.
- Saved scenarios stay in `localStorage` for this browser. They are not synced, and they disappear if site data is cleared.
- Matrix view is not stored with a saved scenario. Loading a scenario turns Matrix off.
- **Check layout** reports horizontal overflow for the frames currently on screen. It does not compare screenshots or decide whether a design change is correct.
- **Copy test report** uses the browser Clipboard API. If clipboard access is unavailable or denied, the report is not copied.
- Long names, biographies, and product titles are sample defects. They are left unbroken so the preview can show the overflow.
- Preview width is limited to 320–1440 pixels.
- There is no screenshot export, visual regression suite, or hosted continuous-integration setup in this repository.

## Roadmap

These are not implemented:

- Custom component registration
- Screenshot export
- Visual regression testing
- CI integration
