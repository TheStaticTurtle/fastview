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
      'panel-header--primary': isPrimary,
      'panel-header--sound':   hasSound && !isPrimary,
      'panel-header--both':    isPrimary && hasSound,
    }"
  >
    <DragHandleIcon class="drag-handle" title="Drag to reorder" />

    <input
      v-if="editing"
      ref="nameInput"
      class="label-input"
      v-model="editValue"
      @blur="commitEdit"
      @keydown.enter="commitEdit"
      @keydown.escape="editing = false"
    />
    <span v-else class="label" title="Click to rename" @click="startEdit">{{ name }}</span>

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

<style scoped lang="scss">
.panel-header {
  @include panel-header-base;

  &--primary { background: $header-primary-bg; border-color: $header-primary-border; }
  &--sound   { background: $header-sound-bg;   border-color: $header-sound-border; }
  &--both    { background: $header-both-bg;     border-color: $header-both-border; }
}

.drag-handle {
  width: 14px;
  height: 14px;
  flex-shrink: 0;
  color: $text-disabled;
  cursor: grab;
  user-select: none;

  &:hover { color: $text-ghost; }
}

.label {
  font-size: $font-size-sm;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: $text-muted;
  cursor: pointer;

  &:hover { color: $text-primary; }
}

.label-input {
  font-size: $font-size-sm;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: $text-primary;
  background: $border-input;
  border: 1px solid $border-focus;
  border-radius: $radius-sm;
  padding: 0 $space-2;
  outline: none;
  width: 90px;
}

.header-actions {
  @include flex-row($gap: 1px);
  margin-left: auto;
}

.remove-btn {
  @include flex-center;
  background: none;
  border: none;
  cursor: pointer;
  padding: 0 $space-1;
  color: $text-disabled;
  transition: color $t-fast;

  &:hover { color: $color-danger; }
}

.remove-icon {
  width: 13px;
  height: 13px;
}
</style>
