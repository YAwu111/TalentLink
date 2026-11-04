import { useState, type ReactNode } from 'react'
import { Eye, EyeOff } from 'lucide-react'

import { Input } from './Input'

interface PasswordInputProps {
  id: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  autoComplete?: string
  icon?: ReactNode
  invalid?: boolean
}

export function PasswordInput({
  id,
  value,
  onChange,
  placeholder,
  autoComplete = 'current-password',
  icon,
  invalid,
}: PasswordInputProps) {
  const [visible, setVisible] = useState(false)

  return (
    <Input
      id={id}
      type={visible ? 'text' : 'password'}
      value={value}
      placeholder={placeholder}
      autoComplete={autoComplete}
      icon={icon}
      invalid={invalid}
      onChange={(event) => onChange(event.target.value)}
      suffix={
        <button
          type="button"
          className="input-toggle"
          aria-label={visible ? '隐藏密码' : '显示密码'}
          onClick={() => setVisible((prev) => !prev)}
        >
          {visible ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      }
    />
  )
}
