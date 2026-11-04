<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Lock, User } from '@element-plus/icons-vue'
import type { FormInstance, FormRules } from 'element-plus'

import AuthBrandPanel from '@/components/AuthBrandPanel.vue'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const router = useRouter()
const route = useRoute()

const formRef = ref<FormInstance>()
const form = reactive({ username: '', password: '' })

const rules: FormRules<typeof form> = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }],
}

const demoAccounts = [
  { label: '求职者', username: 'seeker_liming', password: 'demo123' },
  { label: '企业', username: 'hr_xinghe', password: 'demo123' },
  { label: '管理员', username: 'yawu1122345', password: 'dev123123' },
]

function fillDemo(account: { username: string; password: string }) {
  form.username = account.username
  form.password = account.password
}

async function submit() {
  if (!formRef.value) return
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return

  try {
    await auth.login({ ...form })
    const redirect = typeof route.query.redirect === 'string' ? route.query.redirect : '/'
    await router.replace(redirect)
  } catch {
    // 错误提示由 axios 拦截器统一处理
  }
}
</script>

<template>
  <div class="auth-shell">
    <AuthBrandPanel />

    <section class="panel">
      <div
        v-motion
        class="card"
        :initial="{ opacity: 0, y: 28 }"
        :enter="{ opacity: 1, y: 0, transition: { duration: 460 } }"
      >
        <header class="card__header">
          <h2>登录</h2>
          <p>使用求职者、企业或管理员账号进入系统</p>
        </header>

        <el-form
          ref="formRef"
          :model="form"
          :rules="rules"
          label-position="top"
          size="large"
          @submit.prevent="submit"
        >
          <el-form-item label="用户名" prop="username">
            <el-input v-model="form.username" placeholder="请输入用户名" :prefix-icon="User" />
          </el-form-item>
          <el-form-item label="密码" prop="password">
            <el-input
              v-model="form.password"
              type="password"
              show-password
              placeholder="请输入密码"
              :prefix-icon="Lock"
              @keyup.enter="submit"
            />
          </el-form-item>

          <el-button
            type="primary"
            class="submit"
            :loading="auth.submitting"
            native-type="submit"
            @click="submit"
          >
            登 录
          </el-button>
        </el-form>

        <footer class="card__footer">
          <span>还没有账号？</span>
          <router-link to="/register">立即注册</router-link>
        </footer>

        <div class="demo">
          <span class="demo__title">演示账号（点击填充）</span>
          <div class="demo__list">
            <el-tag
              v-for="account in demoAccounts"
              :key="account.username"
              class="demo__tag"
              effect="plain"
              @click="fillDemo(account)"
            >
              {{ account.label }}
            </el-tag>
          </div>
        </div>
      </div>
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

.card {
  width: 100%;
  max-width: 420px;
  padding: 40px 36px 32px;
  border-radius: var(--tl-radius);
  background: #fff;
  box-shadow: 0 24px 60px rgba(30, 58, 138, 0.12);
}

.card__header h2 {
  margin: 0 0 8px;
  font-size: 26px;
}

.card__header p {
  margin: 0 0 28px;
  color: var(--tl-muted);
  font-size: 14px;
}

.submit {
  width: 100%;
  margin-top: 8px;
}

.card__footer {
  margin-top: 20px;
  font-size: 14px;
  color: var(--tl-muted);
  text-align: center;
}

.card__footer a {
  margin-left: 6px;
  font-weight: 600;
}

.demo {
  margin-top: 28px;
  padding-top: 20px;
  border-top: 1px dashed #e5e7eb;
}

.demo__title {
  font-size: 12px;
  color: var(--tl-muted);
}

.demo__list {
  display: flex;
  gap: 8px;
  margin-top: 10px;
}

.demo__tag {
  cursor: pointer;
}

@media (max-width: 960px) {
  .auth-shell {
    grid-template-columns: 1fr;
  }
}
</style>
