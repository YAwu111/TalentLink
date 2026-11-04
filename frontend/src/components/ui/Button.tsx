import type { ButtonHTMLAttributes, ReactNode } from 'react'

import { cx } from '@/lib/cx'

type Variant = 'primary' | 'secondary' | 'ghost'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  loading?: boolean
  icon?: ReactNode
  block?: boolean
}

export function Button({
  variant = 'primary',
  loading = false,
  icon,
  block = false,
  className,
  children,
  disabled,
  type = 'button',
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cx('btn', `btn--${variant}`, block && 'btn--block', className)}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...rest}
    >
      {loading ? <span className="spinner" aria-hidden="true" /> : icon}
      {children ? <span>{children}</span> : null}
    </button>
  )
}
