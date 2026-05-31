# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```sh
npm install       # install dependencies
npm run dev       # dev server with HMR at http://localhost:5173
npm run build     # production build to dist/
npm run preview   # preview production build locally
```

No test runner or linter is configured yet.

## Stack

- **Vue 3** with `<script setup>` SFCs
- **Vite 8** as bundler/dev server, configured in [vite.config.js](vite.config.js)
- `@` alias resolves to `src/`
- Vue Devtools plugin enabled in dev mode

## Structure

```
src/
  main.js                        # mounts App to #app
  App.vue                        # phase switch: 'setup' | 'player'
  components/
    SetupPage.vue                # landing form — video count, names, order, primary, sound
    PlayerPage.vue               # player layout + all sync/playback logic
    VideoPanel.vue               # single video tile with magnifier canvas overlay
    TransportBar.vue             # seekbar, skip buttons, zoom controls
  assets/
    base.css                     # CSS variables + reset
    main.css                     # html/body/app full-height reset
```

## Architecture

### Phase flow
`App.vue` holds a `phase` ref (`'setup'` | `'player'`). `SetupPage` emits `launch(configs)` with a sorted array of video config objects; `App` passes them to `PlayerPage` as `:configs`.

### Video config shape
```js
{ id, name, order, isPrimary, hasSound }   // from SetupPage
// PlayerPage adds:
{ src, filename, offset }
```

### Sync model
- **Primary video** (chosen in setup) is the sync master — its `timeupdate` drives `currentTime` and the seekbar.
- Non-primary videos are kept in sync by seeking them to `primaryTime + offset` whenever drift exceeds 0.25 s.
- Only the video with `hasSound = true` is unmuted; all others have `:muted="true"`. Sound source can be switched at runtime by clicking the 🔊/🔇 button in any panel header.

### Video element access
`VideoPanel` exposes `videoEl` via `defineExpose`. `PlayerPage` keeps a `panelRefs` array populated with `:ref="el => setRef(i, el)"` and accesses elements via `panelRefs[i].videoEl`.

### Magnifier
`VideoPanel` renders a `<canvas>` overlay (absolutely positioned, `inset: 0`) sized via `ResizeObserver`. When `zoomActive` prop is true and the mouse is inside the panel, a `requestAnimationFrame` loop calls `drawImage(videoEl, srcX, srcY, srcW, srcH, ...)` — source coordinates are computed in the video's **native pixel space** (full 4K if applicable) after accounting for `object-fit: contain` letterboxing. Zoom level and radius are props passed down from `PlayerPage` → `VideoPanel`; their controls live in `TransportBar` and flow up via `v-model:zoomLevel` / `v-model:zoomRadius`.

### Grid layout
`gridCols` in `PlayerPage` maps video count → column count: 1→1, 2→2, 3→3, 4→2, 5–6→3, 7–9→4.
