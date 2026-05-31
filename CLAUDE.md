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
- `@` alias resolves to `src/`
- Vue Devtools plugin enabled in dev mode

## Component map

```
App.vue                  — thin root, just mounts PlayerPage
components/
  PlayerPage.vue         — all player state + logic
  VideoPanel.vue         — single video tile (video element + magnifier canvas)
  TransportBar.vue       — seekbar, skip buttons, zoom controls
```

## Architecture

### Startup
App starts with a single panel `{ id:0, name:'Video 1', isPrimary:true, hasSound:true }`. Panels can be added (＋, max 9) or removed (✕ per panel, min 1) at runtime.

### Panel object shape
```js
{
  id:        Number,   // stable key for v-for
  name:      String,   // editable display label; set to filename (sans ext) on file load
  isPrimary: Boolean,  // exactly one panel is primary at all times
  hasSound:  Boolean,  // exactly one panel is unmuted at all times
  src:       String,   // blob URL, or null
  filename:  String,   // original File.name, or null
  offset:    Number,   // seconds; side videos play at primaryTime + offset
}
```

### Video element access
`VideoPanel` exposes `videoEl` via `defineExpose`. `PlayerPage` stores components in `panelRefs[]` via `:ref="el => setRef(i, el)"` and accesses the raw element with `videoEl(i) → panelRefs[i]?.videoEl`.

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
`VideoPanel` renders a `<canvas>` overlay (`inset: 0`, `pointer-events: none` when inactive). When `zoomActive` is true:
- `pointer-events: auto` + `cursor: crosshair`
- A `requestAnimationFrame` loop runs while the mouse is inside the panel
- Each frame: `drawImage(videoEl, srcX, srcY, srcSz, srcSz, mx-R, my-R, 2R, 2R)` where source coords are computed in the video's **native pixel space** (full resolution, e.g. 4K) accounting for `object-fit: contain` letterboxing
- A circular clip + crosshair is drawn on top

Zoom props flow: `PlayerPage` owns `zoomActive / zoomLevel / zoomRadius` → passed to `TransportBar` via `v-model:*` → passed to each `VideoPanel` as props.

### Grid layout
`gridCols` in `PlayerPage`: 1→1, 2→2, 3→3, 4→2, 5–6→3, 7–9→4 columns.

### TransportBar
Pure props/emits. Exposes `isSeeking` (ref) so `PlayerPage`'s RAF loop can skip `currentTime` writes while the user is dragging the seekbar. Skip buttons: −30s, −10s, −5s, ▶/⏸, +5s, +10s, +30s.
