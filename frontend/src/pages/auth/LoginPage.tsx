import { useState, type FormEvent } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { AlertCircle, Lock, User } from 'lucide-react'

import { AuthShell } from '@/components/auth/AuthShell'
import { Button } from '@/components/ui/Button'
import { Field } from '@/components/ui/Field'
import { Input } from '@/components/ui/Input'
import { PasswordInput } from '@/components/ui/PasswordInput'
import { usePageTitle } from '@/hooks/usePageTitle'
import { errorText } from '@/lib/error'
import { useAuthStore } from '@/stores/auth'

interface LoginErrors {
  username?: string
  password?: string
}

const DEMO_ACCOUNTS = [
  { label: '求职者', username: 'seeker_liming', password: 'demo123' },
  { label: '企业', username: 'hr_xinghe', password: 'demo123' },
  { label: '管理员', username: 'yawu1122345', password: 'dev123123' },
]

export function LoginPage() {
  usePageTitle('登录')

  const login = useAuthStore((state) => state.login)
  const submitting = useAuthStore((state) => state.submitting)
  const navigate = useNavigate()
  const [params] = useSearchParams()

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState<LoginErrors>({})
  const [serverError, setServerError] = useState('')

  function changeUsername(value: string) {
    setUsername(value)
    setErrors((prev) => ({ ...prev, username: undefined }))
    setServerError('')
  }

  function changePassword(value: string) {
    setPassword(value)
    setErrors((prev) => ({ ...prev, password: undefined }))
    setServerError('')
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const nextErrors: LoginErrors = {}
    if (!username.trim()) nextErrors.username = '请输入用户名'
    if (!password) nextErrors.password = '请输入密码'
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length) return

    setServerError('')
    try {
      await login({ username: username.trim(), password })
      const redirect = params.get('redirect')
      const safeRedirect =
        redirect && redirect.startsWith('/') && !redirect.startsWith('//')
          ? redirect
          : '/'
      navigate(safeRedirect, { replace: true })
    } catch (error) {
      setServerError(errorText(error, '登录失败，请稍后重试'))
    }
  }

  return (
    <AuthShell>
      <header className="auth-head">
        <span className="auth-eyebrow">欢迎回来</span>
        <h2>登录</h2>
        <p>使用求职者、企业或管理员账号进入系统</p>
      </header>

      {serverError ? (
        <div className="alert" role="alert">
          <AlertCircle size={17} />
          <span>{serverError}</span>
        </div>
      ) : null}

      <form className="auth-form" onSubmit={handleSubmit} noValidate>
        <Field
          label="用户名"
          htmlFor="login-username"
          error={errors.username}
          required
        >
          <Input
            id="login-username"
            autoComplete="username"
            autoFocus
            placeholder="请输入用户名"
            icon={<User size={16} />}
            invalid={Boolean(errors.username)}
            value={username}
            onChange={(event) => changeUsername(event.target.value)}
          />
        </Field>

        <Field
          label="密码"
          htmlFor="login-password"
          error={errors.password}
          required
        >
          <PasswordInput
            id="login-password"
            placeholder="请输入密码"
            icon={<Lock size={16} />}
            invalid={Boolean(errors.password)}
            value={password}
            onChange={changePassword}
          />
        </Field>

        <Button
          type="submit"
          block
          loading={submitting}
          className="auth-submit"
        >
          登 录
        </Button>
      </form>

      <footer className="auth-foot">
        <span>还没有账号？</span>
        <Link to="/register">立即注册</Link>
      </footer>

      <div className="demo">
        <span className="demo__title">演示账号（点击填充）</span>
        <div className="demo__list">
          {DEMO_ACCOUNTS.map((account) => (
            <button
              key={account.username}
              type="button"
              className="demo__chip"
              onClick={() => {
                setUsername(account.username)
                setPassword(account.password)
                setErrors({})
                setServerError('')
              }}
            >
              <strong>{account.label}</strong>
              <span>{account.username}</span>
            </button>
          ))}
        </div>
      </div>
    </AuthShell>
  )
}
