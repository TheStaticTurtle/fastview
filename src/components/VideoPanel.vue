<script setup>
import { ref, computed } from 'vue'
import PanelHeader from './PanelHeader.vue'
import VideoArea from './VideoArea.vue'

const props = defineProps({
  name:       { type: String,  required: true },
  isPrimary:  { type: Boolean, default: false },
  hasSound:   { type: Boolean, default: false },
  src:        { type: String,  default: null },
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

const videoAreaRef = ref(null)
const videoEl = computed(() => videoAreaRef.value?.videoEl ?? null)

defineExpose({ videoEl })
</script>

<template>
  <div
    class="card panel"
    draggable="true"
    @dragstart="emit('dragstart', $event)"
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
    />
  </div>
</template>

<style scoped lang="scss">
.panel {
  display: flex;
  flex-direction: column;

  &:active :deep(.drag-handle) { cursor: grabbing; }
}
</style>
