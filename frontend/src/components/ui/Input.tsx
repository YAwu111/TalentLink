import type { InputHTMLAttributes, ReactNode } from 'react'

import { cx } from '@/lib/cx'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  icon?: ReactNode
  suffix?: ReactNode
  invalid?: boolean
}

export function Input({
  icon,
  suffix,
  invalid = false,
  className,
  ...rest
}: InputProps) {
  return (
    <div
      className={cx(
        'input-box',
        Boolean(icon) && 'has-icon',
        Boolean(suffix) && 'has-suffix',
        className,
      )}
    >
      {icon ? <span className="input-box__icon">{icon}</span> : null}
      <input
        className={cx('input', invalid && 'is-invalid')}
        aria-invalid={invalid || undefined}
        {...rest}
      />
      {suffix ? <span className="input-box__suffix">{suffix}</span> : null}
    </div>
  )
}
