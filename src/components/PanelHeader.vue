<script setup>
import { ref, nextTick } from 'vue'
import PanelSettingsMenu from './PanelSettingsMenu.vue'
import DragHandleIcon from './icons/DragHandleIcon.vue'
import CloseIcon from './icons/CloseIcon.vue'

const props = defineProps({
  name:      { type: String,  required: true },
  isPrimary: { type: Boolean, default: false },
  hasSound:  { type: Boolean, default: false },
  offset:    { type: Number,  default: 0 },
  removable: { type: Boolean, default: false },
})

const emit = defineEmits([
  'update:name', 'update:offset',
  'set-primary', 'set-sound', 'remove',
])

const editing   = ref(false)
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
</script>

<template>
  <div
    class="panel-header"
    :class="{
      'header--primary': isPrimary,
      'header--sound':   hasSound && !isPrimary,
      'header--both':    isPrimary && hasSound,
    }"
  >
    <DragHandleIcon class="drag-handle" title="Drag to reorder" />

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

    <div class="header-actions">
      <PanelSettingsMenu
        :is-primary="isPrimary"
        :has-sound="hasSound"
        :offset="offset"
        @set-primary="emit('set-primary')"
        @set-sound="emit('set-sound')"
        @update:offset="emit('update:offset', $event)"
      />
      <button v-if="removable" class="remove-btn" title="Remove panel" @click="emit('remove')">
        <CloseIcon class="remove-icon" />
      </button>
    </div>
  </div>
</template>

<style scoped>
.panel-header {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 5px 10px;
  background: #242424;
  border-bottom: 1px solid #333;
  min-height: 28px;
  flex-shrink: 0;
  transition: background 0.2s, border-color 0.2s;
}
.header--primary  { background: #1a2e4a; border-color: #1e3f6a; }
.header--sound    { background: #1a2e1a; border-color: #1e4a1e; }
.header--both     { background: #1a2a3a; border-color: #1e3a4a; }

.drag-handle {
  width: 14px;
  height: 14px;
  flex-shrink: 0;
  color: #444;
  cursor: grab;
  user-select: none;
}
.drag-handle:hover { color: #777; }

.panel-label {
  font-size: 10px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #aaa;
  cursor: pointer;
}
.panel-label:hover { color: #fff; }

.panel-label-input {
  font-size: 10px;
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

.header-actions {
  display: flex;
  align-items: center;
  gap: 1px;
  margin-left: auto;
}

.remove-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 0 2px;
  display: flex;
  align-items: center;
  color: #444;
  transition: color 0.12s;
}
.remove-btn:hover { color: #e05555; }

.remove-icon {
  width: 13px;
  height: 13px;
}
</style>
