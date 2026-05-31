<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import SettingsIcon from './icons/SettingsIcon.vue'

const props = defineProps({
  isPrimary: { type: Boolean, default: false },
  hasSound:  { type: Boolean, default: false },
  offset:    { type: Number,  default: 0 },
})

const emit = defineEmits(['set-primary', 'set-sound', 'update:offset'])

const settingsOpen = ref(false)
const rootEl = ref(null)

function onDocClick(e) {
  if (rootEl.value && !rootEl.value.contains(e.target)) settingsOpen.value = false
}

onMounted(()   => document.addEventListener('mousedown', onDocClick))
onUnmounted(() => document.removeEventListener('mousedown', onDocClick))
</script>

<template>
  <div ref="rootEl" class="settings-root">
    <button
      class="settings-btn" :class="{ open: settingsOpen }"
      title="Panel settings"
      @click="settingsOpen = !settingsOpen"
    >
      <SettingsIcon class="settings-icon" />
    </button>
    <div v-if="settingsOpen" class="settings-dropdown">
      <div class="settings-row">
        <span class="settings-label">Primary</span>
        <button
          class="badge-btn primary-btn" :class="{ active: isPrimary }"
          @click="emit('set-primary')"
        >{{ isPrimary ? 'active' : 'set' }}</button>
      </div>
      <div class="settings-row">
        <span class="settings-label">Audio</span>
        <button
          class="badge-btn sound-btn" :class="{ active: hasSound }"
          @click="emit('set-sound')"
        >{{ hasSound ? 'active' : 'set' }}</button>
      </div>
      <div class="settings-row settings-row--offset">
        <span class="settings-label">Offset (s)</span>
        <input
          type="number" class="settings-offset-input"
          :value="offset" step="0.1"
          :disabled="isPrimary"
          @change="emit('update:offset', parseFloat($event.target.value))"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
.settings-root {
  position: relative;
}

.settings-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  background: none;
  border: none;
  cursor: pointer;
  padding: 2px 3px;
  color: #555;
  border-radius: 3px;
  transition: color 0.15s, background 0.15s;
}
.settings-btn:hover { color: #aaa; background: #2a2a2a; }
.settings-btn.open  { color: #ccc; background: #2a2a2a; }

.settings-icon {
  width: 14px;
  height: 14px;
}

.settings-dropdown {
  position: absolute;
  top: calc(100% + 6px);
  right: 0;
  min-width: 170px;
  background: #222;
  border: 1px solid #3a3a3a;
  border-radius: 6px;
  padding: 6px;
  z-index: 50;
  box-shadow: 0 6px 20px rgba(0,0,0,0.55);
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.settings-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 5px 8px;
  border-radius: 4px;
  gap: 12px;
}
.settings-row:hover { background: #2a2a2a; }

.settings-label {
  font-size: 12px;
  color: #888;
}

.badge-btn {
  font-size: 9px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  padding: 2px 5px;
  border-radius: 3px;
  cursor: pointer;
  line-height: 1;
  transition: opacity 0.15s, background 0.15s, color 0.15s;
}

.primary-btn {
  background: #1a2a3a;
  border: 1px solid #1e3a5a;
  color: #3a7ab0;
  opacity: 0.5;
}
.primary-btn:hover  { opacity: 0.85; }
.primary-btn.active { background: #1a3a6a; border-color: #2a5a9a; color: #6ab0ff; opacity: 1; }

.sound-btn {
  background: #1e2a1e;
  border: 1px solid #2a3a2a;
  color: #4a7a4a;
  opacity: 0.5;
}
.sound-btn:hover  { opacity: 0.85; }
.sound-btn.active { background: #1a3a1a; border-color: #2a6a2a; color: #6abf6a; opacity: 1; }

.settings-offset-input {
  width: 68px;
  background: #2c2c2c;
  border: 1px solid #3a3a3a;
  border-radius: 4px;
  color: #e8e8e8;
  font-size: 12px;
  padding: 3px 6px;
  text-align: right;
  outline: none;
  -moz-appearance: textfield;
}
.settings-offset-input:focus { border-color: #555; }
.settings-offset-input:disabled { opacity: 0.35; cursor: not-allowed; }
.settings-offset-input::-webkit-outer-spin-button,
.settings-offset-input::-webkit-inner-spin-button { -webkit-appearance: none; }
</style>
