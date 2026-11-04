import { useState, type FormEvent } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { AlertCircle, LoaderCircle, Lock, User } from 'lucide-react'

import { AuthShell } from '@/components/auth/AuthShell'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Field } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { PasswordInput } from '@/components/ui/password-input'
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
      <header className="mb-7">
        <p className="text-[11px] font-semibold tracking-[0.16em] text-primary uppercase">
          欢迎回来
        </p>
        <h2 className="mt-2 text-[28px] leading-tight font-semibold tracking-tight">
          登录
        </h2>
        <p className="mt-2 text-[13.5px] text-muted-foreground">
          使用求职者、企业或管理员账号进入系统
        </p>
      </header>

      {serverError ? (
        <Alert
          variant="destructive"
          className="mb-5 border-destructive/20 bg-destructive/5"
        >
          <AlertCircle />
          <AlertDescription>{serverError}</AlertDescription>
        </Alert>
      ) : null}

      <form className="grid gap-4" onSubmit={handleSubmit} noValidate>
        <Field
          label="用户名"
          htmlFor="login-username"
          error={errors.username}
          required
        >
          <div className="relative">
            <User className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="login-username"
              autoComplete="username"
              autoFocus
              placeholder="请输入用户名"
              className="h-11 pl-9"
              aria-invalid={Boolean(errors.username) || undefined}
              value={username}
              onChange={(event) => changeUsername(event.target.value)}
            />
          </div>
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
            icon={<Lock className="size-4" />}
            invalid={Boolean(errors.password)}
            value={password}
            onChange={changePassword}
          />
        </Field>

        <Button
          type="submit"
          size="lg"
          className="mt-1 w-full"
          disabled={submitting}
        >
          {submitting ? (
            <>
              <LoaderCircle className="animate-spin" />
              正在登录…
            </>
          ) : (
            '登 录'
          )}
        </Button>
      </form>

      <p className="mt-6 text-center text-[13px] text-muted-foreground">
        还没有账号？
        <Link
          to="/register"
          className="ml-1 font-medium text-primary underline-offset-4 hover:underline"
        >
          立即注册
        </Link>
      </p>

      <div className="mt-7 border-t border-dashed border-border pt-5">
        <p className="text-[11.5px] text-muted-foreground">演示账号（点击填充）</p>
        <div className="mt-2.5 grid gap-2 sm:grid-cols-3">
          {DEMO_ACCOUNTS.map((account) => (
            <Button
              key={account.username}
              type="button"
              variant="outline"
              className="h-auto flex-col items-start justify-start gap-0.5 px-3 py-2 text-left font-normal"
              onClick={() => {
                setUsername(account.username)
                setPassword(account.password)
                setErrors({})
                setServerError('')
              }}
            >
              <span className="text-xs font-semibold text-foreground">
                {account.label}
              </span>
              <span className="w-full truncate text-[10.5px] text-muted-foreground">
                {account.username}
              </span>
            </Button>
          ))}
        </div>
      </div>
    </AuthShell>
  )
}
