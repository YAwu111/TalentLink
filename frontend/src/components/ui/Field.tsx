import type { ReactNode } from 'react'

interface FieldProps {
  label: string
  htmlFor: string
  error?: string
  hint?: string
  required?: boolean
  children: ReactNode
}

export function Field({
  label,
  htmlFor,
  error,
  hint,
  required,
  children,
}: FieldProps) {
  return (
    <div className="field">
      <label className="field__label" htmlFor={htmlFor}>
        {label}
        {required ? <span className="field__required">*</span> : null}
      </label>
      {children}
      {error ? (
        <span className="field__error">{error}</span>
      ) : hint ? (
        <span className="field__hint">{hint}</span>
      ) : null}
    </div>
  )
}
