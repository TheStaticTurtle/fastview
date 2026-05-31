# Multi-Video Player

A browser-based player for synchronised multi-camera review. Load up to 9 video files side-by-side, keep them in sync with per-panel time offsets, and inspect frames with a magnifying-glass tool.

## Getting started

```sh
npm install
npm run dev        # opens at http://localhost:5173
```

## Features

### Panels
- Starts with one panel; add more with **＋** (top-left) up to a maximum of 9
- Remove any panel with the **✕** button in its header (minimum 1)
- Click the panel name to rename it; loading a file sets the name automatically from the filename
- Grid layout adjusts automatically: 1–3 → one row, 4 → 2×2, 5–6 → 2×3, 7–9 → 3 rows of 4

### Sync
Every panel is synced to the **primary** video. The primary's playhead is the clock — all other panels follow it with a configurable time offset.

- **Offset** (shown in each non-primary panel's footer): positive = that video plays ahead; negative = behind
- Sync is checked every animation frame during playback; panels more than 250 ms off are corrected
- A hard exact-seek is forced on play, pause, skip, seek, and whenever the primary or sound source changes

### Primary & audio
Each panel header has two clickable badges:

| Badge | Dim | Lit |
|---|---|---|
| **primary** | not the sync master | this panel drives the clock |
| **audio** | muted | this panel's audio plays |

Click either badge on any panel to switch it. Offsets are automatically re-rooted when the primary changes so relative timing is preserved.

### Transport bar
| Control | Action |
|---|---|
| Seekbar | Scrub all videos simultaneously |
| −30s / −10s / −5s | Jump back |
| ▶ / ⏸ | Play / pause all |
| +5s / +10s / +30s | Jump forward |

### Magnifier
Click **🔍 Zoom** in the bottom bar to activate the magnifying-glass tool. While active, hovering any panel shows a circular magnified lens following the cursor.

- **Level** slider: zoom factor (1.5× – 8×)
- **Radius** slider: lens size (30 – 200 px)

The lens samples the video's full native resolution (4K if available), not the scaled-down display.

### Loading files mid-playback
You can load a new file into any panel while other panels are already playing. The new video automatically seeks to the correct offset-adjusted position and joins playback immediately.

## Browser notes

- Requires a Chromium-based browser (Chrome, Edge, Brave) or Firefox for best results
- Large video files are opened as local `blob:` URLs — nothing is uploaded
- Hardware-accelerated video decode is used when available; `drawImage` on the magnifier canvas reads the full decoded frame
