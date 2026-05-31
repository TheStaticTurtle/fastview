<script setup>
import { ref } from 'vue'
import SetupPage from './components/SetupPage.vue'
import PlayerPage from './components/PlayerPage.vue'

const phase   = ref('setup')
const configs = ref([])

function onLaunch(cfg) {
  configs.value = cfg
  phase.value = 'player'
}
</script>

<template>
  <SetupPage v-if="phase === 'setup'" @launch="onLaunch" />
  <PlayerPage v-else :configs="configs" @back="phase = 'setup'" />
</template>
