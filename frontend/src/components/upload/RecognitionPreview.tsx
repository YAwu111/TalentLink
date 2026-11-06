import { AlertCircle, LoaderCircle, Sparkles } from 'lucide-react'

import { ParsedFieldRow } from '@/components/upload/ParsedFieldRow'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { COMPANY_FIELDS, type CompanyField, type CompanyFormValues } from '@/lib/company'
import type { RecognitionResult } from '@/api/recognition'

interface RecognitionPreviewProps {
  result: RecognitionResult
  current: CompanyFormValues
  selected: Set<CompanyField>
  applying: boolean
  applyError: string
  onToggle: (field: CompanyField) => void
  onApply: () => void
}

export function RecognitionPreview({
  result,
  current,
  selected,
  applying,
  applyError,
  onToggle,
  onApply,
}: RecognitionPreviewProps) {
  const recognizedCount = COMPANY_FIELDS.filter(
    (field) => result.fields[field]?.value.trim(),
  ).length

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="success">
          <Sparkles />
          识别完成
        </Badge>
        <Badge variant="info">
          置信度 {Math.round(result.confidence * 100)}%
        </Badge>
        <Badge variant="neutral">
          {result.transport === 'mock'
            ? '模拟数据'
            : result.provider === 'local'
              ? '本地识别'
              : '识别结果'}
        </Badge>
        <span className="text-xs text-muted-foreground">
          识别到 {recognizedCount} 项
        </span>
      </div>

      {result.warnings.length > 0 ? (
        <Alert className="border-amber-200/80 bg-amber-50 text-amber-900">
          <AlertCircle />
          <AlertDescription className="text-amber-900/90">
            {result.warnings.join(' ')}
          </AlertDescription>
        </Alert>
      ) : null}

      <div className="grid gap-2.5">
        {COMPANY_FIELDS.map((field) => (
          <ParsedFieldRow
            key={field}
            field={field}
            currentValue={current[field]}
            parsed={result.fields[field]}
            checked={selected.has(field)}
            disabled={applying}
            onToggle={() => onToggle(field)}
          />
        ))}
      </div>

      <p className="text-xs leading-relaxed text-muted-foreground">
        默认只勾选空白字段；当前资料已有内容时需要手动勾选，勾选后会覆盖原值。
      </p>

      {applyError ? (
        <Alert
          variant="destructive"
          className="border-destructive/20 bg-destructive/5"
        >
          <AlertCircle />
          <AlertDescription>{applyError}</AlertDescription>
        </Alert>
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-dashed border-border/70 pt-4">
        <span className="text-xs text-muted-foreground">
          已选择 {selected.size} 个字段
        </span>
        <Button
          type="button"
          onClick={onApply}
          disabled={selected.size === 0 || applying}
        >
          {applying ? <LoaderCircle className="animate-spin" /> : null}
          应用 {selected.size} 个字段
        </Button>
      </div>
    </div>
  )
}
