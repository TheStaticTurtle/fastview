<script setup>
import { ref, watch, onMounted, onUnmounted, nextTick } from 'vue'

const props = defineProps({
  name:       { type: String,  required: true },
  isPrimary:  { type: Boolean, default: false },
  hasSound:   { type: Boolean, default: false },
  src:        { type: String,  default: null },
  filename:   { type: String,  default: null },
  offset:     { type: Number,  default: 0 },
  zoomActive: { type: Boolean, default: false },
  zoomLevel:  { type: Number,  default: 2 },
  zoomRadius: { type: Number,  default: 80 },
})

const emit = defineEmits([
  'file-load',
  'update:offset',
  'timeupdate',
  'loadedmetadata',
  'ended',
  'set-sound',
  'update:name',
])

// ── video + canvas refs ───────────────────────────────────────────────────────

const videoEl  = ref(null)
const canvasEl = ref(null)
const wrapperEl = ref(null)
defineExpose({ videoEl })

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
onUnmounted(() => { ro?.disconnect(); stopLoop() })
</script>

<template>
  <div class="panel">
    <div class="panel-header">
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
      <span v-if="isPrimary" class="badge primary-badge">primary</span>
      <button
        class="sound-btn" :class="{ active: hasSound }"
        :title="hasSound ? 'Sound source' : 'Switch sound here'"
        @click="emit('set-sound')"
      >{{ hasSound ? '🔊' : '🔇' }}</button>
      <span v-if="filename" class="panel-filename" :title="filename">{{ filename }}</span>
    </div>

    <div ref="wrapperEl" class="video-wrapper">
      <video
        ref="videoEl"
        :src="src ?? undefined"
        :muted="!hasSound"
        class="video"
        preload="metadata"
        @timeupdate="emit('timeupdate', $event)"
        @loadedmetadata="emit('loadedmetadata', $event)"
        @ended="emit('ended', $event)"
      />
      <div v-if="!src" class="placeholder">No file loaded</div>
      <canvas
        ref="canvasEl"
        class="magnifier-canvas"
        :class="{ active: zoomActive }"
        @mousemove="onMouseMove"
        @mouseleave="onMouseLeave"
      />
    </div>

    <div class="panel-footer">
      <label class="btn load-btn">
        Load file
        <input type="file" accept="video/*" @change="onFileChange" hidden />
      </label>

      <div v-if="!isPrimary" class="offset-row">
        <span class="offset-label">Offset</span>
        <input
          type="number" class="offset-input"
          :value="offset" step="0.1"
          @change="emit('update:offset', parseFloat($event.target.value))"
        />
        <span class="offset-unit">s</span>
      </div>
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
}

.panel-label {
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #aaa;
  cursor: pointer;
}
.panel-label:hover { color: #fff; }

.panel-label-input {
  font-size: 12px;
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

.badge {
  font-size: 10px;
  font-weight: 600;
  padding: 1px 5px;
  border-radius: 3px;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}
.primary-badge { background: #1a3a6a; color: #6ab0ff; }

.sound-btn {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 14px;
  padding: 0 2px;
  line-height: 1;
  opacity: 0.3;
  transition: opacity 0.15s, transform 0.1s;
}
.sound-btn:hover  { opacity: 0.7; transform: scale(1.15); }
.sound-btn.active { opacity: 1; }

.panel-filename {
  font-size: 11px;
  color: #555;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  min-width: 0;
  flex: 1;
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

.placeholder {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #3a3a3a;
  font-size: 13px;
  pointer-events: none;
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

.panel-footer {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 5px 10px;
  background: #1e1e1e;
  border-top: 1px solid #2a2a2a;
  flex-shrink: 0;
  min-height: 38px;
}

.btn {
  background: #2c2c2c;
  color: #ccc;
  border: 1px solid #3a3a3a;
  border-radius: 5px;
  cursor: pointer;
  font-size: 12px;
  padding: 3px 10px;
  transition: background 0.12s, color 0.12s;
  white-space: nowrap;
}
.btn:hover { background: #3a3a3a; color: #fff; }

.offset-row {
  display: flex;
  align-items: center;
  gap: 5px;
  margin-left: auto;
}
.offset-label { font-size: 11px; color: #666; }
.offset-input {
  width: 62px;
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
.offset-input:focus { border-color: #555; }
.offset-input::-webkit-outer-spin-button,
.offset-input::-webkit-inner-spin-button { -webkit-appearance: none; }
.offset-unit { font-size: 11px; color: #555; }
</style>
