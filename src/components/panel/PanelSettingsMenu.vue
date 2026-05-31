<script setup>
import { ref } from 'vue'
import SettingsIcon from '../icons/SettingsIcon.vue'
import { useClickOutside } from '@/composables/useClickOutside'

const props = defineProps({
  isPrimary: { type: Boolean, default: false },
  hasSound:  { type: Boolean, default: false },
  offset:    { type: Number,  default: 0 },
})

const emit = defineEmits(['set-primary', 'set-sound', 'update:offset'])

const settingsOpen = ref(false)
const rootEl = ref(null)

useClickOutside(rootEl, () => { settingsOpen.value = false })

</script>

<template>
  <div ref="rootEl" class="settings-root">
    <button
      class="btn--icon settings-btn" :class="{ open: settingsOpen }"
      title="Panel settings"
      @click="settingsOpen = !settingsOpen"
    >
      <SettingsIcon class="settings-icon" />
    </button>
    <div v-if="settingsOpen" class="dropdown dropdown--settings">
      <div class="dropdown-row">
        <span class="row-label">Primary</span>
        <button
          class="badge-btn badge-btn--primary" :class="{ active: isPrimary }"
          @click="emit('set-primary')"
        >{{ isPrimary ? 'active' : 'set' }}</button>
      </div>
      <div class="dropdown-row">
        <span class="row-label">Audio</span>
        <button
          class="badge-btn badge-btn--sound" :class="{ active: hasSound }"
          @click="emit('set-sound')"
        >{{ hasSound ? 'active' : 'set' }}</button>
      </div>
      <div class="dropdown-row">
        <span class="row-label">Offset (s)</span>
        <input
          type="number" class="offset-input"
          :value="offset" step="0.1"
          :disabled="isPrimary"
          @change="emit('update:offset', parseFloat($event.target.value))"
        />
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.settings-root {
  position: relative;
}

.settings-btn {
  padding: $space-1 3px;
  color: $text-disabled;

  &:hover { color: $text-muted; background: $border-subtle; }
  &.open  { color: $text-secondary; background: $border-subtle; }
}

.settings-icon {
  width: 14px;
  height: 14px;
}

.dropdown--settings {
  top: calc(100% + $space-3);
}

.offset-input {
  @include input-number-clean;
  width: 68px;
  font-size: $font-size-base;
  padding: 3px $space-3;
}
</style>
