<script setup>
import { ref } from 'vue'

const emit = defineEmits(['seek'])

const gotoValue = ref('')

function parseGoto(str) {
  const s = str.trim()
  if (!s) return null
  const parts = s.split(':').map(Number)
  if (parts.some(isNaN)) return null
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2]
  if (parts.length === 2) return parts[0] * 60 + parts[1]
  return parts[0]
}

function onCommit() {
  const t = parseGoto(gotoValue.value)
  if (t !== null) emit('seek', t)
  gotoValue.value = ''
}
</script>

<template>
  <input
    class="goto-input"
    v-model="gotoValue"
    placeholder="go to…"
    @keydown.enter="onCommit"
    @blur="onCommit"
  />
</template>

<style scoped lang="scss">
.goto-input {
  @include input-base;
  width: 72px;
  font-size: $font-size-md;
  padding: 3px 7px;
  font-variant-numeric: tabular-nums;
}
</style>
