<script setup lang="ts">
defineProps<{ title: string; desc?: string }>()
</script>

<template>
  <div
    v-motion
    class="card"
    :initial="{ opacity: 0, y: 28 }"
    :enter="{ opacity: 1, y: 0, transition: { duration: 460 } }"
  >
    <header class="card__header">
      <h2>{{ title }}</h2>
      <p v-if="desc">{{ desc }}</p>
    </header>

    <slot />

    <footer v-if="$slots.footer" class="card__footer">
      <slot name="footer" />
    </footer>
  </div>
</template>

<style scoped>
.card {
  width: 100%;
  max-width: 440px;
  padding: 38px 36px 30px;
  border-radius: var(--tl-radius);
  background: #fff;
  box-shadow: 0 24px 60px rgba(30, 58, 138, 0.12);
}

.card__header h2 {
  margin: 0 0 8px;
  font-size: 26px;
}

.card__header p {
  margin: 0 0 26px;
  color: var(--tl-muted);
  font-size: 14px;
}

.card__footer {
  margin-top: 18px;
  font-size: 14px;
  color: var(--tl-muted);
  text-align: center;
}

/* 插槽内容由父组件渲染，scoped 样式命中不到，需要用 :deep 穿透 */
.card__footer :deep(a) {
  margin-left: 6px;
  font-weight: 600;
}
</style>
