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
- **Vite 8** as bundler/dev server (`vite.config.js`)
- **SCSS** via `sass` — variables/mixins auto-injected into every component via `css.preprocessorOptions.scss.additionalData`
- `@` alias resolves to `src/`
- Vue Devtools plugin enabled in dev mode

## Build-time constants

`vite.config.js` injects three globals at build time — use them directly in components, no import needed:

| Global | Source | Value |
|---|---|---|
| `__GIT_HASH__` | `git rev-parse --short HEAD` | short commit hash, e.g. `"915005e"` |
| `__PROJECT_URL__` | `package.json` → `homepage` | project URL string |
| `__LICENSE__` | `package.json` → `license` | license string, e.g. `"MIT"` |

## Component map

```
App.vue                          — thin root, mounts PlayerPage

components/
  PlayerPage.vue                 — all player state + logic; owns panels[], zoom state,
                                   drag-reorder state, layout export/import, helpOpen flag
  FileMenu.vue                   — topbar File button + dropdown (add panel, export/import layout)
  HelpModal.vue                  — full-screen modal (Teleport to body); help sections + about
                                   section (git hash, project URL, license from build constants)

  panel/
    VideoPanel.vue               — panel tile shell (drag, expose videoEl)
    PanelHeader.vue              — drag handle, editable label, settings, remove button
    PanelSettingsMenu.vue        — gear dropdown (primary / audio / offset)
    VideoArea.vue                — <video>, load overlay (click + drag&drop), file input,
                                   magnifier canvas

  transport/
    TransportBar.vue             — lays out the transport bar
    SeekBar.vue                  — seekbar track + time labels; exposes isSeeking
    GotoInput.vue                — "go to…" timestamp input
    PlaybackControls.vue         — skip buttons + play/pause
    ZoomControls.vue             — zoom toggle + level/radius sliders

  icons/
    CaretDownIcon.vue
    CloseIcon.vue
    DragHandleIcon.vue
    MagnifierIcon.vue
    MinusIcon.vue
    PauseIcon.vue
    PlayIcon.vue
    PlusIcon.vue
    SettingsIcon.vue

composables/
  useClickOutside.js             — closes a floating element when clicking outside
```

## SCSS architecture

```
src/assets/styles/
  _variables.scss    — all design tokens (colours, spacing, radii, typography, shadows, z-index)
  _mixins.scss       — reusable mixins (flex-row, btn-base, input-base, panel-header-base, …)
  theme.scss         — global primitives imported once in main.js
```

`_variables.scss` and `_mixins.scss` are injected at the top of every `<style lang="scss">` block automatically — no explicit `@import` needed in components. `theme.scss` defines the global CSS classes: `.btn`, `.btn--sm`, `.btn--icon`, `.card`, `.dropdown`, `.dropdown-item`, `.dropdown--settings`, `.dropdown-row`, `.badge-btn`, `.badge-btn--primary`, `.badge-btn--sound`.

## Architecture

### Startup
App starts with a single panel `{ id:0, name:'Video 1', isPrimary:true, hasSound:true, src:null, offset:0 }`. Panels can be added (max 9) or removed (min 1) at runtime via the File menu.

### Panel object shape
```js
{
  id:        Number,   // stable key for v-for
  name:      String,   // editable display label; set to filename (sans ext) on file load
  isPrimary: Boolean,  // exactly one panel is primary at all times
  hasSound:  Boolean,  // exactly one panel is unmuted at all times
  src:       String,   // blob URL, or null
  offset:    Number,   // seconds; side videos play at primaryTime + offset
}
```

### Video element access
`VideoArea` exposes `videoEl` (the raw `<video>` DOM ref) via `defineExpose`. `VideoPanel` forwards it as a computed ref and re-exposes it. `PlayerPage` stores panel components in `panelRefs[]` via `:ref="el => setRef(i, el)"` and accesses the raw element with `videoEl(i) → panelRefs[i]?.videoEl`.

