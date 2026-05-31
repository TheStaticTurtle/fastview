<script setup>
import { ref, computed, nextTick, onMounted, onUnmounted } from 'vue'
import VideoPanel from './VideoPanel.vue'
import TransportBar from './TransportBar.vue'

// ── panel state ───────────────────────────────────────────────────────────────

const panels = ref([
  { id: 0, name: 'Video 1', isPrimary: true, hasSound: true, src: null, filename: null, offset: 0 },
])

const primaryIdx = computed(() => panels.value.findIndex(p => p.isPrimary))
const gridCols   = computed(() => {
  const n = panels.value.length
  if (n <= 3) return n
  if (n === 4) return 2
  return 3
})

// ── video element refs ────────────────────────────────────────────────────────

const panelRefs    = ref([])
const transportRef = ref(null)

function setRef(i, component) { panelRefs.value[i] = component }
function videoEl(i)           { return panelRefs.value[i]?.videoEl ?? null }

// ── transport state ───────────────────────────────────────────────────────────

const isPlaying   = ref(false)
const currentTime = ref(0)
const duration    = ref(0)
const canPlay     = computed(() => !!panels.value[primaryIdx.value]?.src)

// ── sync ──────────────────────────────────────────────────────────────────────

const DRIFT = 0.25

function syncAll(primaryT) {
  panels.value.forEach((p, i) => {
    if (i === primaryIdx.value || !p.src) return
    const el = videoEl(i)
    if (!el) return
    const target = Math.max(0, primaryT + p.offset)
    if (Math.abs(el.currentTime - target) > DRIFT) el.currentTime = target
  })
}

// RAF loop — runs every frame while playing for tight sync
let rafId = null

function startSyncLoop() {
  if (rafId) return
  function loop() {
    const el = videoEl(primaryIdx.value)
    if (el && !transportRef.value?.isSeeking) {
      currentTime.value = el.currentTime
      syncAll(el.currentTime)
    }
    rafId = requestAnimationFrame(loop)
  }
  rafId = requestAnimationFrame(loop)
}

function stopSyncLoop() {
  if (rafId) { cancelAnimationFrame(rafId); rafId = null }
}

onUnmounted(stopSyncLoop)

// ── primary video events ──────────────────────────────────────────────────────

function onLoadedMetadata() {
  duration.value = videoEl(primaryIdx.value)?.duration ?? 0
}

function onEnded() { isPlaying.value = false; stopSyncLoop() }

// ── file loading ──────────────────────────────────────────────────────────────

async function onFileLoad(i, file) {
  const p = panels.value[i]
  if (p.src) URL.revokeObjectURL(p.src)
  p.src      = URL.createObjectURL(file)
  p.filename = file.name
  p.name     = file.name.replace(/\.[^.]+$/, '')

  await nextTick()
  const el = videoEl(i)
  if (!el) return

  el.addEventListener('loadedmetadata', () => {
    const isPrimary = i === primaryIdx.value
    if (isPrimary) duration.value = el.duration
    const target = isPrimary ? currentTime.value : Math.max(0, currentTime.value + p.offset)
    el.currentTime = target
    if (isPlaying.value) el.play().catch(() => {})
  }, { once: true })
}

// ── add / remove panels ───────────────────────────────────────────────────────

let nextId = 1

function addPanel() {
  if (panels.value.length >= 9) return
  panels.value.push({
    id:        nextId++,
    name:      `Camera ${panels.value.length + 1}`,
    isPrimary: false,
    hasSound:  false,
    src:       null,
    filename:  null,
    offset:    0,
  })
}

function removePanel(i) {
  if (panels.value.length <= 1) return
  const removing = panels.value[i]

  // Re-root offsets when removing the primary
  if (removing.isPrimary) {
    const newPrimaryI = i === 0 ? 1 : 0
    const shift = panels.value[newPrimaryI].offset
    panels.value.forEach((p, j) => { if (j !== i) p.offset -= shift })
    panels.value[newPrimaryI].isPrimary = true
    panels.value[newPrimaryI].offset    = 0
    // update duration to new primary
    duration.value = videoEl(newPrimaryI)?.duration ?? 0
  }

  // Hand off sound to primary (or first remaining)
  if (removing.hasSound) {
    const fallback = panels.value.find((p, j) => j !== i && p.isPrimary)
                  ?? panels.value.find((_, j) => j !== i)
    if (fallback) fallback.hasSound = true
  }

  if (removing.src) URL.revokeObjectURL(removing.src)
  panels.value.splice(i, 1)
  panelRefs.value.splice(i, 1)
}

