<script setup>
import { ref } from 'vue'
import CaretDownIcon from './icons/CaretDownIcon.vue'
import { useClickOutside } from '@/composables/useClickOutside'

const props = defineProps({
  showTimecode: { type: Boolean, default: true },
})

const emit = defineEmits(['update:showTimecode'])

const menuOpen = ref(false)
const rootEl   = ref(null)

useClickOutside(rootEl, () => { menuOpen.value = false })
</script>

<template>
  <div ref="rootEl" class="menu-root">
    <button class="btn btn--sm menu-btn" :class="{ open: menuOpen }" @click="menuOpen = !menuOpen">
      View <CaretDownIcon class="menu-caret" />
    </button>
    <div v-if="menuOpen" class="dropdown">
      <label class="dropdown-item dropdown-item--check">
        <input
          type="checkbox"
          :checked="showTimecode"
          @change="emit('update:showTimecode', $event.target.checked)"
        />
        Show timecode
      </label>
    </div>
  </div>
</template>

<style scoped lang="scss">
.menu-root {
  position: relative;
}

.menu-btn {
  @include flex-row($gap: $space-2);

  &.open {
    background: $border-control;
    color: $text-primary;
  }
}

.menu-caret {
  width: $space-8;
  height: $space-8;
  opacity: 0.6;
  flex-shrink: 0;
}

.dropdown {
  top: calc(100% + $space-2);
  left: 0;
  min-width: 160px;
  z-index: $z-menu;
}

.dropdown-item--check {
  display: flex;
  align-items: center;
  gap: $space-3;
  cursor: pointer;
  user-select: none;

  input[type='checkbox'] {
    accent-color: $accent;
    width: 14px;
    height: 14px;
    flex-shrink: 0;
  }
}
</style>
