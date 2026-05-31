<script setup>
import { ref } from 'vue'
import CaretDownIcon from './icons/CaretDownIcon.vue'
import PlusIcon from './icons/PlusIcon.vue'
import { useClickOutside } from '@/composables/useClickOutside'

const props = defineProps({
  panelCount: { type: Number, default: 1 },
})

const emit = defineEmits(['add-panel'])

const menuOpen = ref(false)
const rootEl   = ref(null)

useClickOutside(rootEl, () => { menuOpen.value = false })
</script>

<template>
  <div ref="rootEl" class="menu-root">
    <button class="btn btn--sm menu-btn" :class="{ open: menuOpen }" @click="menuOpen = !menuOpen">
      File <CaretDownIcon class="menu-caret" />
    </button>
    <div v-if="menuOpen" class="dropdown">
      <button
        class="dropdown-item"
        :disabled="panelCount >= 9"
        @click="emit('add-panel'); menuOpen = false"
      >
        <PlusIcon class="item-icon" /> Add panel
        <span class="item-hint">{{ panelCount }} / 9</span>
      </button>
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
  min-width: 180px;
  z-index: $z-menu;
}
</style>
