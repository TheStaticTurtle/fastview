<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  currentTime: { type: Number, default: 0 },
  duration:    { type: Number, default: 0 },
})

const emit = defineEmits(['seek'])

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
</template>

<style scoped>
.seekbar-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding-bottom: 18px;
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
</style>
