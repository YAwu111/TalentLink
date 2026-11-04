<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { SwitchButton } from '@element-plus/icons-vue'
import { ElMessageBox } from 'element-plus'

import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const router = useRouter()

const ROLE_LABEL: Record<string, string> = {
  seeker: '求职者',
  employer: '企业',
  admin: '系统管理员',
}

/** 档案字段的中文名，缺省回退到原始 key，避免后台新增字段时界面上露出英文 */
const PROFILE_LABEL: Record<string, string> = {
  name: '名称',
  gender: '性别',
  age: '年龄',
  birth_date: '出生日期',
  phone: '联系电话',
  email: '邮箱',
  household: '户籍所在地',
  education: '学历',
  major: '专业',
  degree: '学位',
  school: '毕业院校',
  skills: '业务技能',
  address: '企业地址',
  industry: '所属行业',
  intro: '企业简介',
  verified: '是否认证',
}

const roleLabel = computed(() => (auth.role ? ROLE_LABEL[auth.role] : ''))

const profileEntries = computed(() =>
  Object.entries(auth.user?.profile ?? {}).map(([key, value]) => ({
    key,
    label: PROFILE_LABEL[key] ?? key,
    text:
      typeof value === 'boolean'
        ? value
          ? '是'
          : '否'
        : typeof value === 'string' && value.trim()
          ? value
          : '—',
  })),
)

const nextSteps = [
  '岗位发布与检索（企业侧）',
  '简历投递与状态流转（求职者侧）',
  '简历解析与智能匹配（双向推送）',
  '管理员驾驶舱与测试台',
]

async function handleLogout() {
  try {
    await ElMessageBox.confirm('确定要退出登录吗？', '提示', {
      confirmButtonText: '退出',
      cancelButtonText: '取消',
      type: 'warning',
    })
  } catch {
    // 用户取消：ElMessageBox 以 reject 表示取消，直接返回
    return
  }
  await auth.logout()
  await router.replace({ name: 'login' })
}
</script>

<template>
  <div class="home">
    <header class="topbar">
      <div class="topbar__brand">
        <span class="topbar__logo">T</span>
        <span class="topbar__name">TalentLink</span>
      </div>

      <div class="topbar__user">
        <el-tag effect="dark" round>{{ roleLabel }}</el-tag>
        <span class="topbar__username">{{ auth.displayName }}</span>
        <el-button text :icon="SwitchButton" @click="handleLogout">退出</el-button>
      </div>
    </header>

    <main class="content">
      <section
        v-motion
        class="welcome"
        :initial="{ opacity: 0, y: 20 }"
        :enter="{ opacity: 1, y: 0, transition: { duration: 420 } }"
      >
        <h1>你好，{{ auth.displayName }}</h1>
        <p>登录成功。当前账号已完成认证，可以开始使用系统。</p>
      </section>

      <el-row :gutter="20">
        <el-col :xs="24" :md="14">
          <el-card
            v-motion
            shadow="never"
            class="panel"
            :initial="{ opacity: 0, y: 24 }"
            :enter="{ opacity: 1, y: 0, transition: { delay: 90, duration: 420 } }"
          >
            <template #header>
              <span class="panel__title">账号信息</span>
            </template>
            <el-descriptions :column="1" border>
              <el-descriptions-item label="用户名">
                {{ auth.user?.username }}
              </el-descriptions-item>
              <el-descriptions-item label="角色">{{ roleLabel }}</el-descriptions-item>
              <el-descriptions-item
                v-for="item in profileEntries"
                :key="item.key"
                :label="item.label"
              >
                {{ item.text }}
              </el-descriptions-item>
            </el-descriptions>
          </el-card>
        </el-col>

        <el-col :xs="24" :md="10">
          <el-card
            v-motion
            shadow="never"
            class="panel"
            :initial="{ opacity: 0, y: 24 }"
            :enter="{ opacity: 1, y: 0, transition: { delay: 180, duration: 420 } }"
          >
            <template #header>
              <span class="panel__title">接下来的模块</span>
            </template>
            <ul class="steps">
              <li v-for="item in nextSteps" :key="item">{{ item }}</li>
            </ul>
          </el-card>
        </el-col>
      </el-row>
    </main>
  </div>
</template>

<style scoped>
.home {
  min-height: 100vh;
  background: var(--tl-bg);
}

.topbar {
  height: 64px;
  padding: 0 28px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #fff;
  box-shadow: 0 1px 0 rgba(15, 23, 42, 0.06);
}

.topbar__brand {
  display: flex;
  align-items: center;
  gap: 10px;
  font-weight: 700;
  font-size: 18px;
}

.topbar__logo {
  width: 32px;
  height: 32px;
  border-radius: 10px;
  display: grid;
  place-items: center;
  color: #fff;
  background: linear-gradient(140deg, #1d4ed8, #0ea5e9);
}

.topbar__user {
  display: flex;
  align-items: center;
  gap: 12px;
}

.topbar__username {
  font-size: 14px;
  color: var(--tl-muted);
}

.content {
  max-width: 1120px;
  margin: 0 auto;
  padding: 32px 24px 56px;
}

.welcome h1 {
  margin: 0 0 8px;
  font-size: 28px;
}

.welcome p {
  margin: 0 0 24px;
  color: var(--tl-muted);
}

.panel {
  border-radius: var(--tl-radius);
  margin-bottom: 20px;
}

.panel__title {
  font-weight: 600;
}

.steps {
  margin: 0;
  padding-left: 20px;
  color: var(--tl-muted);
  line-height: 2;
}
</style>