### File loading
- `VideoArea` handles both click-to-open (via hidden `<input type="file">`) and drag & drop (`dragover` / `drop` on `.video-wrapper`).
- On drop, if `dataTransfer.files[0]` is a video MIME type the event is stopped (preventing bubble to the panel reorder handler) and `file-load` is emitted.
- `VideoPanel` is `draggable="true"` and guards reorder drags via a `dragFromHandle` flag; only drags initiated from `.drag-handle` are forwarded as reorder events. File drops from outside the app always have `dataTransfer.files` and never trigger reorder logic.
- On `file-load`, `PlayerPage` creates a blob URL, assigns it to the panel's `src`, and if mid-playback waits for `loadedmetadata` then seeks to `primaryT + offset` and calls `play()`.

### Sync model
- The **primary** panel's `<video>` is the clock source.
- A `requestAnimationFrame` loop runs during playback; each frame it reads `primaryEl.currentTime`, writes it to `currentTime` (drives the seekbar), then calls `syncAll`.
- `syncAll` — soft sync: corrects side videos only if drift > **250 ms**. Used during the playback loop.
- `hardSyncAll` — exact seek: always seeks side videos to `primaryT + offset`. Used on play, pause, seek, skip, primary switch, sound switch, and file load.
- Offset re-rooting: when the primary is switched or removed, all other panels' offsets are adjusted by `−oldPrimaryOffset` so relative timing is preserved.

### Sync lifecycle
| Event | Action |
|---|---|
| Play | `hardSyncAll` → `play()` all → start RAF loop |
| Pause | `pause()` all → stop RAF loop → `hardSyncAll` |
| Seek / skip | update primary `currentTime` → `hardSyncAll` |
| File load (mid-playback) | wait for `loadedmetadata` → seek to `primaryT + offset` → `play()` if playing |
| Primary switch | re-root offsets → `hardSyncAll` |
| Sound switch | toggle `hasSound` → `hardSyncAll` |
| Panel remove (primary) | pick new primary → re-root offsets |
| Panel remove (sound) | hand off `hasSound` to primary or first panel |

### Magnifier
`VideoArea` renders a `<canvas>` overlay (`inset: 0`, `pointer-events: none` when inactive). When `zoomActive` is true:
- `pointer-events: auto` + `cursor: crosshair`
- A `requestAnimationFrame` loop runs while the mouse is inside the panel
- Each frame: `drawImage(videoEl, srcX, srcY, srcSz, srcSz, mx-R, my-R, 2R, 2R)` where source coords are computed in the video's **native pixel space** (full resolution, e.g. 4K) accounting for `object-fit: contain` letterboxing
- A circular clip + crosshair is drawn on top
- The magnifier's RAF loop is separate from the sync RAF loop; both can run simultaneously

Zoom props flow: `PlayerPage` owns `zoomActive / zoomLevel / zoomRadius` → passed to `TransportBar` via `v-model:*` → passed to each `VideoPanel` / `VideoArea` as props.

### Grid layout
`gridCols` in `PlayerPage`: 1→1, 2→2, 3→3, 4→2, 5–9→3 columns. Passed as CSS custom property `--cols` on `.panels`.

### TransportBar
Pure props/emits. Delegates to `SeekBar` (exposes `isSeeking` so `PlayerPage`'s RAF loop skips `currentTime` writes while seeking), `GotoInput`, `PlaybackControls`, and `ZoomControls`. Skip buttons: −30s, −10s, −5s, ▶/⏸, +5s, +10s, +30s.

### Topbar layout
`PlayerPage` renders a `.topbar` flex row: **FastView** title → `FileMenu` → **Help** button (pushed right via `margin-left: auto`). Clicking Help sets `helpOpen = true`, which mounts `HelpModal` (teleported to `<body>`). Clicking the backdrop or the ✕ button closes it.

### Layout export / import
Export serialises `{ currentTime, panels: [{ name, isPrimary, hasSound, offset }] }` as a downloaded JSON file. Import reads that JSON, validates it, rebuilds the `panels` array (clamped to 9, enforcing exactly one primary and one sound panel), revokes old blob URLs, and resets playback state. Video `src` fields are not serialised — files must be re-loaded after import.

### HelpModal
Teleported to `<body>` so it overlays the full viewport. Clicking the backdrop (`.modal-backdrop`) emits `close`. Contains a scrollable body with help sections and an about section at the bottom. About section reads `__GIT_HASH__`, `__PROJECT_URL__`, and `__LICENSE__` from build-time globals.
