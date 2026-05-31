<script setup>
import AppIcon from '@/components/icons/AppIcon.vue'

const emit = defineEmits(['close'])

const GIT_HASH = __GIT_HASH__
const PROJECT_URL = __PROJECT_URL__
const LICENSE = __LICENSE__
const DESCRIPTION = __DESCRIPTION__
</script>

<template>
  <Teleport to="body">
    <div class="modal-backdrop" @click.self="emit('close')">
      <div class="modal">
        <div class="modal-header">
          <span class="modal-title">How to use</span>
          <button class="btn btn--icon close-btn" @click="emit('close')">✕</button>
        </div>

        <div class="modal-body">
          <div class="app-identity">
            <AppIcon style="width:72px;height:72px;padding:2px" />
            <span class="app-name">FastView</span>
            <span class="app-description">{{ DESCRIPTION }}</span>
          </div>

          <section>
            <h3>Loading videos</h3>
            <p>Click the empty panel area, or drag &amp; drop a video file onto it to load a video. Double-click a loaded panel to replace its video. Each panel holds one video file.</p>
          </section>

          <section>
            <h3>Adding &amp; removing panels</h3>
            <p>Use <strong>File → Add panel</strong> to add up to 9 panels. Click the <strong>✕</strong> button in a panel's header to remove it.</p>
          </section>

          <section>
            <h3>Primary &amp; sound</h3>
            <p>One panel is the <em>primary</em> — it acts as the clock source for sync. Click <strong>Primary</strong> in a panel header to promote that panel. Click <strong>Sound</strong> to choose which panel's audio plays.</p>
          </section>

          <section>
            <h3>Offsets</h3>
            <p>Each non-primary panel has a time offset (seconds). Open a panel's settings gear and adjust the offset so that side videos align with the primary timeline.</p>
          </section>

          <section>
            <h3>Playback controls</h3>
            <p>Use the transport bar at the bottom to play/pause and seek. The skip buttons jump −30s, −10s, −5s / +5s, +10s, +30s. The <em>Go to…</em> input lets you type a timestamp to seek to.</p>
          </section>

          <section>
            <h3>Magnifier</h3>
            <p>Toggle <strong>Zoom</strong> in the transport bar. While active, hover over any panel to see a magnified circle. Adjust the zoom level and radius with the sliders.</p>
          </section>

          <section>
            <h3>Reordering panels</h3>
            <p>Drag a panel by its header to reorder it within the grid.</p>
          </section>

          <section>
            <h3>Layout export / import</h3>
            <p>Use <strong>File → Export layout</strong> to save panel names and offsets to a JSON file. Use <strong>Import layout</strong> to restore a saved layout (video files must be re-loaded manually).</p>
          </section>

          <div class="divider" />

          <section class="about">
            <div class="about-row">
              <span class="about-label">Project</span>
              <a :href="PROJECT_URL" target="_blank" rel="noopener" class="about-link">fastview</a>
            </div>
            <div class="about-row">
              <span class="about-label">Commit</span>
              <span class="about-mono">{{ GIT_HASH }}</span>
            </div>
            <div class="about-row">
              <span class="about-label">License</span>
              <span>{{ LICENSE }}</span>
            </div>
          </section>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped lang="scss">
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 200;
}

.modal {
  background: $bg-overlay;
  border: 1px solid $border-control;
  border-radius: $radius-lg;
  box-shadow: $shadow-dropdown;
  width: 480px;
  max-width: calc(100vw - #{$space-8 * 2});
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.modal-header {
  @include flex-row;
  justify-content: space-between;
  padding: $space-6 $space-8;
  border-bottom: 1px solid $border-subtle;
  flex-shrink: 0;
}

.modal-title {
  font-size: $font-size-lg;
  font-weight: 600;
  color: $text-primary;
}

.app-identity {
  @include flex-center;
  flex-direction: column;
  gap: $space-4;
  padding: $space-6 0;
}

.app-description {
  font-size: $font-size-md;
  color: $text-muted;
  text-align: center;
}

.app-name {
  font-size: 1.5rem;
  font-weight: 700;
  color: $text-primary;
  letter-spacing: 0.04em;
}

.close-btn {
  width: 24px;
  height: 24px;
  font-size: $font-size-base;
  line-height: 1;
  color: $text-muted;

  &:hover { color: $text-primary; }
}

.modal-body {
  overflow-y: auto;
  padding: $space-6 $space-8;
  display: flex;
  flex-direction: column;
  gap: $space-6;
}

section {
  display: flex;
  flex-direction: column;
  gap: $space-2;
}

h3 {
  font-size: $font-size-base;
  font-weight: 600;
  color: $text-primary;
  margin: 0;
}

p {
  font-size: $font-size-md;
  color: $text-secondary;
  margin: 0;
  line-height: 1.5;

  strong, em {
    color: $text-primary;
  }
}

.divider {
  height: 1px;
  background: $border-subtle;
  margin: $space-2 0;
}

.about {
  gap: $space-3;
}

.about-row {
  @include flex-row($gap: $space-6);
  font-size: $font-size-md;
  color: $text-secondary;
}

.about-label {
  color: $text-faint;
  width: 52px;
  flex-shrink: 0;
}

.about-link {
  color: $accent;
  text-decoration: none;

  &:hover { text-decoration: underline; }
}

.about-mono {
  font-family: monospace;
  font-size: $font-size-sm;
  color: $text-muted;
}
</style>