// ── sound / offset ────────────────────────────────────────────────────────────

function onSetPrimary(i) {
  if (panels.value[i].isPrimary) return
  const shift = panels.value[i].offset
  panels.value.forEach((p, j) => {
    p.isPrimary = j === i
    p.offset    = j === i ? 0 : p.offset - shift
  })
  const el = videoEl(i)
  duration.value    = el?.duration ?? 0
  currentTime.value = el?.currentTime ?? 0
  hardSyncAll(currentTime.value)
}

function onSetSound(i) {
  panels.value.forEach((p, j) => { p.hasSound = j === i })
  hardSyncAll(currentTime.value)
}

function onOffsetUpdate(i, value) {
  panels.value[i].offset = value
  const el = videoEl(i)
  if (el && panels.value[i].src) el.currentTime = Math.max(0, currentTime.value + value)
}

// ── playback controls ─────────────────────────────────────────────────────────

function togglePlay() { isPlaying.value ? pauseAll() : playAll() }

function playAll() {
  hardSyncAll(currentTime.value)
  panels.value.forEach((p, i) => { if (p.src) videoEl(i)?.play().catch(() => {}) })
  isPlaying.value = true
  startSyncLoop()
}

function pauseAll() {
  panels.value.forEach((_, i) => videoEl(i)?.pause())
  isPlaying.value = false
  stopSyncLoop()
  hardSyncAll(currentTime.value)
}

function hardSyncAll(primaryT) {
  panels.value.forEach((p, i) => {
    if (i === primaryIdx.value || !p.src) return
    const el = videoEl(i)
    if (el) el.currentTime = Math.max(0, primaryT + p.offset)
  })
}

function seekTo(t) {
  const clamped = Math.max(0, Math.min(duration.value, t))
  const el = videoEl(primaryIdx.value)
  if (el) el.currentTime = clamped
  currentTime.value = clamped
  hardSyncAll(clamped)
}

function onSkip(delta) { seekTo(currentTime.value + delta) }

// ── drag to reorder ───────────────────────────────────────────────────────────

const dragSrcIdx = ref(null)
const dragOverIdx = ref(null)

function onPanelDragStart(i, e) {
  dragSrcIdx.value = i
  e.dataTransfer.effectAllowed = 'move'
}

function onPanelDragOver(i) {
  dragOverIdx.value = i
}

function onPanelDrop(i) {
  const src = dragSrcIdx.value
  if (src === null || src === i) return
  const arr = [...panels.value]
  const [item] = arr.splice(src, 1)
  arr.splice(i, 0, item)
  panels.value = arr
  panelRefs.value = []
}

function onPanelDragEnd() {
  dragSrcIdx.value  = null
  dragOverIdx.value = null
}

// ── zoom ──────────────────────────────────────────────────────────────────────

const zoomActive = ref(false)
const zoomLevel  = ref(2)
const zoomRadius = ref(80)

// ── file menu ─────────────────────────────────────────────────────────────────

const menuOpen  = ref(false)
const menuRef   = ref(null)

function toggleMenu() { menuOpen.value = !menuOpen.value }

function onDocClick(e) {
  if (menuRef.value && !menuRef.value.contains(e.target)) menuOpen.value = false
}

onMounted(()   => document.addEventListener('mousedown', onDocClick))
onUnmounted(() => document.removeEventListener('mousedown', onDocClick))
</script>

