<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  currentTime: { type: Number,  default: 0 },
  duration:    { type: Number,  default: 0 },
  isPlaying:   { type: Boolean, default: false },
  canPlay:     { type: Boolean, default: false },
  zoomActive:  { type: Boolean, default: false },
  zoomLevel:   { type: Number,  default: 2 },
  zoomRadius:  { type: Number,  default: 80 },
})

const emit = defineEmits([
  'toggle-play', 'seek', 'skip',
  'update:zoomActive', 'update:zoomLevel', 'update:zoomRadius',
])

const isSeeking = ref(false)

const seekPct = computed(() =>
  props.duration > 0 ? (props.currentTime / props.duration) * 100 : 0
)

function fmt(t) {
  if (!isFinite(t) || t < 0) return '0:00'
  const h = Math.floor(t / 3600)
  const m = Math.floor((t % 3600) / 60)
  const s = Math.floor(t % 60)
  return h > 0
    ? `${h}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`
    : `${m}:${String(s).padStart(2,'0')}`
}

function onSeekStart()  { isSeeking.value = true }
function onSeekInput(e) { emit('seek', parseFloat(e.target.value)) }
function onSeekEnd(e)   { emit('seek', parseFloat(e.target.value)); isSeeking.value = false }

// ── go-to input ───────────────────────────────────────────────────────────────

const gotoValue = ref('')

function parseGoto(str) {
  const s = str.trim()
  if (!s) return null
  // h:mm:ss or m:ss
  const parts = s.split(':').map(Number)
  if (parts.some(isNaN)) return null
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2]
  if (parts.length === 2) return parts[0] * 60 + parts[1]
  return parts[0]
}

function onGotoCommit() {
  const t = parseGoto(gotoValue.value)
  if (t !== null) emit('seek', t)
  gotoValue.value = ''
}

defineExpose({ isSeeking })
</script>

<template>
  <div class="transport">
    <div class="seekbar-row">
      <span class="time-label">{{ fmt(currentTime) }}</span>
      <div class="seekbar-track">
        <div class="seekbar-fill" :style="{ width: seekPct + '%' }" />
        <div class="seekbar-ball" :style="{ left: seekPct + '%' }" />
        <input
          type="range" class="seekbar"
          min="0" :max="duration || 100" step="0.05"
          :value="currentTime"
          @mousedown="onSeekStart"
          @input="onSeekInput"
          @change="onSeekEnd"
        />
      </div>
      <span class="time-label right">{{ fmt(duration) }}</span>
    </div>

    <div class="bottom-row">
      <!-- go-to input (left) -->
      <input
        class="goto-input"
        v-model="gotoValue"
        placeholder="go to…"
        @keydown.enter="onGotoCommit"
        @blur="onGotoCommit"
      />

      <!-- playback controls (centred) -->
      <div class="btn-row">
        <button class="btn skip-btn" @click="emit('skip', -30)">−30s</button>
        <button class="btn skip-btn" @click="emit('skip', -10)">−10s</button>
        <button class="btn skip-btn" @click="emit('skip', -5)">−5s</button>
        <button class="btn play-btn" :disabled="!canPlay" @click="emit('toggle-play')">
          {{ isPlaying ? '⏸' : '▶' }}
        </button>
        <button class="btn skip-btn" @click="emit('skip', 5)">+5s</button>
        <button class="btn skip-btn" @click="emit('skip', 10)">+10s</button>
        <button class="btn skip-btn" @click="emit('skip', 30)">+30s</button>
      </div>

      <!-- zoom controls (right-aligned) -->
      <div class="zoom-area">
        <button
          class="btn zoom-toggle" :class="{ active: zoomActive }"
          @click="emit('update:zoomActive', !zoomActive)"
          title="Toggle magnifier"
        >🔍 Zoom</button>
        <div v-if="zoomActive" class="zoom-sliders">
          <span class="zoom-label">Level</span>
          <input
            type="range" class="zoom-slider"
            min="1.5" max="8" step="0.5"
            :value="zoomLevel"
            @input="emit('update:zoomLevel', parseFloat($event.target.value))"
          />
          <span class="zoom-value">{{ zoomLevel }}×</span>
          <span class="zoom-label">Radius</span>
          <input
            type="range" class="zoom-slider"
            min="30" max="200" step="10"
            :value="zoomRadius"
            @input="emit('update:zoomRadius', parseFloat($event.target.value))"
          />
          <span class="zoom-value">{{ zoomRadius }}px</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.transport {
  padding: 10px 12px 14px;
  background: #181818;
  border-top: 1px solid #2a2a2a;
  display: flex;
  flex-direction: column;
  gap: 0;
  flex-shrink: 0;
}

.seekbar-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding-bottom: 18px;
}

.goto-input {
  width: 72px;
  background: #222;
  border: 1px solid #333;
  border-radius: 4px;
  color: #aaa;
  font-size: 11px;
  padding: 3px 7px;
  outline: none;
  font-variant-numeric: tabular-nums;
}
.goto-input::placeholder { color: #444; }
.goto-input:focus { border-color: #555; color: #e8e8e8; }

.time-label {
  font-size: 12px;
  color: #888;
  min-width: 44px;
  font-variant-numeric: tabular-nums;
}
.time-label.right { text-align: right; }

.seekbar-track {
  position: relative;
  flex: 1;
  height: 4px;
  background: #333;
  border-radius: 2px;
}

.seekbar-fill {
  position: absolute;
  left: 0; top: 0;
  height: 100%;
  background: #4a9eff;
  border-radius: 2px;
  pointer-events: none;
}

.seekbar-ball {
  position: absolute;
  top: 50%;
  width: 12px;
  height: 12px;
  background: #fff;
  border-radius: 50%;
  transform: translate(-50%, -50%);
  pointer-events: none;
  box-shadow: 0 1px 4px rgba(0,0,0,0.4);
  transition: transform 0.1s;
}

.seekbar-track:hover .seekbar-ball {
  transform: translate(-50%, -50%) scale(1.25);
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

/* ── bottom row: playback centred, zoom right ── */
.bottom-row {
  display: flex;
  align-items: center;
  position: relative;
}

.btn-row {
  display: flex;
  align-items: center;
  gap: 8px;
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
}

.zoom-area {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-left: auto;
}

.zoom-sliders {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  border-radius: 6px;
  border: 1px solid #2a7a4a;
  background: #111e15;
}

/* ── shared button base ── */
.btn {
  background: #2c2c2c;
  color: #ccc;
  border: 1px solid #3a3a3a;
  border-radius: 5px;
  cursor: pointer;
  font-size: 13px;
  padding: 5px 12px;
  transition: background 0.12s, color 0.12s;
  white-space: nowrap;
}
.btn:hover  { background: #3a3a3a; color: #fff; }
.btn:active { background: #444; }

.skip-btn { min-width: 52px; }

.play-btn {
  background: #1a5fb4;
  border-color: #2a7ad4;
  color: #fff;
  font-size: 18px;
  width: 48px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
}
.play-btn:hover    { background: #2270cc; }
.play-btn:disabled { opacity: 0.35; cursor: not-allowed; }

/* ── zoom ── */
.zoom-toggle.active {
  background: #1a4a2a;
  border-color: #2a7a4a;
  color: #5dbb7a;
}

.zoom-label {
  font-size: 11px;
  color: #666;
}

.zoom-slider {
  width: 72px;
  accent-color: #4a9eff;
  cursor: pointer;
}

.zoom-value {
  font-size: 11px;
  color: #aaa;
  min-width: 36px;
  font-variant-numeric: tabular-nums;
}
</style>
