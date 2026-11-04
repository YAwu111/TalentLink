<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { Lock, User } from '@element-plus/icons-vue'
import type { FormInstance, FormItemRule, FormRules } from 'element-plus'

import AuthBrandPanel from '@/components/AuthBrandPanel.vue'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const router = useRouter()

const formRef = ref<FormInstance>()
const form = reactive({
  role: 'seeker' as 'seeker' | 'employer',
  username: '',
  display_name: '',
  password: '',
  confirm: '',
})

const nameLabel = computed(() => (form.role === 'seeker' ? '真实姓名' : '企业名称'))

const confirmValidator: FormItemRule['validator'] = (_rule, value, callback) => {
  if (value !== form.password) {
    callback(new Error('两次输入的密码不一致'))
    return
  }
  callback()
}

const rules: FormRules<typeof form> = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    {
      pattern: /^[A-Za-z0-9_]{3,32}$/,
      message: '3-32 位字母、数字或下划线',
      trigger: 'blur',
    },
  ],
  display_name: [{ required: true, message: '请输入名称', trigger: 'blur' }],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, max: 64, message: '密码长度 6-64 位', trigger: 'blur' },
  ],
  confirm: [
    { required: true, message: '请再次输入密码', trigger: 'blur' },
    { validator: confirmValidator, trigger: 'blur' },
  ],
}

async function submit() {
  if (!formRef.value) return
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return

  try {
    await auth.register({
      username: form.username,
      password: form.password,
      role: form.role,
      display_name: form.display_name,
    })
    // 注册即登录，直接进入系统
    await router.replace('/')
  } catch {
    // 错误提示由 axios 拦截器统一处理
  }
}
</script>

<template>
  <div class="auth-shell">
    <AuthBrandPanel subtitle="注册后即可发布岗位或投递简历" />

    <section class="panel">
      <div
        v-motion
        class="card"
        :initial="{ opacity: 0, y: 28 }"
        :enter="{ opacity: 1, y: 0, transition: { duration: 460 } }"
      >
        <header class="card__header">
          <h2>创建账号</h2>
          <p>选择你的身份，注册完成后自动登录</p>
        </header>

        <el-form
          ref="formRef"
          :model="form"
          :rules="rules"
          label-position="top"
          size="large"
          @submit.prevent="submit"
        >
          <el-form-item label="我要注册为">
            <el-radio-group v-model="form.role" class="role-group">
              <el-radio-button value="seeker">求职者</el-radio-button>
              <el-radio-button value="employer">企业</el-radio-button>
            </el-radio-group>
          </el-form-item>

          <el-form-item label="用户名" prop="username">
            <el-input v-model="form.username" placeholder="3-32 位字母、数字或下划线" :prefix-icon="User" />
          </el-form-item>

          <el-form-item :label="nameLabel" prop="display_name">
            <el-input
              v-model="form.display_name"
              :placeholder="form.role === 'seeker' ? '请输入真实姓名' : '请输入企业名称'"
            />
          </el-form-item>

          <el-form-item label="密码" prop="password">
            <el-input
              v-model="form.password"
              type="password"
              show-password
              placeholder="至少 6 位"
              :prefix-icon="Lock"
            />
          </el-form-item>

          <el-form-item label="确认密码" prop="confirm">
            <el-input
              v-model="form.confirm"
              type="password"
              show-password
              placeholder="请再次输入密码"
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
            注 册
          </el-button>
        </el-form>

        <footer class="card__footer">
          <span>已有账号？</span>
          <router-link to="/login">返回登录</router-link>
        </footer>
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
  max-width: 440px;
  padding: 36px 36px 28px;
  border-radius: var(--tl-radius);
  background: #fff;
  box-shadow: 0 24px 60px rgba(30, 58, 138, 0.12);
}

.card__header h2 {
  margin: 0 0 8px;
  font-size: 26px;
}

.card__header p {
  margin: 0 0 24px;
  color: var(--tl-muted);
  font-size: 14px;
}

.role-group {
  width: 100%;
}

.role-group :deep(.el-radio-button) {
  flex: 1;
}

.role-group :deep(.el-radio-button__inner) {
  width: 100%;
}

.submit {
  width: 100%;
  margin-top: 4px;
}

.card__footer {
  margin-top: 18px;
  font-size: 14px;
  color: var(--tl-muted);
  text-align: center;
}

.card__footer a {
  margin-left: 6px;
  font-weight: 600;
}

@media (max-width: 960px) {
  .auth-shell {
    grid-template-columns: 1fr;
  }
}
</style>
