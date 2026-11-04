<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Lock, User } from '@element-plus/icons-vue'
import type { FormInstance, FormRules } from 'element-plus'

import AuthCard from '@/components/auth/AuthCard.vue'
import AuthShell from '@/components/auth/AuthShell.vue'
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

/** 提交只交给 form 的 submit 事件：按钮不再绑 click，避免一次点击发两次请求 */
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
  <AuthShell>
    <AuthCard title="登录" desc="使用求职者、企业或管理员账号进入系统">
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
          />
        </el-form-item>

        <el-button type="primary" class="submit" :loading="auth.submitting" native-type="submit">
          登 录
        </el-button>
      </el-form>

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

      <template #footer>
        <span>还没有账号？</span>
        <router-link to="/register">立即注册</router-link>
      </template>
    </AuthCard>
  </AuthShell>
</template>

<style scoped>
.submit {
  width: 100%;
  margin-top: 8px;
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
</style>
