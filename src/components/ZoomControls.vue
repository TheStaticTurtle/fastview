<script setup>
import MagnifierIcon from './icons/MagnifierIcon.vue'

defineProps({
  zoomActive: { type: Boolean, default: false },
  zoomLevel:  { type: Number,  default: 2 },
  zoomRadius: { type: Number,  default: 80 },
})

const emit = defineEmits(['update:zoomActive', 'update:zoomLevel', 'update:zoomRadius'])
</script>

<template>
  <div class="zoom-area">
    <button
      class="btn zoom-toggle" :class="{ active: zoomActive }"
      @click="emit('update:zoomActive', !zoomActive)"
      title="Toggle magnifier"
    ><MagnifierIcon class="zoom-icon" /> Zoom</button>
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
</template>

<style scoped>
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

.zoom-toggle {
  display: flex;
  align-items: center;
  gap: 4px;
}

.zoom-icon {
  width: 15px;
  height: 15px;
  flex-shrink: 0;
}

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
