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

<style scoped>
.goto-input {
  width: 72px;
  background: #222;
  border: 1px solid #333;
  border-radius: 4px;
  color: #aaa;
  font-size: 11px;
  padding: 3px 7px;
  outline: none;
  font-variant-numeric: tabular-nums;
}
.goto-input::placeholder { color: #444; }
.goto-input:focus { border-color: #555; color: #e8e8e8; }
</style>
