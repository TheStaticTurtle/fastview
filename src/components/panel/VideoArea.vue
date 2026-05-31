<script setup>
import { ref, watch, onMounted, onUnmounted } from 'vue'

const props = defineProps({
  src:        { type: String,  default: null },
  hasSound:   { type: Boolean, default: false },
  zoomActive: { type: Boolean, default: false },
  zoomLevel:  { type: Number,  default: 2 },
  zoomRadius: { type: Number,  default: 80 },
})

const emit = defineEmits(['file-load', 'loadedmetadata', 'ended', 'timeupdate'])

const videoEl  = ref(null)
const canvasEl = ref(null)
const fileInput = ref(null)

defineExpose({ videoEl })

// ── file loading ──────────────────────────────────────────────────────────────

function onFileChange(e) {
  const file = e.target.files[0]
  if (!file) return
  emit('file-load', file)
  e.target.value = ''
}

function onDragOver(e) {
  e.preventDefault()
  e.dataTransfer.dropEffect = 'copy'
}

function onDrop(e) {
  e.preventDefault()
  const file = e.dataTransfer.files[0]
  if (file && file.type.startsWith('video/')) {
    e.stopPropagation()
    emit('file-load', file)
  }
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

  const ctx = canvas.getContext('2d')
  const W   = canvas.width
  const H   = canvas.height
  const vW  = video.videoWidth
  const vH  = video.videoHeight
  const mx  = mouse.x
  const my  = mouse.y
  const Z   = props.zoomLevel
  const R   = props.zoomRadius

  ctx.clearRect(0, 0, W, H)

  const scale = Math.min(W / vW, H / vH)
  const rW    = vW * scale
  const rH    = vH * scale
  const ox    = (W - rW) / 2
  const oy    = (H - rH) / 2

  const mvx  = (mx - ox) / scale
  const mvy  = (my - oy) / scale
  const srcR = R / Z / scale
  const srcX = mvx - srcR
  const srcY = mvy - srcR
  const srcSz = srcR * 2

  ctx.save()
  ctx.beginPath()
  ctx.arc(mx, my, R, 0, Math.PI * 2)
  ctx.clip()
  ctx.drawImage(video, srcX, srcY, srcSz, srcSz, mx - R, my - R, R * 2, R * 2)
  ctx.restore()

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
  function loop() { drawMagnifier(); rafId = requestAnimationFrame(loop) }
  rafId = requestAnimationFrame(loop)
}

function stopLoop() {
  if (rafId) { cancelAnimationFrame(rafId); rafId = null }
  const ctx = canvasEl.value?.getContext('2d')
  if (ctx) ctx.clearRect(0, 0, canvasEl.value.width, canvasEl.value.height)
}

watch(() => props.zoomActive && mouse.over, active => active ? startLoop() : stopLoop())

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

let ro
onMounted(() => {
  syncCanvasSize()
  ro = new ResizeObserver(syncCanvasSize)
  ro.observe(canvasEl.value)
})
onUnmounted(() => { ro?.disconnect(); stopLoop() })
</script>

<template>
  <div class="video-wrapper" @dragover="onDragOver" @drop="onDrop">
    <video
      ref="videoEl"
      :src="src ?? undefined"
      :muted="!hasSound"
      class="video"
      preload="metadata"
      @dblclick="src ? fileInput.click() : undefined"
      @loadedmetadata="emit('loadedmetadata', $event)"
      @ended="emit('ended', $event)"
      @timeupdate="emit('timeupdate', $event.target.currentTime)"
    />
    <label v-if="!src" class="load-overlay">
      <span class="load-overlay-text">Click or drop video</span>
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
</template>

<style scoped lang="scss">
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
  @include flex-center;
  cursor: pointer;

  &:hover .load-overlay-text {
    border-color: $text-ghost;
    color: $text-muted;
  }
}

.load-overlay-text {
  padding: $space-4 $space-8;
  border-radius: $radius-lg;
  border: 1px dashed $border-input;
  color: $text-disabled;
  font-size: $font-size-base;
  transition: border-color $t-base, color $t-base;
}

.magnifier-canvas {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;

  &.active {
    pointer-events: auto;
    cursor: crosshair;
  }
}
</style>