<template>
  <div class="player">
    <div class="topbar">
      <div ref="menuRef" class="menu-root">
        <button class="btn menu-btn" :class="{ open: menuOpen }" @click="toggleMenu">
          File <span class="menu-caret">▾</span>
        </button>
        <div v-if="menuOpen" class="dropdown">
          <button
            class="dropdown-item"
            :disabled="panels.length >= 9"
            @click="addPanel(); menuOpen = false"
          >
            <span class="item-icon">＋</span> Add panel
            <span class="item-hint">{{ panels.length }} / 9</span>
          </button>
        </div>
      </div>
    </div>

    <div class="panels" :style="{ '--cols': gridCols }">
      <VideoPanel
        v-for="(p, i) in panels"
        :key="p.id"
        :ref="el => setRef(i, el)"
        :name="p.name"
        :is-primary="p.isPrimary"
        :has-sound="p.hasSound"
        :src="p.src"
        :filename="p.filename"
        :offset="p.offset"
        :zoom-active="zoomActive"
        :zoom-level="zoomLevel"
        :zoom-radius="zoomRadius"
        :removable="panels.length > 1"
        :class="{ 'panel--drag-over': dragOverIdx === i && dragSrcIdx !== i }"
        @dragstart="onPanelDragStart(i, $event)"
        @dragover="onPanelDragOver(i)"
        @drop="onPanelDrop(i)"
        @dragend="onPanelDragEnd"
        @remove="removePanel(i)"
        @set-primary="onSetPrimary(i)"
        @set-sound="onSetSound(i)"
        @update:name="panels[i].name = $event"
        @file-load="onFileLoad(i, $event)"
        @update:offset="onOffsetUpdate(i, $event)"
        @loadedmetadata="i === primaryIdx ? onLoadedMetadata() : undefined"
        @ended="i === primaryIdx ? onEnded() : undefined"
      />
    </div>

    <TransportBar
      ref="transportRef"
      :current-time="currentTime"
      :duration="duration"
      :is-playing="isPlaying"
      :can-play="canPlay"
      v-model:zoom-active="zoomActive"
      v-model:zoom-level="zoomLevel"
      v-model:zoom-radius="zoomRadius"
      @toggle-play="togglePlay"
      @seek="seekTo"
      @skip="onSkip"
    />
  </div>
</template>

<style scoped>
.player {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: #0f0f0f;
  color: #e8e8e8;
  font-family: system-ui, sans-serif;
  overflow: hidden;
}

.topbar {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 5px 8px;
  background: #181818;
  border-bottom: 1px solid #2a2a2a;
  min-height: 36px;
  flex-shrink: 0;
}

.btn {
  background: #2c2c2c;
  color: #ccc;
  border: 1px solid #3a3a3a;
  border-radius: 5px;
  cursor: pointer;
  font-size: 12px;
  padding: 4px 10px;
  transition: background 0.12s, color 0.12s;
  white-space: nowrap;
}
.btn:hover    { background: #3a3a3a; color: #fff; }
.btn:disabled { opacity: 0.35; cursor: not-allowed; }

/* ── file menu ── */
.menu-root {
  position: relative;
}

.menu-btn {
  display: flex;
  align-items: center;
  gap: 4px;
}
.menu-btn.open {
  background: #3a3a3a;
  color: #fff;
}

.menu-caret {
  font-size: 10px;
  opacity: 0.6;
}

.dropdown {
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  min-width: 180px;
  background: #222;
  border: 1px solid #3a3a3a;
  border-radius: 6px;
  padding: 4px;
  z-index: 100;
  box-shadow: 0 6px 20px rgba(0,0,0,0.5);
}

.dropdown-item {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  background: none;
  border: none;
  border-radius: 4px;
  color: #ccc;
  font-size: 13px;
  padding: 6px 10px;
  cursor: pointer;
  text-align: left;
  transition: background 0.1s, color 0.1s;
}
.dropdown-item:hover:not(:disabled) { background: #333; color: #fff; }
.dropdown-item:disabled { opacity: 0.4; cursor: not-allowed; }

.item-icon {
  font-size: 15px;
  line-height: 1;
  color: #888;
}

.item-hint {
  margin-left: auto;
  font-size: 11px;
  color: #555;
  font-variant-numeric: tabular-nums;
}

:deep(.panel--drag-over) {
  outline: 2px solid #4a9eff;
  outline-offset: -2px;
}

.panels {
  display: grid;
  grid-template-columns: repeat(var(--cols), 1fr);
  gap: 6px;
  flex: 1;
  min-height: 0;
  padding: 6px 6px 8px;
}
</style>
