<script setup>
import { ref, reactive, nextTick } from 'vue'

const POSITIONS = ['left', 'centre', 'right']

const panels = reactive({
  left:   { el: null, src: null, filename: null, offset: 0 },
  centre: { el: null, src: null, filename: null, offset: 0 },
  right:  { el: null, src: null, filename: null, offset: 0 },
})

const isPlaying = ref(false)
const currentTime = ref(0)
const duration = ref(0)
const isSeeking = ref(false)

// ── file loading ─────────────────────────────────────────────────────────────

function loadFile(pos, event) {
  const file = event.target.files[0]
  if (!file) return
  if (panels[pos].src) URL.revokeObjectURL(panels[pos].src)
  panels[pos].src = URL.createObjectURL(file)
  panels[pos].filename = file.name
  // reset input so the same file can be reloaded
  event.target.value = ''
}

// ── centre video events ───────────────────────────────────────────────────────

function onCentreMetadata() {
  duration.value = panels.centre.el?.duration ?? 0
}

function onCentreTimeUpdate() {
  if (isSeeking.value) return
  const t = panels.centre.el?.currentTime ?? 0
  currentTime.value = t
  syncSideVideos(t)
}

function onCentreEnded() {
  isPlaying.value = false
}

// ── sync helpers ──────────────────────────────────────────────────────────────

const DRIFT_THRESHOLD = 0.25 // seconds — don't hard-seek if within this

function syncSideVideos(centreT) {
  for (const pos of ['left', 'right']) {
    const p = panels[pos]
    if (!p.el || !p.src) continue
    const target = centreT + p.offset
    const clamped = Math.max(0, target)
    if (Math.abs(p.el.currentTime - clamped) > DRIFT_THRESHOLD) {
      p.el.currentTime = clamped
    }
  }
}

function applyOffset(pos) {
  // immediately resync when offset is changed
  const centreT = panels.centre.el?.currentTime ?? 0
  const p = panels[pos]
  if (!p.el || !p.src) return
  p.el.currentTime = Math.max(0, centreT + p.offset)
}

// ── transport controls ────────────────────────────────────────────────────────

function togglePlay() {
  if (!panels.centre.src) return
  isPlaying.value ? pauseAll() : playAll()
}

function playAll() {
  for (const pos of POSITIONS) {
    const p = panels[pos]
    if (p.el && p.src) p.el.play().catch(() => {})
  }
  isPlaying.value = true
}

function pauseAll() {
  for (const pos of POSITIONS) {
    if (panels[pos].el) panels[pos].el.pause()
  }
  isPlaying.value = false
}

function skip(delta) {
  seekTo(currentTime.value + delta)
}

function seekTo(t) {
  const clamped = Math.max(0, Math.min(duration.value, t))
  if (panels.centre.el) panels.centre.el.currentTime = clamped
  currentTime.value = clamped
  syncSideVideos(clamped)
}

// ── seekbar ───────────────────────────────────────────────────────────────────

function onSeekStart() {
  isSeeking.value = true
}

function onSeekInput(e) {
  seekTo(parseFloat(e.target.value))
}

function onSeekEnd(e) {
  seekTo(parseFloat(e.target.value))
  isSeeking.value = false
}

// ── formatting ────────────────────────────────────────────────────────────────

