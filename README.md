# Multi-Video Player

A browser-based player for synchronised multi-camera review. Load up to 9 video files side-by-side, keep them in sync with per-panel time offsets, and inspect frames with a magnifying-glass tool.

## Getting started

```sh
npm install
npm run dev        # opens at http://localhost:5173
npm run build      # production build → dist/
```

## Features

### Panels
- Starts with one panel; add more via the **File** menu (max 9)
- Remove any panel with the **✕** button in its header (min 1)
- Drag panels by their handle to reorder the grid
- Click the panel name to rename it; loading a file sets the name automatically from the filename
- Grid layout adjusts automatically: 1–3 → 1 row, 4 → 2×2, 5–9 → 3 columns

### Sync
Every panel is synced to the **primary** video. The primary's playhead is the clock — all other panels follow it with a configurable time offset.

- **Offset** (in each panel's settings): positive = that video plays ahead; negative = behind
- Sync is checked every animation frame during playback; panels more than 250 ms off are corrected
- A hard exact-seek is forced on play, pause, skip, seek, and whenever the primary or audio source changes

### Primary & audio
Open the **⚙** settings on any panel to control:

| Setting | Description |
|---|---|
| **Primary** | Sets this panel as the sync master (clock source) |
| **Audio** | Routes audio output to this panel |
| **Offset (s)** | Time offset in seconds relative to the primary |

Offsets are automatically re-rooted when the primary changes so relative timing is preserved.

### Transport bar
| Control | Action |
|---|---|
| Seekbar | Scrub all videos simultaneously |
| −30s / −10s / −5s | Jump back |
| ▶ / ⏸ | Play / pause all |
| +5s / +10s / +30s | Jump forward |
| Go to… | Type a timestamp (`m:ss`, `h:mm:ss`, or plain seconds) and press Enter |

### Magnifier
Click **Zoom** in the transport bar to activate the magnifying-glass tool. While active, hovering any panel shows a circular magnified lens following the cursor.

- **Level** slider: zoom factor (1.5× – 8×)
- **Radius** slider: lens size (30 – 200 px)

The lens samples the video's full native resolution (4K if available), not the scaled-down display.

### Loading files mid-playback
Load a new file into any panel while other panels are already playing. The new video automatically seeks to the correct offset-adjusted position and joins playback immediately. Double-click a loaded panel to swap its file.

## Browser notes

- Requires a Chromium-based browser (Chrome, Edge, Brave) or Firefox for best results
- Video files are opened as local `blob:` URLs — nothing is uploaded
- Hardware-accelerated video decode is used when available; the magnifier reads the full decoded frame via `drawImage`

## Stack

- [Vue 3](https://vuejs.org/) — Composition API, `<script setup>` SFCs
- [Vite 8](https://vite.dev/) — dev server and bundler
- [SCSS](https://sass-lang.com/) — design tokens, mixins, global primitives
