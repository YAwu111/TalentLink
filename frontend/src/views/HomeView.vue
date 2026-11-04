<script setup>
import { onMounted, ref } from 'vue'
import http from '@/api/http'

const status = ref('checking')
const info = ref(null)

onMounted(async () => {
  try {
    info.value = await http.get('/health')
    status.value = 'ok'
  } catch {
    status.value = 'error'
  }
})
</script>

<template>
  <div class="boot">
    <el-card class="boot__card" shadow="never">
      <h1 class="boot__title">TalentLink</h1>
      <p class="boot__subtitle">网上招聘系统的设计与实现 · 编号 020</p>

      <el-descriptions :column="1" border class="boot__desc">
        <el-descriptions-item label="前端">Vue 3 + Vite + Element Plus</el-descriptions-item>
        <el-descriptions-item label="后端">FastAPI + SQLAlchemy</el-descriptions-item>
        <el-descriptions-item label="接口连通">
          <el-tag v-if="status === 'ok'" type="success">正常</el-tag>
          <el-tag v-else-if="status === 'error'" type="danger">失败</el-tag>
          <el-tag v-else type="info">检测中</el-tag>
        </el-descriptions-item>
        <el-descriptions-item v-if="info" label="服务">
          {{ info.app }} v{{ info.version }}
        </el-descriptions-item>
      </el-descriptions>
    </el-card>
  </div>
</template>

<style scoped>
.boot {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f5f7fa;
  padding: 24px;
}

.boot__card {
  width: 100%;
  max-width: 560px;
  border-radius: 12px;
}

.boot__title {
  margin: 0;
  font-size: 28px;
  color: #303133;
}

.boot__subtitle {
  margin: 8px 0 24px;
  color: #909399;
}

.boot__desc :deep(.el-descriptions__label) {
  width: 96px;
}
</style>
