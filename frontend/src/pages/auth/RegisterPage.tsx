import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  AlertCircle,
  Building2,
  LoaderCircle,
  Lock,
  User,
  UserRound,
} from 'lucide-react'

import { AuthShell } from '@/components/auth/AuthShell'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Field } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { PasswordInput } from '@/components/ui/password-input'
import { usePageTitle } from '@/hooks/usePageTitle'
import { errorText } from '@/lib/error'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/stores/auth'

type RegisterRole = 'seeker' | 'employer'

interface RegisterErrors {
  username?: string
  displayName?: string
  password?: string
  confirm?: string
}

const ROLE_OPTIONS: Array<{
  value: RegisterRole
  label: string
  hint: string
  icon: typeof UserRound
}> = [
  { value: 'seeker', label: '我是求职者', hint: '个人求职账号', icon: UserRound },
  { value: 'employer', label: '我是企业', hint: '企业招聘账号', icon: Building2 },
]

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
      <header className="mb-7">
        <p className="text-[11px] font-semibold tracking-[0.16em] text-primary uppercase">
          创建账号
        </p>
        <h2 className="mt-2 text-[28px] leading-tight font-semibold tracking-tight">
          注册
        </h2>
        <p className="mt-2 text-[13.5px] text-muted-foreground">
          选择身份，注册完成后自动登录
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
        <div className="grid grid-cols-2 gap-2.5" role="radiogroup" aria-label="账号类型">
          {ROLE_OPTIONS.map((option) => {
            const Icon = option.icon
            const isActive = role === option.value
            return (
              <button
                key={option.value}
                type="button"
                role="radio"
                aria-checked={isActive}
                className={cn(
                  'flex items-center gap-2.5 rounded-xl border p-3 text-left transition-all duration-200 outline-none focus-visible:ring-3 focus-visible:ring-ring/50',
                  isActive
                    ? 'border-primary bg-primary/5 ring-2 ring-primary/10'
                    : 'border-border bg-background hover:border-primary/40 hover:bg-muted/50',
                )}
                onClick={() => setRole(option.value)}
              >
                <Icon
                  className={cn(
                    'size-5 shrink-0',
                    isActive ? 'text-primary' : 'text-muted-foreground',
                  )}
                />
                <span className="min-w-0">
                  <span
                    className={cn(
                      'block text-[12.5px] font-semibold',
                      isActive ? 'text-primary' : 'text-foreground',
                    )}
                  >
                    {option.label}
                  </span>
                  <span className="mt-0.5 block text-[10.5px] text-muted-foreground">
                    {option.hint}
                  </span>
                </span>
              </button>
            )
          })}
        </div>

        <Field
          label="用户名"
          htmlFor="register-username"
          error={errors.username}
          required
        >
          <div className="relative">
            <User className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="register-username"
              autoComplete="username"
              placeholder="3-32 位字母、数字或下划线"
              className="h-11 pl-9"
              aria-invalid={Boolean(errors.username) || undefined}
              value={username}
              onChange={(event) => {
                setUsername(event.target.value)
                clearError('username')
              }}
            />
          </div>
        </Field>

        <Field
          label={isSeeker ? '真实姓名' : '企业名称'}
          htmlFor="register-name"
          error={errors.displayName}
          required
        >
          <div className="relative">
            {isSeeker ? (
              <UserRound className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            ) : (
              <Building2 className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            )}
            <Input
              id="register-name"
              placeholder={isSeeker ? '请输入真实姓名' : '请输入企业名称'}
              className="h-11 pl-9"
              aria-invalid={Boolean(errors.displayName) || undefined}
              value={displayName}
              onChange={(event) => {
                setDisplayName(event.target.value)
                clearError('displayName')
              }}
            />
          </div>
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
            icon={<Lock className="size-4" />}
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
            icon={<Lock className="size-4" />}
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
          size="lg"
          className="mt-1 w-full"
          disabled={submitting}
        >
          {submitting ? (
            <>
              <LoaderCircle className="animate-spin" />
              正在注册…
            </>
          ) : (
            '注 册'
          )}
        </Button>
      </form>

      <p className="mt-6 text-center text-[13px] text-muted-foreground">
        已有账号？
        <Link
          to="/login"
          className="ml-1 font-medium text-primary underline-offset-4 hover:underline"
        >
          返回登录
        </Link>
      </p>
    </AuthShell>
  )
}
