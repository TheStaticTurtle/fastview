<script setup>
import { ref, nextTick } from 'vue'

const props = defineProps({
  name:      { type: String,  required: true },
  isPrimary: { type: Boolean, default: false },
  hasSound:  { type: Boolean, default: false },
  src:       { type: String,  default: null },
  filename:  { type: String,  default: null },
  offset:    { type: Number,  default: 0 },
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

const videoEl = ref(null)
defineExpose({ videoEl })

const editing = ref(false)
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

function onFileChange(e) {
  const file = e.target.files[0]
  if (!file) return
  emit('file-load', file)
  e.target.value = ''
}
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
        class="sound-btn"
        :class="{ active: hasSound }"
        :title="hasSound ? 'Sound source (click to mute)' : 'Switch sound to this panel'"
        @click="emit('set-sound')"
      >{{ hasSound ? '🔊' : '🔇' }}</button>
      <span v-if="filename"  class="panel-filename" :title="filename">{{ filename }}</span>
    </div>

    <div class="video-wrapper">
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
