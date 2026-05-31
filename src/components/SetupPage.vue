<script setup>
import { ref, watch } from 'vue'

const emit = defineEmits(['launch'])

const count = ref(3)

function makeConfig(i) {
  const defaults = ['Left', 'Centre', 'Right']
  return {
    id: i,
    name: defaults[i] ?? `Camera ${i + 1}`,
    order: i + 1,
    isPrimary: i === 1,
    hasSound:  i === 1,
  }
}

const configs = ref(Array.from({ length: 3 }, (_, i) => makeConfig(i)))

watch(count, (n, prev) => {
  if (n > prev) {
    for (let i = prev; i < n; i++) configs.value.push(makeConfig(i))
  } else {
    configs.value = configs.value.slice(0, n)
    if (!configs.value.some(c => c.isPrimary)) configs.value[0].isPrimary = true
    if (!configs.value.some(c => c.hasSound))  configs.value[0].hasSound  = true
  }
})

function setPrimary(id) { configs.value.forEach(c => { c.isPrimary = c.id === id }) }
function setSound(id)   { configs.value.forEach(c => { c.hasSound  = c.id === id }) }

function launch() {
  const sorted = [...configs.value].sort((a, b) => a.order - b.order)
  emit('launch', sorted)
}
</script>

<template>
  <div class="setup">
    <div class="card">
      <h1 class="title">Multi-Video Player</h1>

      <div class="section">
        <div class="section-label">Number of videos</div>
        <div class="count-grid">
          <button
            v-for="n in 9" :key="n"
            class="count-btn" :class="{ active: count === n }"
            @click="count = n"
          >{{ n }}</button>
        </div>
      </div>

      <div class="section">
        <div class="section-label">Configure videos</div>
        <table class="cfg-table">
          <thead>
            <tr>
              <th>Order</th>
              <th>Display name</th>
              <th>Primary <span class="th-hint">(sync master)</span></th>
              <th>Sound</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="c in configs" :key="c.id">
              <td>
                <input type="number" class="order-input"
                  v-model.number="c.order" min="1" :max="count" />
              </td>
              <td>
                <input type="text" class="name-input" v-model="c.name" />
              </td>
              <td class="td-center">
                <input type="radio" name="primary"
                  :checked="c.isPrimary" @change="setPrimary(c.id)" />
              </td>
              <td class="td-center">
                <input type="radio" name="sound"
                  :checked="c.hasSound" @change="setSound(c.id)" />
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <button class="launch-btn" @click="launch">Start →</button>
    </div>
  </div>
</template>

<style scoped>
.setup {
  min-height: 100vh;
  background: #0f0f0f;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  font-family: system-ui, sans-serif;
  color: #e8e8e8;
}

.card {
  background: #1a1a1a;
  border: 1px solid #2e2e2e;
  border-radius: 10px;
  padding: 32px 36px;
  width: 100%;
  max-width: 680px;
  display: flex;
  flex-direction: column;
  gap: 28px;
}

.title {
  font-size: 22px;
  font-weight: 600;
  color: #fff;
  text-align: center;
  margin: 0;
}

.section {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.section-label {
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.07em;
  color: #888;
}

.count-grid {
  display: grid;
  grid-template-columns: repeat(9, 1fr);
  gap: 6px;
}

.count-btn {
  background: #2a2a2a;
  border: 1px solid #3a3a3a;
  border-radius: 6px;
  color: #ccc;
  font-size: 15px;
  font-weight: 500;
  padding: 8px 0;
  cursor: pointer;
  transition: background 0.12s, color 0.12s, border-color 0.12s;
  text-align: center;
}
.count-btn:hover  { background: #333; color: #fff; }
.count-btn.active { background: #1a5fb4; border-color: #2a7ad4; color: #fff; }

.cfg-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}
.cfg-table th {
  text-align: left;
  padding: 6px 8px;
  font-weight: 500;
  color: #777;
  border-bottom: 1px solid #2e2e2e;
  font-size: 12px;
}
.th-hint { font-weight: 400; color: #555; font-size: 11px; }
.cfg-table td { padding: 7px 8px; border-bottom: 1px solid #222; }
.cfg-table tr:last-child td { border-bottom: none; }
.td-center { text-align: center; }

.order-input {
  width: 54px;
  background: #242424;
  border: 1px solid #3a3a3a;
  border-radius: 4px;
  color: #e8e8e8;
  font-size: 13px;
  padding: 4px 6px;
  text-align: center;
  outline: none;
  -moz-appearance: textfield;
}
.order-input::-webkit-outer-spin-button,
.order-input::-webkit-inner-spin-button { -webkit-appearance: none; }

.name-input {
  background: #242424;
  border: 1px solid #3a3a3a;
  border-radius: 4px;
  color: #e8e8e8;
  font-size: 13px;
  padding: 4px 8px;
  outline: none;
  width: 100%;
}
.name-input:focus, .order-input:focus { border-color: #555; }

.cfg-table input[type="radio"] {
  accent-color: #4a9eff;
  width: 15px;
  height: 15px;
  cursor: pointer;
}

.launch-btn {
  background: #1a5fb4;
  border: 1px solid #2a7ad4;
  border-radius: 7px;
  color: #fff;
  font-size: 15px;
  font-weight: 600;
  padding: 12px;
  cursor: pointer;
  transition: background 0.15s;
  align-self: stretch;
}
.launch-btn:hover { background: #2270cc; }
</style>
