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

<style scoped lang="scss">
.zoom-area {
  @include flex-row($gap: $space-4);
  margin-left: auto;
}

.zoom-toggle {
  @include flex-row($gap: $space-2);

  &.active {
    background: $accent-green-bg;
    border-color: $accent-green-border;
    color: $accent-green;
  }
}

.zoom-icon {
  width: 15px;
  height: 15px;
  flex-shrink: 0;
}

.zoom-sliders {
  @include flex-row($gap: $space-3);
  padding: $space-2 $space-5;
  border-radius: $radius-lg;
  border: 1px solid $accent-green-border;
  background: $accent-green-panel;
}

.zoom-label {
  font-size: $font-size-md;
  color: $text-ghost;
}

.zoom-slider {
  width: 72px;
  accent-color: $accent;
  cursor: pointer;
}

.zoom-value {
  font-size: $font-size-md;
  color: $text-muted;
  min-width: 36px;
  font-variant-numeric: tabular-nums;
}
</style>
