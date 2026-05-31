<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import CaretDownIcon from './icons/CaretDownIcon.vue'
import PlusIcon from './icons/PlusIcon.vue'

const props = defineProps({
  panelCount: { type: Number, default: 1 },
})

const emit = defineEmits(['add-panel'])

const menuOpen = ref(false)
const rootEl   = ref(null)

function onDocClick(e) {
  if (rootEl.value && !rootEl.value.contains(e.target)) menuOpen.value = false
}

onMounted(()   => document.addEventListener('mousedown', onDocClick))
onUnmounted(() => document.removeEventListener('mousedown', onDocClick))
</script>

<template>
  <div ref="rootEl" class="menu-root">
    <button class="btn menu-btn" :class="{ open: menuOpen }" @click="menuOpen = !menuOpen">
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

<style scoped>
.menu-root {
  position: relative;
}

.btn {
  background: #2c2c2c;
  color: #ccc;
  border: 1px solid #3a3a3a;
  border-radius: 5px;
  cursor: pointer;
  font-size: 12px;
  padding: 4px 10px;
  transition: background 0.12s, color 0.12s;
  white-space: nowrap;
}
.btn:hover    { background: #3a3a3a; color: #fff; }
.btn:disabled { opacity: 0.35; cursor: not-allowed; }

.menu-btn {
  display: flex;
  align-items: center;
  gap: 4px;
}
.menu-btn.open {
  background: #3a3a3a;
  color: #fff;
}

.menu-caret {
  width: 16px;
  height: 16px;
  opacity: 0.6;
  flex-shrink: 0;
}

.dropdown {
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  min-width: 180px;
  background: #222;
  border: 1px solid #3a3a3a;
  border-radius: 6px;
  padding: 4px;
  z-index: 100;
  box-shadow: 0 6px 20px rgba(0,0,0,0.5);
}

.dropdown-item {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  background: none;
  border: none;
  border-radius: 4px;
  color: #ccc;
  font-size: 13px;
  padding: 6px 10px;
  cursor: pointer;
  text-align: left;
  transition: background 0.1s, color 0.1s;
}
.dropdown-item:hover:not(:disabled) { background: #333; color: #fff; }
.dropdown-item:disabled { opacity: 0.4; cursor: not-allowed; }

.item-icon {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
  color: #888;
}

.item-hint {
  margin-left: auto;
  font-size: 11px;
  color: #555;
  font-variant-numeric: tabular-nums;
}
</style>
