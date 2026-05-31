<script setup>
import { ref, computed, nextTick, onUnmounted } from 'vue'
import VideoPanel from './panel/VideoPanel.vue'
import TransportBar from './transport/TransportBar.vue'
import FileMenu from './FileMenu.vue'
import HelpModal from './HelpModal.vue'
import AppIcon from "@/components/icons/AppIcon.vue";

// ── panel state ───────────────────────────────────────────────────────────────

const panels = ref([
  { id: 0, name: 'Video 1', isPrimary: true, hasSound: true, src: null, offset: 0 },
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
  p.src  = URL.createObjectURL(file)
  p.name = file.name.replace(/\.[^.]+$/, '')

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
    name:      `Video ${panels.value.length + 1}`,
    isPrimary: false,
    hasSound:  false,
    src:       null,
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

// ── layout export / import ────────────────────────────────────────────────────

function exportLayout() {
  const layout = {
    currentTime: currentTime.value,
    panels: panels.value.map(p => ({
      name:      p.name,
      isPrimary: p.isPrimary,
      hasSound:  p.hasSound,
      offset:    p.offset,
    })),
  }
  const blob = new Blob([JSON.stringify(layout, null, 2)], { type: 'application/json' })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href     = url
  a.download = 'layout.json'
  a.click()
  URL.revokeObjectURL(url)
}

function importLayout(layout) {
  if (!Array.isArray(layout?.panels) || layout.panels.length === 0) return
  const count = Math.min(layout.panels.length, 9)

  // Revoke old blob URLs
  panels.value.forEach(p => { if (p.src) URL.revokeObjectURL(p.src) })

  // Ensure exactly one primary and one sound
  let primarySet = false
  let soundSet   = false
  const newPanels = layout.panels.slice(0, count).map((p, i) => {
    const isPrimary = p.isPrimary && !primarySet ? (primarySet = true, true) : false
    const hasSound  = p.hasSound  && !soundSet  ? (soundSet  = true, true) : false
    return {
      id:        nextId++,
      name:      p.name   ?? `Video ${i + 1}`,
      isPrimary,
      hasSound,
      src:       null,
      offset:    p.offset ?? 0,
    }
  })
  if (!primarySet) newPanels[0].isPrimary = true
  if (!soundSet)   newPanels[0].hasSound  = true

  panels.value    = newPanels
  panelRefs.value = []
  isPlaying.value = false
  stopSyncLoop()
  duration.value    = 0
  currentTime.value = layout.currentTime ?? 0
}

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

const helpOpen = ref(false)
</script>

<template>
  <div class="player">
    <div class="topbar">
        <AppIcon style="max-height:24px;width:auto"/>
      <span class="app-title">FastView</span>
      <span class="topbar-divider"></span>
      <FileMenu :panel-count="panels.length" @add-panel="addPanel" @export-layout="exportLayout" @import-layout="importLayout" />
      <button class="btn btn--sm topbar-right" @click="helpOpen = true">Help</button>
    </div>

    <HelpModal v-if="helpOpen" @close="helpOpen = false" />

    <div class="panels" :style="{ '--cols': gridCols }">
      <VideoPanel
        v-for="(p, i) in panels"
        :key="p.id"
        :ref="el => setRef(i, el)"
        :name="p.name"
        :is-primary="p.isPrimary"
        :has-sound="p.hasSound"
        :src="p.src"
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

<style scoped lang="scss">
.player {
  display: flex;
  flex-direction: column;
  height: 100vh;
  overflow: hidden;
}

.topbar {
  @include flex-row($gap: $space-3);
  padding: 5px $space-4;
  background: $bg-surface;
  border-bottom: 1px solid $border-subtle;
  min-height: 36px;
  flex-shrink: 0;
}

.topbar-divider {
  width: 1px;
  align-self: stretch;
  background: $border-subtle;
  margin: 4px 0;
}

.app-title {
  font-size: $font-size-lg;
  font-weight: 600;
  color: $text-primary;
  letter-spacing: 0.04em;
  user-select: none;
}

.topbar-right {
  margin-left: auto;
}

.panels {
  display: grid;
  grid-template-columns: repeat(var(--cols), 1fr);
  gap: $space-3;
  flex: 1;
  min-height: 0;
  padding: $space-3 $space-3 $space-4;
}

:deep(.panel--drag-over) {
  outline: 2px solid $accent;
  outline-offset: -2px;
}
</style>
