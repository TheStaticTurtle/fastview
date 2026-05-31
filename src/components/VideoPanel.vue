<script setup>
import { ref, watch, onMounted, onUnmounted, nextTick } from 'vue'
import SettingsIcon from './icons/SettingsIcon.vue'

const props = defineProps({
  name:       { type: String,  required: true },
  isPrimary:  { type: Boolean, default: false },
  hasSound:   { type: Boolean, default: false },
  src:        { type: String,  default: null },
  filename:   { type: String,  default: null },
  offset:     { type: Number,  default: 0 },
  removable:  { type: Boolean, default: false },
  zoomActive: { type: Boolean, default: false },
  zoomLevel:  { type: Number,  default: 2 },
  zoomRadius: { type: Number,  default: 80 },
})

const emit = defineEmits([
  'file-load',
  'update:offset',
  'loadedmetadata',
  'ended',
  'dragstart', 'dragover', 'drop', 'dragend',
  'set-primary',
  'set-sound',
  'update:name',
  'remove',
])

// ── video + canvas refs ───────────────────────────────────────────────────────

const videoEl   = ref(null)
const canvasEl  = ref(null)
const wrapperEl = ref(null)
const fileInput = ref(null)
defineExpose({ videoEl })

// ── settings menu ────────────────────────────────────────────────────────────

const settingsOpen = ref(false)
const settingsRoot = ref(null)

function onDocClick(e) {
  if (settingsRoot.value && !settingsRoot.value.contains(e.target)) {
    settingsOpen.value = false
  }
}
onMounted(()   => document.addEventListener('mousedown', onDocClick))
// onUnmounted listener added below alongside magnifier cleanup

// ── name editing ──────────────────────────────────────────────────────────────

const editing   = ref(false)
const nameInput = ref(null)
const editValue = ref('')

function startEdit() {
  editValue.value = props.name
  editing.value = true
  nextTick(() => nameInput.value?.select())
}

function commitEdit() {
  const trimmed = editValue.value.trim()
  if (trimmed) emit('update:name', trimmed)
  editing.value = false
}

// ── file loading ──────────────────────────────────────────────────────────────

function onFileChange(e) {
  const file = e.target.files[0]
  if (!file) return
  emit('file-load', file)
  e.target.value = ''
}

// ── magnifier ─────────────────────────────────────────────────────────────────

const mouse = { x: 0, y: 0, over: false }
let rafId = null

function syncCanvasSize() {
  const c = canvasEl.value
  if (!c) return
  c.width  = c.offsetWidth
  c.height = c.offsetHeight
}

function drawMagnifier() {
  const canvas = canvasEl.value
  const video  = videoEl.value
  if (!canvas || !video || !video.videoWidth) return

  const ctx  = canvas.getContext('2d')
  const W    = canvas.width
  const H    = canvas.height
  const vW   = video.videoWidth
  const vH   = video.videoHeight
  const mx   = mouse.x
  const my   = mouse.y
  const Z    = props.zoomLevel
  const R    = props.zoomRadius

  ctx.clearRect(0, 0, W, H)

  // object-fit: contain metrics
  const scale = Math.min(W / vW, H / vH)
  const rW    = vW * scale
  const rH    = vH * scale
  const ox    = (W - rW) / 2
  const oy    = (H - rH) / 2

  // map mouse (canvas px) → video px
  const mvx = (mx - ox) / scale
  const mvy = (my - oy) / scale

  // source region in video px that fills the circle at zoom Z
  const srcR  = R / Z / scale
  const srcX  = mvx - srcR
  const srcY  = mvy - srcR
  const srcSz = srcR * 2

  // clip to circle
  ctx.save()
  ctx.beginPath()
  ctx.arc(mx, my, R, 0, Math.PI * 2)
  ctx.clip()

  ctx.drawImage(video, srcX, srcY, srcSz, srcSz, mx - R, my - R, R * 2, R * 2)
  ctx.restore()

  // lens border + crosshair
  ctx.beginPath()
  ctx.arc(mx, my, R, 0, Math.PI * 2)
  ctx.strokeStyle = 'rgba(255,255,255,0.75)'
  ctx.lineWidth = 2
  ctx.stroke()

  ctx.strokeStyle = 'rgba(255,255,255,0.4)'
  ctx.lineWidth = 1
  ctx.beginPath(); ctx.moveTo(mx - R + 6, my); ctx.lineTo(mx + R - 6, my); ctx.stroke()
  ctx.beginPath(); ctx.moveTo(mx, my - R + 6); ctx.lineTo(mx, my + R - 6); ctx.stroke()
}

