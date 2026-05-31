<script setup>
import PlayIcon from '../icons/PlayIcon.vue'
import PauseIcon from '../icons/PauseIcon.vue'
import MinusIcon from '../icons/MinusIcon.vue'
import PlusIcon from '../icons/PlusIcon.vue'

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

<style scoped lang="scss">
.btn-row {
  @include flex-row($gap: $space-4);
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
}

.skip-btn {
  @include flex-row;
  justify-content: center;
  gap: 1px;
  min-width: 52px;
}

.skip-icon {
  width: 14px;
  height: 14px;
  flex-shrink: 0;
}

.play-btn {
  @include flex-center;
  background: $accent-btn-bg;
  border-color: $accent-btn-border;
  color: #fff;
  width: 48px;
  height: 36px;
  padding: 0;

  &:hover { background: $accent-btn-hover; }
  &:disabled { opacity: 0.35; cursor: not-allowed; }
}

.play-icon {
  width: 22px;
  height: 22px;
}
</style>
