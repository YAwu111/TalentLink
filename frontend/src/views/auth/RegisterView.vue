<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { Lock, User } from '@element-plus/icons-vue'
import type { FormInstance, FormItemRule, FormRules } from 'element-plus'

import AuthCard from '@/components/auth/AuthCard.vue'
import AuthShell from '@/components/auth/AuthShell.vue'
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

/** 提交只交给 form 的 submit 事件：按钮不再绑 click，避免一次点击发两次请求 */
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
  <AuthShell subtitle="注册后即可发布岗位或投递简历">
    <AuthCard title="创建账号" desc="选择你的身份，注册完成后自动登录">
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
          <el-input
            v-model="form.username"
            placeholder="3-32 位字母、数字或下划线"
            :prefix-icon="User"
          />
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
          />
        </el-form-item>

        <el-button type="primary" class="submit" :loading="auth.submitting" native-type="submit">
          注 册
        </el-button>
      </el-form>

      <template #footer>
        <span>已有账号？</span>
        <router-link to="/login">返回登录</router-link>
      </template>
    </AuthCard>
  </AuthShell>
</template>

<style scoped>
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
</style>
