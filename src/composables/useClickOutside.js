import { onMounted, onUnmounted } from 'vue'

export function useClickOutside(elRef, cb) {
  const handler = e => { if (!elRef.value?.contains(e.target)) cb() }
  onMounted(()   => document.addEventListener('mousedown', handler))
  onUnmounted(() => document.removeEventListener('mousedown', handler))
}
