<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  currentTime: { type: Number, default: 0 },
  duration:    { type: Number, default: 0 },
  isPlaying:   { type: Boolean, default: false },
  canPlay:     { type: Boolean, default: false },
})

const emit = defineEmits(['toggle-play', 'seek', 'skip'])

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

defineExpose({ isSeeking })
</script>

<template>
  <div class="transport">
    <div class="seekbar-row">
      <span class="time-label">{{ fmt(currentTime) }}</span>
      <div class="seekbar-track">
        <div class="seekbar-fill" :style="{ width: seekPct + '%' }" />
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

    <div class="btn-row">
      <button class="btn skip-btn" @click="emit('skip', -30)">−30s</button>
      <button class="btn skip-btn" @click="emit('skip', -10)">−10s</button>
      <button class="btn play-btn" :disabled="!canPlay" @click="emit('toggle-play')">
        {{ isPlaying ? '⏸' : '▶' }}
      </button>
      <button class="btn skip-btn" @click="emit('skip', 10)">+10s</button>
      <button class="btn skip-btn" @click="emit('skip', 30)">+30s</button>
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
  gap: 10px;
  flex-shrink: 0;
}

.seekbar-row {
  display: flex;
  align-items: center;
  gap: 10px;
}

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

.seekbar {
  position: absolute;
  inset: -8px 0;
  width: 100%;
  height: calc(100% + 16px);
  opacity: 0;
  cursor: pointer;
  margin: 0;
}

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
</style>
