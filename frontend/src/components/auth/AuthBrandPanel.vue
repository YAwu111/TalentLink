<script setup lang="ts">
withDefaults(
  defineProps<{
    title?: string
    subtitle?: string
    points?: string[]
  }>(),
  {
    title: 'TalentLink',
    subtitle: '把合适的人，送到合适的岗位',
    points: () => [
      '简历解析与岗位智能匹配',
      '企业与求职者双向推送',
      '招聘数据可视化看板',
    ],
  },
)
</script>

<template>
  <section class="brand">
    <div class="brand__glow" />

    <div
      v-motion
      :initial="{ opacity: 0, y: -16 }"
      :enter="{ opacity: 1, y: 0, transition: { duration: 500 } }"
    >
      <div class="brand__logo">T</div>
      <h1 class="brand__title">{{ title }}</h1>
      <p class="brand__subtitle">{{ subtitle }}</p>
    </div>

    <ul class="brand__points">
      <li
        v-for="(item, index) in points"
        :key="item"
        v-motion
        :initial="{ opacity: 0, x: -24 }"
        :enter="{ opacity: 1, x: 0, transition: { delay: 200 + index * 120, duration: 420 } }"
      >
        {{ item }}
      </li>
    </ul>
  </section>
</template>

<style scoped>
.brand {
  position: relative;
  overflow: hidden;
  padding: 64px 56px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 48px;
  color: #eef2ff;
  background: linear-gradient(150deg, #1e3a8a 0%, #1d4ed8 55%, #0ea5e9 100%);
}

.brand__glow {
  position: absolute;
  width: 420px;
  height: 420px;
  right: -140px;
  top: -120px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(255, 255, 255, 0.24), transparent 68%);
  filter: blur(6px);
}

.brand__logo {
  width: 56px;
  height: 56px;
  border-radius: 16px;
  display: grid;
  place-items: center;
  font-size: 28px;
  font-weight: 700;
  background: rgba(255, 255, 255, 0.16);
  border: 1px solid rgba(255, 255, 255, 0.3);
  backdrop-filter: blur(6px);
}

.brand__title {
  margin: 24px 0 8px;
  font-size: 40px;
  letter-spacing: 1px;
}

.brand__subtitle {
  margin: 0;
  font-size: 16px;
  color: rgba(238, 242, 255, 0.82);
}

.brand__points {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 16px;
  font-size: 15px;
  color: rgba(238, 242, 255, 0.9);
}

.brand__points li::before {
  content: '';
  display: inline-block;
  width: 8px;
  height: 8px;
  margin-right: 12px;
  border-radius: 50%;
  background: #67e8f9;
  box-shadow: 0 0 12px rgba(103, 232, 249, 0.8);
}

@media (max-width: 960px) {
  .brand {
    display: none;
  }
}
</style>
