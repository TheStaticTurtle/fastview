<script setup>
import PlayIcon from './icons/PlayIcon.vue'
import PauseIcon from './icons/PauseIcon.vue'
import MinusIcon from './icons/MinusIcon.vue'
import PlusIcon from './icons/PlusIcon.vue'

defineProps({
  isPlaying: { type: Boolean, default: false },
  canPlay:   { type: Boolean, default: false },
})

const emit = defineEmits(['toggle-play', 'skip'])
</script>

<template>
  <div class="btn-row">
    <button class="btn skip-btn" @click="emit('skip', -30)"><MinusIcon class="skip-icon" />30s</button>
    <button class="btn skip-btn" @click="emit('skip', -10)"><MinusIcon class="skip-icon" />10s</button>
    <button class="btn skip-btn" @click="emit('skip', -5)"><MinusIcon class="skip-icon" />5s</button>
    <button class="btn play-btn" :disabled="!canPlay" @click="emit('toggle-play')">
      <PauseIcon v-if="isPlaying" class="play-icon" />
      <PlayIcon v-else class="play-icon" />
    </button>
    <button class="btn skip-btn" @click="emit('skip', 5)"><PlusIcon class="skip-icon" />5s</button>
    <button class="btn skip-btn" @click="emit('skip', 10)"><PlusIcon class="skip-icon" />10s</button>
    <button class="btn skip-btn" @click="emit('skip', 30)"><PlusIcon class="skip-icon" />30s</button>
  </div>
</template>

<style scoped>
.btn-row {
  display: flex;
  align-items: center;
  gap: 8px;
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
}

.btn {
  background: #2c2c2c;
  color: #ccc;
  border: 1px solid #3a3a3a;
  border-radius: 5px;
  cursor: pointer;
  font-size: 13px;
  padding: 5px 12px;
  transition: background 0.12s, color 0.12s;
  white-space: nowrap;
}
.btn:hover  { background: #3a3a3a; color: #fff; }
.btn:active { background: #444; }

.skip-btn {
  min-width: 52px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1px;
}

.skip-icon {
  width: 14px;
  height: 14px;
  flex-shrink: 0;
}

.play-btn {
  background: #1a5fb4;
  border-color: #2a7ad4;
  color: #fff;
  width: 48px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
}

.play-icon {
  width: 22px;
  height: 22px;
}
.play-btn:hover    { background: #2270cc; }
.play-btn:disabled { opacity: 0.35; cursor: not-allowed; }
</style>