function startLoop() {
  if (rafId) return
  function loop() {
    drawMagnifier()
    rafId = requestAnimationFrame(loop)
  }
  rafId = requestAnimationFrame(loop)
}

function stopLoop() {
  if (rafId) { cancelAnimationFrame(rafId); rafId = null }
  const ctx = canvasEl.value?.getContext('2d')
  if (ctx) ctx.clearRect(0, 0, canvasEl.value.width, canvasEl.value.height)
}

watch(
  () => props.zoomActive && mouse.over,
  active => active ? startLoop() : stopLoop()
)

// also re-draw immediately when zoom params change while hovering
watch(() => [props.zoomLevel, props.zoomRadius], () => {
  if (props.zoomActive && mouse.over) drawMagnifier()
})

function onMouseMove(e) {
  const rect = canvasEl.value.getBoundingClientRect()
  mouse.x = (e.clientX - rect.left) * (canvasEl.value.width  / rect.width)
  mouse.y = (e.clientY - rect.top)  * (canvasEl.value.height / rect.height)
  mouse.over = true
  if (props.zoomActive && !rafId) startLoop()
}

function onMouseLeave() {
  mouse.over = false
  if (props.zoomActive) stopLoop()
}

// keep canvas pixels in sync with CSS size
let ro
onMounted(() => {
  syncCanvasSize()
  ro = new ResizeObserver(syncCanvasSize)
  ro.observe(canvasEl.value)
})
onUnmounted(() => {
  ro?.disconnect()
  stopLoop()
  document.removeEventListener('mousedown', onDocClick)
})
</script>

<template>
  <div
    class="panel"
    draggable="true"
    @dragstart="emit('dragstart', $event)"
    @dragover.prevent="emit('dragover', $event)"
    @drop.prevent="emit('drop', $event)"
    @dragend="emit('dragend', $event)"
  >
    <div class="panel-header" :class="{ 'header--primary': isPrimary, 'header--sound': hasSound && !isPrimary, 'header--both': isPrimary && hasSound }">
      <span class="drag-handle" title="Drag to reorder">⠿</span>
      <input
        v-if="editing"
        ref="nameInput"
        class="panel-label-input"
        v-model="editValue"
        @blur="commitEdit"
        @keydown.enter="commitEdit"
        @keydown.escape="editing = false"
      />
      <span v-else class="panel-label" title="Click to rename" @click="startEdit">{{ name }}</span>
      <div class="header-actions">
        <div ref="settingsRoot" class="settings-root">
          <button
            class="settings-btn" :class="{ open: settingsOpen }"
            title="Panel settings"
            @click="settingsOpen = !settingsOpen"
          >
            <SettingsIcon class="settings-icon" />
          </button>
          <div v-if="settingsOpen" class="settings-dropdown">
            <div class="settings-row">
              <span class="settings-label">Primary</span>
              <button
                class="badge-btn primary-btn" :class="{ active: isPrimary }"
                @click="emit('set-primary')"
              >{{ isPrimary ? 'active' : 'set' }}</button>
            </div>
            <div class="settings-row">
              <span class="settings-label">Audio</span>
              <button
                class="badge-btn sound-btn" :class="{ active: hasSound }"
                @click="emit('set-sound')"
              >{{ hasSound ? 'active' : 'set' }}</button>
            </div>
            <div class="settings-row settings-row--offset">
              <span class="settings-label">Offset (s)</span>
              <input
                type="number" class="settings-offset-input"
                :value="offset" step="0.1"
                :disabled="isPrimary"
                @change="emit('update:offset', parseFloat($event.target.value))"
              />
            </div>
          </div>
        </div>
        <button v-if="removable" class="remove-btn" title="Remove panel" @click="emit('remove')">✕</button>
      </div>
    </div>

    <div ref="wrapperEl" class="video-wrapper">
      <video
        ref="videoEl"
        :src="src ?? undefined"
        :muted="!hasSound"
        class="video"
        preload="metadata"
        @dblclick="src ? fileInput.click() : undefined"
        @loadedmetadata="emit('loadedmetadata', $event)"
        @ended="emit('ended', $event)"
      />
      <label v-if="!src" class="load-overlay">
        <span class="load-overlay-text">Click to load video</span>
        <input ref="fileInput" type="file" accept="video/*" @change="onFileChange" hidden />
      </label>
      <input v-else ref="fileInput" type="file" accept="video/*" @change="onFileChange" hidden />
      <canvas
        ref="canvasEl"
        class="magnifier-canvas"
        :class="{ active: zoomActive }"
        @mousemove="onMouseMove"
        @mouseleave="onMouseLeave"
      />
    </div>

  </div>

