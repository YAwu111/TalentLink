<script setup lang="ts">
import AuthBrandPanel from './AuthBrandPanel.vue'

withDefaults(defineProps<{ subtitle?: string }>(), {
  subtitle: '把合适的人，送到合适的岗位',
})
</script>

<template>
  <div class="auth-shell">
    <AuthBrandPanel :subtitle="subtitle" />

    <section class="panel">
      <slot />
    </section>
  </div>
</template>

<style scoped>
.auth-shell {
  min-height: 100vh;
  display: grid;
  grid-template-columns: 1.05fr 1fr;
}

.panel {
  display: grid;
  place-items: center;
  padding: 40px 24px;
}

@media (max-width: 960px) {
  .auth-shell {
    grid-template-columns: 1fr;
  }
}
</style>
