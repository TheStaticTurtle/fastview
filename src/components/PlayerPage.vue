<script setup>
import { ref, computed, nextTick } from 'vue'
import VideoPanel from './VideoPanel.vue'
import TransportBar from './TransportBar.vue'

const props = defineProps({
  configs: { type: Array, required: true },
})

const emit = defineEmits(['back'])

// ── panel state ───────────────────────────────────────────────────────────────

const panels = ref(
  props.configs.map(cfg => ({
    ...cfg,
    src:      null,
    filename: null,
    offset:   0,
  }))
)

const primaryIdx = computed(() => panels.value.findIndex(p => p.isPrimary))
const soundIdx   = computed(() => panels.value.findIndex(p => p.hasSound))

const gridCols = computed(() => {
  const n = panels.value.length
  if (n <= 3) return n
  if (n === 4) return 2
  if (n <= 6) return 3
  return 4
})

// ── video element refs (one per panel) ───────────────────────────────────────

const panelRefs   = ref([])
const transportRef = ref(null)

function setRef(i, component) {
  panelRefs.value[i] = component
}

function videoEl(i) {
  return panelRefs.value[i]?.videoEl ?? null
}

// ── transport state ───────────────────────────────────────────────────────────

const isPlaying   = ref(false)
const currentTime = ref(0)
const duration    = ref(0)

const canPlay = computed(() => !!panels.value[primaryIdx.value]?.src)

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

// ── primary video events ──────────────────────────────────────────────────────

function onTimeUpdate() {
  if (transportRef.value?.isSeeking) return
  const el = videoEl(primaryIdx.value)
  if (!el) return
  currentTime.value = el.currentTime
  syncAll(el.currentTime)
}

function onLoadedMetadata() {
  duration.value = videoEl(primaryIdx.value)?.duration ?? 0
}

function onEnded() {
  isPlaying.value = false
}

// ── file loading ──────────────────────────────────────────────────────────────

async function onFileLoad(i, file) {
  const p = panels.value[i]
  if (p.src) URL.revokeObjectURL(p.src)
  p.src      = URL.createObjectURL(file)
  p.filename = file.name

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

// ── offset ────────────────────────────────────────────────────────────────────

function onSetSound(i) {
  panels.value.forEach((p, j) => { p.hasSound = j === i })
}

function onOffsetUpdate(i, value) {
  panels.value[i].offset = value
  const el = videoEl(i)
  if (el && panels.value[i].src) {
    el.currentTime = Math.max(0, currentTime.value + value)
  }
}

// ── playback controls ─────────────────────────────────────────────────────────

function togglePlay() {
  isPlaying.value ? pauseAll() : playAll()
}

function playAll() {
  panels.value.forEach((p, i) => {
    if (p.src) videoEl(i)?.play().catch(() => {})
  })
  isPlaying.value = true
}

function pauseAll() {
  panels.value.forEach((_, i) => videoEl(i)?.pause())
  isPlaying.value = false
}

function seekTo(t) {
  const clamped = Math.max(0, Math.min(duration.value, t))
  const el = videoEl(primaryIdx.value)
  if (el) el.currentTime = clamped
  currentTime.value = clamped
  syncAll(clamped)
}

function onSkip(delta) { seekTo(currentTime.value + delta) }

// ── zoom ──────────────────────────────────────────────────────────────────────

const zoomActive = ref(false)
const zoomLevel  = ref(2)
const zoomRadius = ref(80)
</script>

<template>
  <div class="player">
    <div class="topbar">
      <button class="btn back-btn" @click="emit('back')">← Setup</button>
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
        @set-sound="onSetSound(i)"
        @update:name="panels[i].name = $event"
        @file-load="onFileLoad(i, $event)"
        @update:offset="onOffsetUpdate(i, $event)"
        @timeupdate="i === primaryIdx ? onTimeUpdate() : undefined"
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
}
.btn:hover { background: #3a3a3a; color: #fff; }

.panels {
  display: grid;
  grid-template-columns: repeat(var(--cols), 1fr);
  gap: 6px;
  flex: 1;
  min-height: 0;
  padding: 6px 6px 8px;
}
</style>
