<script setup>
import { ref, computed } from 'vue'
import SeekBar from './SeekBar.vue'
import GotoInput from './GotoInput.vue'
import PlaybackControls from './PlaybackControls.vue'
import ZoomControls from './ZoomControls.vue'

defineProps({
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

const seekBarRef = ref(null)
const isSeeking = computed(() => seekBarRef.value?.isSeeking ?? false)

defineExpose({ isSeeking })
</script>

<template>
  <div class="transport">
    <SeekBar
      ref="seekBarRef"
      :current-time="currentTime"
      :duration="duration"
      @seek="emit('seek', $event)"
    />

    <div class="bottom-row">
      <GotoInput @seek="emit('seek', $event)" />

      <PlaybackControls
        :is-playing="isPlaying"
        :can-play="canPlay"
        @toggle-play="emit('toggle-play')"
        @skip="emit('skip', $event)"
      />

      <ZoomControls
        :zoom-active="zoomActive"
        :zoom-level="zoomLevel"
        :zoom-radius="zoomRadius"
        @update:zoom-active="emit('update:zoomActive', $event)"
        @update:zoom-level="emit('update:zoomLevel', $event)"
        @update:zoom-radius="emit('update:zoomRadius', $event)"
      />
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

.bottom-row {
  display: flex;
  align-items: center;
  position: relative;
}
</style>