function fmt(t) {
  if (!isFinite(t)) return '0:00'
  const h = Math.floor(t / 3600)
  const m = Math.floor((t % 3600) / 60)
  const s = Math.floor(t % 60)
  return h > 0
    ? `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
    : `${m}:${String(s).padStart(2, '0')}`
}

const seekPct = () =>
  duration.value > 0 ? (currentTime.value / duration.value) * 100 : 0
</script>

<template>
  <div class="app">
    <!-- ── video panels ── -->
    <div class="panels">
      <div v-for="pos in POSITIONS" :key="pos" class="panel">
        <div class="panel-header">
          <span class="panel-label">{{ pos.charAt(0).toUpperCase() + pos.slice(1) }}</span>
          <span v-if="panels[pos].filename" class="panel-filename" :title="panels[pos].filename">
            {{ panels[pos].filename }}
          </span>
        </div>

        <div class="video-wrapper">
          <video
            :ref="el => panels[pos].el = el"
            :src="panels[pos].src ?? undefined"
            class="video"
            preload="metadata"
            :muted="pos !== 'centre'"
            @timeupdate="pos === 'centre' ? onCentreTimeUpdate() : undefined"
            @loadedmetadata="pos === 'centre' ? onCentreMetadata() : undefined"
            @ended="pos === 'centre' ? onCentreEnded() : undefined"
          />
          <div v-if="!panels[pos].src" class="video-placeholder">
            <span>No file loaded</span>
          </div>
        </div>

        <div class="panel-footer">
          <label class="btn load-btn">
            Load file
            <input type="file" accept="video/*" @change="loadFile(pos, $event)" hidden />
          </label>

          <div v-if="pos !== 'centre'" class="offset-row">
            <label class="offset-label">Offset</label>
            <input
              type="number"
              class="offset-input"
              v-model.number="panels[pos].offset"
              step="0.1"
              @change="applyOffset(pos)"
            />
            <span class="offset-unit">s</span>
          </div>
        </div>
      </div>
    </div>

    <!-- ── transport bar ── -->
    <div class="transport">
      <div class="seekbar-row">
        <span class="time-label">{{ fmt(currentTime) }}</span>
        <div class="seekbar-track">
          <div class="seekbar-fill" :style="{ width: seekPct() + '%' }" />
          <input
            type="range"
            class="seekbar"
            min="0"
            :max="duration || 100"
            step="0.05"
            :value="currentTime"
            @mousedown="onSeekStart"
            @input="onSeekInput"
            @change="onSeekEnd"
          />
        </div>
        <span class="time-label">{{ fmt(duration) }}</span>
      </div>

      <div class="btn-row">
        <button class="btn skip-btn" @click="skip(-30)" title="Back 30 s">−30s</button>
        <button class="btn skip-btn" @click="skip(-10)" title="Back 10 s">−10s</button>
        <button class="btn play-btn" @click="togglePlay" :disabled="!panels.centre.src">
          <span v-if="isPlaying">⏸</span>
          <span v-else>▶</span>
        </button>
        <button class="btn skip-btn" @click="skip(10)" title="Forward 10 s">+10s</button>
        <button class="btn skip-btn" @click="skip(30)" title="Forward 30 s">+30s</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* ── layout ── */
.app {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: #0f0f0f;
  color: #e8e8e8;
  font-family: system-ui, sans-serif;
  overflow: hidden;
}

.panels {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 6px;
  flex: 1;
  min-height: 0;
  padding: 8px 8px 0;
}

/* ── individual panel ── */
.panel {
  display: flex;
  flex-direction: column;
  background: #1a1a1a;
  border-radius: 6px;
  overflow: hidden;
  gap: 0;
}

.panel-header {
  display: flex;
  align-items: baseline;
  gap: 8px;
  padding: 6px 10px 4px;
  background: #242424;
  border-bottom: 1px solid #333;
  min-height: 30px;
}

.panel-label {
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #aaa;
}

.panel-filename {
  font-size: 11px;
  color: #666;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 180px;
}

.video-wrapper {
  position: relative;
  flex: 1;
  min-height: 0;
  background: #000;
}

.video {
  width: 100%;
  height: 100%;
  display: block;
  object-fit: contain;
}

.video-placeholder {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #444;
  font-size: 13px;
  pointer-events: none;
}

.panel-footer {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 6px 10px;
  background: #1e1e1e;
  border-top: 1px solid #2a2a2a;
  min-height: 42px;
}

/* ── offset control ── */
.offset-row {
  display: flex;
  align-items: center;
  gap: 5px;
  margin-left: auto;
}

.offset-label {
  font-size: 11px;
  color: #777;
}

.offset-input {
  width: 64px;
  background: #2c2c2c;
  border: 1px solid #3a3a3a;
  border-radius: 4px;
  color: #e8e8e8;
  font-size: 13px;
  padding: 2px 5px;
  text-align: right;
  outline: none;
  -moz-appearance: textfield;
}
.offset-input:focus {
  border-color: #555;
}
.offset-input::-webkit-outer-spin-button,
.offset-input::-webkit-inner-spin-button {
  -webkit-appearance: none;
}

.offset-unit {
  font-size: 11px;
  color: #666;
}

/* ── transport ── */
.transport {
  padding: 10px 12px 14px;
  background: #181818;
  border-top: 1px solid #2a2a2a;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.seekbar-row {
  display: flex;
  align-items: center;
  gap: 10px;
}

.time-label {
  font-size: 12px;
  color: #888;
  min-width: 42px;
  font-variant-numeric: tabular-nums;
}
.time-label:last-child {
  text-align: right;
}

.seekbar-track {
  position: relative;
  flex: 1;
  height: 4px;
  background: #333;
  border-radius: 2px;
}

.seekbar-fill {
  position: absolute;
  left: 0;
  top: 0;
  height: 100%;
  background: #4a9eff;
  border-radius: 2px;
  pointer-events: none;
}

.seekbar {
  position: absolute;
  inset: -8px 0;
  width: 100%;
  height: calc(100% + 16px);
  opacity: 0;
  cursor: pointer;
  margin: 0;
}

/* ── buttons ── */
.btn-row {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.btn {
  background: #2c2c2c;
  color: #ccc;
  border: 1px solid #3a3a3a;
  border-radius: 5px;
  cursor: pointer;
  font-size: 13px;
  padding: 5px 12px;
  transition: background 0.15s, color 0.15s;
  white-space: nowrap;
}
.btn:hover {
  background: #3a3a3a;
  color: #fff;
}
.btn:active {
  background: #444;
}

.load-btn {
  font-size: 12px;
  padding: 4px 10px;
}

.skip-btn {
  min-width: 52px;
}

.play-btn {
  background: #1a5fb4;
  border-color: #2a7ad4;
  color: #fff;
  font-size: 18px;
  width: 48px;
  height: 38px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
}
.play-btn:hover {
  background: #2270cc;
}
.play-btn:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}
</style>