</template>

<style scoped>
.panel {
  display: flex;
  flex-direction: column;
  background: #1a1a1a;
  border-radius: 6px;
  overflow: hidden;
}

.panel-header {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 5px 10px;
  background: #242424;
  border-bottom: 1px solid #333;
  min-height: 28px;
  flex-shrink: 0;
  transition: background 0.2s, border-color 0.2s;
}
.header--primary  { background: #1a2e4a; border-color: #1e3f6a; }
.header--sound    { background: #1a2e1a; border-color: #1e4a1e; }
.header--both     { background: #1a2a3a; border-color: #1e3a4a; }

.drag-handle {
  font-size: 14px;
  color: #444;
  cursor: grab;
  user-select: none;
  padding: 0 2px;
  line-height: 1;
}
.drag-handle:hover { color: #777; }
.panel:active .drag-handle { cursor: grabbing; }

.panel-label {
  font-size: 10px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #aaa;
  cursor: pointer;
}
.panel-label:hover { color: #fff; }

.panel-label-input {
  font-size: 10px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #fff;
  background: #333;
  border: 1px solid #555;
  border-radius: 3px;
  padding: 0 4px;
  outline: none;
  width: 90px;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 1px;
  margin-left: auto;
}

.badge-btn {
  font-size: 9px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  padding: 2px 5px;
  border-radius: 3px;
  cursor: pointer;
  line-height: 1;
  transition: opacity 0.15s, background 0.15s, color 0.15s;
}

.primary-btn {
  background: #1a2a3a;
  border: 1px solid #1e3a5a;
  color: #3a7ab0;
  opacity: 0.5;
}
.primary-btn:hover  { opacity: 0.85; }
.primary-btn.active { background: #1a3a6a; border-color: #2a5a9a; color: #6ab0ff; opacity: 1; }

.sound-btn {
  background: #1e2a1e;
  border: 1px solid #2a3a2a;
  color: #4a7a4a;
  opacity: 0.5;
}
.sound-btn:hover  { opacity: 0.85; }
.sound-btn.active { background: #1a3a1a; border-color: #2a6a2a; color: #6abf6a; opacity: 1; }

.remove-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 0 3px;
  line-height: 1;
  font-size: 11px;
  color: #444;
  transition: color 0.12s;
}
.remove-btn:hover { color: #e05555; }

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

.load-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.load-overlay-text {
  padding: 8px 16px;
  border-radius: 6px;
  border: 1px dashed #333;
  color: #444;
  font-size: 12px;
  transition: border-color 0.15s, color 0.15s;
}
.load-overlay:hover .load-overlay-text {
  border-color: #666;
  color: #999;
}

.magnifier-canvas {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;   /* default: no interaction */
}
.magnifier-canvas.active {
  pointer-events: auto;
  cursor: crosshair;
}


/* ── settings menu ── */
.settings-root {
  position: relative;
}

.settings-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  background: none;
  border: none;
  cursor: pointer;
  padding: 2px 3px;
  color: #555;
  border-radius: 3px;
  transition: color 0.15s, background 0.15s;
}
.settings-btn:hover { color: #aaa; background: #2a2a2a; }
.settings-btn.open  { color: #ccc; background: #2a2a2a; }

.settings-icon {
  width: 14px;
  height: 14px;
}

.settings-dropdown {
  position: absolute;
  top: calc(100% + 6px);
  right: 0;
  min-width: 170px;
  background: #222;
  border: 1px solid #3a3a3a;
  border-radius: 6px;
  padding: 6px;
  z-index: 50;
  box-shadow: 0 6px 20px rgba(0,0,0,0.55);
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.settings-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 5px 8px;
  border-radius: 4px;
  gap: 12px;
}
.settings-row:hover { background: #2a2a2a; }

.settings-label {
  font-size: 12px;
  color: #888;
}

.settings-offset-input {
  width: 68px;
  background: #2c2c2c;
  border: 1px solid #3a3a3a;
  border-radius: 4px;
  color: #e8e8e8;
  font-size: 12px;
  padding: 3px 6px;
  text-align: right;
  outline: none;
  -moz-appearance: textfield;
}
.settings-offset-input:focus { border-color: #555; }
.settings-offset-input:disabled { opacity: 0.35; cursor: not-allowed; }
.settings-offset-input::-webkit-outer-spin-button,
.settings-offset-input::-webkit-inner-spin-button { -webkit-appearance: none; }
</style>
