<script setup>
import { ref, computed } from 'vue'
import PanelHeader from './PanelHeader.vue'
import VideoArea from './VideoArea.vue'

function formatTimecode(secs) {
  if (!isFinite(secs) || secs < 0) secs = 0
  const h  = Math.floor(secs / 3600)
  const m  = Math.floor((secs % 3600) / 60)
  const s  = Math.floor(secs % 60)
  const hh = String(h).padStart(2, '0')
  const mm = String(m).padStart(2, '0')
  const ss = String(s).padStart(2, '0')
  return `${hh}:${mm}:${ss}`
}

const props = defineProps({
  name:       { type: String,  required: true },
  isPrimary:  { type: Boolean, default: false },
  hasSound:   { type: Boolean, default: false },
  src:        { type: String,  default: null },
  offset:     { type: Number,  default: 0 },
  removable:  { type: Boolean, default: false },
  zoomActive:    { type: Boolean, default: false },
  zoomLevel:     { type: Number,  default: 2 },
  zoomRadius:    { type: Number,  default: 80 },
  showTimecode:  { type: Boolean, default: true },
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

const videoAreaRef = ref(null)
const videoEl = computed(() => videoAreaRef.value?.videoEl ?? null)

defineExpose({ videoEl })

const displayTime = ref('00:00:00')

const dragFromHandle = ref(false)

function onMouseDown(e) {
  dragFromHandle.value = e.composedPath().some(el => el.classList?.contains('drag-handle'))
}

function onDragStart(e) {
  if (!dragFromHandle.value) { e.preventDefault(); return }
  emit('dragstart', e)
}
</script>

<template>
  <div
    class="card panel"
    draggable="true"
    @mousedown="onMouseDown"
    @dragstart="onDragStart"
    @dragover.prevent="emit('dragover', $event)"
    @drop.prevent="emit('drop', $event)"
    @dragend="emit('dragend', $event)"
  >
    <PanelHeader
      :name="name"
      :is-primary="isPrimary"
      :has-sound="hasSound"
      :offset="offset"
      :removable="removable"
      @update:name="emit('update:name', $event)"
      @update:offset="emit('update:offset', $event)"
      @set-primary="emit('set-primary')"
      @set-sound="emit('set-sound')"
      @remove="emit('remove')"
    />

    <div v-if="showTimecode" class="timecode-overlay">{{ displayTime }}</div>

    <VideoArea
      ref="videoAreaRef"
      :src="src"
      :has-sound="hasSound"
      :zoom-active="zoomActive"
      :zoom-level="zoomLevel"
      :zoom-radius="zoomRadius"
      @file-load="emit('file-load', $event)"
      @loadedmetadata="emit('loadedmetadata', $event)"
      @ended="emit('ended', $event)"
      @timeupdate="displayTime = formatTimecode($event)"
    />
  </div>
</template>

<style scoped lang="scss">
.panel {
  display: flex;
  flex-direction: column;
  position: relative;

  &:active :deep(.drag-handle) { cursor: grabbing; }
}

.timecode-overlay {
  position: absolute;
  top: 36px; // below PanelHeader
  left: 50%;
  transform: translateX(-50%);
  background: rgba(0, 0, 0, 0.55);
  color: #fff;
  font-size: $font-size-sm;
  font-variant-numeric: tabular-nums;
  font-family: 'Consolas', 'Courier New', monospace;
  padding: 2px $space-3;
  border-radius: $radius-sm;
  pointer-events: none;
  z-index: 10;
  user-select: none;
  white-space: nowrap;
}
</style>
