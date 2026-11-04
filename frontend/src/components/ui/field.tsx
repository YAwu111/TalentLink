import type { ReactNode } from 'react'

import { Label } from '@/components/ui/label'

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
    <div className="grid gap-2">
      <Label htmlFor={htmlFor}>
        {label}
        {required ? <span className="text-destructive">*</span> : null}
      </Label>
      {children}
      {error ? (
        <p className="text-xs leading-relaxed text-destructive" role="alert">
          {error}
        </p>
      ) : hint ? (
        <p className="text-xs leading-relaxed text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  )
}
