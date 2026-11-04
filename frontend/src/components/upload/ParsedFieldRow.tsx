import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { COMPANY_LABELS, type CompanyField } from '@/lib/company'
import { cn } from '@/lib/utils'
import type { RecognitionFieldValue } from '@/api/recognition'

interface ParsedFieldRowProps {
  field: CompanyField
  currentValue: string
  parsed?: RecognitionFieldValue
  checked: boolean
  disabled?: boolean
  onToggle: () => void
}

type FieldState = 'missing' | 'fill' | 'same' | 'overwrite'

const STATE_META: Record<
  FieldState,
  { label: string; variant: 'neutral' | 'info' | 'success' | 'warning' }
> = {
  missing: { label: '未识别', variant: 'neutral' },
  fill: { label: '将填充', variant: 'info' },
  same: { label: '内容一致', variant: 'success' },
  overwrite: { label: '将覆盖', variant: 'warning' },
}

export function ParsedFieldRow({
  field,
  currentValue,
  parsed,
  checked,
  disabled = false,
  onToggle,
}: ParsedFieldRowProps) {
  const parsedValue = parsed?.value.trim() ?? ''
  const current = currentValue.trim()

  const state: FieldState = !parsedValue
    ? 'missing'
    : !current
      ? 'fill'
      : current === parsedValue
        ? 'same'
        : 'overwrite'
  const meta = STATE_META[state]
  const isDisabled = disabled || state === 'missing'

  return (
    <div
      className={cn(
        'rounded-xl border p-3 transition-colors',
        checked ? 'border-primary/30 bg-primary/5' : 'border-border/70 bg-card',
      )}
    >
      <div className="flex items-start gap-3">
        <Checkbox
          id={`parsed-${field}`}
          checked={checked}
          disabled={isDisabled}
          onCheckedChange={onToggle}
          className="mt-0.5"
        />
        <label
          htmlFor={`parsed-${field}`}
          className="min-w-0 flex-1 cursor-pointer select-none"
        >
          <span className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-medium">{COMPANY_LABELS[field]}</span>
            <Badge variant={meta.variant}>{meta.label}</Badge>
            {parsed ? (
              <span className="text-[10.5px] text-muted-foreground">
                置信度 {Math.round(parsed.confidence * 100)}%
              </span>
            ) : null}
          </span>

          <span className="mt-2 grid gap-1 text-xs leading-relaxed">
            <span className="text-muted-foreground">
              当前：
              <span className="ml-1 text-foreground/80">
                {current || '空白'}
              </span>
            </span>
            <span className="text-muted-foreground">
              识别：
              <span
                className={cn(
                  'ml-1',
                  parsedValue ? 'text-foreground' : 'text-muted-foreground',
                )}
              >
                {parsedValue || '未识别'}
              </span>
            </span>
          </span>
        </label>
      </div>
    </div>
  )
}
