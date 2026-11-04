import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AlertCircle, Building2, Lock, User, UserRound } from 'lucide-react'

import { AuthShell } from '@/components/auth/AuthShell'
import { Button } from '@/components/ui/Button'
import { Field } from '@/components/ui/Field'
import { Input } from '@/components/ui/Input'
import { PasswordInput } from '@/components/ui/PasswordInput'
import { usePageTitle } from '@/hooks/usePageTitle'
import { errorText } from '@/lib/error'
import { useAuthStore } from '@/stores/auth'

type RegisterRole = 'seeker' | 'employer'

interface RegisterErrors {
  username?: string
  displayName?: string
  password?: string
  confirm?: string
}

export function RegisterPage() {
  usePageTitle('注册')

  const register = useAuthStore((state) => state.register)
  const submitting = useAuthStore((state) => state.submitting)
  const navigate = useNavigate()

  const [role, setRole] = useState<RegisterRole>('seeker')
  const [username, setUsername] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [errors, setErrors] = useState<RegisterErrors>({})
  const [serverError, setServerError] = useState('')

  const isSeeker = role === 'seeker'

  function clearError(field: keyof RegisterErrors) {
    setErrors((prev) => ({ ...prev, [field]: undefined }))
    setServerError('')
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const nextErrors: RegisterErrors = {}
    if (!/^[A-Za-z0-9_]{3,32}$/.test(username.trim())) {
      nextErrors.username = '用户名需为 3-32 位字母、数字或下划线'
    }
    if (!displayName.trim()) {
      nextErrors.displayName = isSeeker ? '请填写真实姓名' : '请填写企业名称'
    }
    if (password.length < 6 || password.length > 64) {
      nextErrors.password = '密码长度需为 6-64 位'
    }
    if (confirm !== password) {
      nextErrors.confirm = '两次输入的密码不一致'
    }
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length) return

    setServerError('')
    try {
      await register({
        username: username.trim(),
        password,
        role,
        display_name: displayName.trim(),
      })
      navigate('/', { replace: true })
    } catch (error) {
      setServerError(errorText(error, '注册失败，请稍后重试'))
    }
  }

  return (
    <AuthShell subtitle="注册后即可发布岗位或投递简历">
      <header className="auth-head">
        <span className="auth-eyebrow">创建账号</span>
        <h2>注册</h2>
        <p>选择身份，注册完成后自动登录</p>
      </header>

      {serverError ? (
        <div className="alert" role="alert">
          <AlertCircle size={17} />
          <span>{serverError}</span>
        </div>
      ) : null}

      <form className="auth-form" onSubmit={handleSubmit} noValidate>
        <div className="role-picker" role="radiogroup" aria-label="账号类型">
          <button
            type="button"
            role="radio"
            aria-checked={isSeeker}
            className={isSeeker ? 'role-option is-active' : 'role-option'}
            onClick={() => setRole('seeker')}
          >
            <UserRound size={19} />
            <span>
              <strong>我是求职者</strong>
              <small>个人求职账号</small>
            </span>
          </button>
          <button
            type="button"
            role="radio"
            aria-checked={!isSeeker}
            className={!isSeeker ? 'role-option is-active' : 'role-option'}
            onClick={() => setRole('employer')}
          >
            <Building2 size={19} />
            <span>
              <strong>我是企业</strong>
              <small>企业招聘账号</small>
            </span>
          </button>
        </div>

        <Field
          label="用户名"
          htmlFor="register-username"
          error={errors.username}
          required
        >
          <Input
            id="register-username"
            autoComplete="username"
            placeholder="3-32 位字母、数字或下划线"
            icon={<User size={16} />}
            invalid={Boolean(errors.username)}
            value={username}
            onChange={(event) => {
              setUsername(event.target.value)
              clearError('username')
            }}
          />
        </Field>

        <Field
          label={isSeeker ? '真实姓名' : '企业名称'}
          htmlFor="register-name"
          error={errors.displayName}
          required
        >
          <Input
            id="register-name"
            placeholder={isSeeker ? '请输入真实姓名' : '请输入企业名称'}
            icon={isSeeker ? <UserRound size={16} /> : <Building2 size={16} />}
            invalid={Boolean(errors.displayName)}
            value={displayName}
            onChange={(event) => {
              setDisplayName(event.target.value)
              clearError('displayName')
            }}
          />
        </Field>

        <Field
          label="密码"
          htmlFor="register-password"
          error={errors.password}
          required
        >
          <PasswordInput
            id="register-password"
            autoComplete="new-password"
            placeholder="至少 6 位"
            icon={<Lock size={16} />}
            invalid={Boolean(errors.password)}
            value={password}
            onChange={(value) => {
              setPassword(value)
              clearError('password')
            }}
          />
        </Field>

        <Field
          label="确认密码"
          htmlFor="register-confirm"
          error={errors.confirm}
          required
        >
          <PasswordInput
            id="register-confirm"
            autoComplete="new-password"
            placeholder="请再次输入密码"
            icon={<Lock size={16} />}
            invalid={Boolean(errors.confirm)}
            value={confirm}
            onChange={(value) => {
              setConfirm(value)
              clearError('confirm')
            }}
          />
        </Field>

        <Button
          type="submit"
          block
          loading={submitting}
          className="auth-submit"
        >
          注 册
        </Button>
      </form>

      <footer className="auth-foot">
        <span>已有账号？</span>
        <Link to="/login">返回登录</Link>
      </footer>
    </AuthShell>
  )
}
