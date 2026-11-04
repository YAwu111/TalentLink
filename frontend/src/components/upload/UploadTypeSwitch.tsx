import { FileText, ShieldCheck } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import type { UploadCategory } from '@/lib/file'
import { cn } from '@/lib/utils'

interface UploadTypeSwitchProps {
  value: UploadCategory
  onChange: (value: UploadCategory) => void
}

const CATEGORIES = [
  {
    value: 'intro' as const,
    title: '企业介绍文档',
    description: '识别后填充企业资料',
    icon: FileText,
    badge: '优先支持',
  },
  {
    value: 'identity' as const,
    title: '企业身份验证',
    description: '提交材料等待审核',
    icon: ShieldCheck,
    badge: '审核材料',
  },
]

export function UploadTypeSwitch({ value, onChange }: UploadTypeSwitchProps) {
  return (
    <div className="grid gap-3 sm:grid-cols-2" role="radiogroup" aria-label="上传类型">
      {CATEGORIES.map((category) => {
        const Icon = category.icon
        const active = category.value === value
        return (
          <button
            key={category.value}
            type="button"
            role="radio"
            aria-checked={active}
            className={cn(
              'flex items-start gap-3 rounded-2xl border p-4 text-left transition-all duration-200 outline-none focus-visible:ring-3 focus-visible:ring-ring/50',
              active
                ? 'border-primary/40 bg-primary/5 shadow-sm'
                : 'border-border/70 bg-card hover:border-primary/30 hover:bg-muted/40',
            )}
            onClick={() => onChange(category.value)}
          >
            <span
              className={cn(
                'grid size-10 shrink-0 place-items-center rounded-xl',
                active ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground',
              )}
            >
              <Icon className="size-5" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="flex flex-wrap items-center gap-1.5">
                <span className="text-sm font-semibold">{category.title}</span>
                <Badge variant={active ? 'info' : 'neutral'}>{category.badge}</Badge>
              </span>
              <span className="mt-1 block text-xs text-muted-foreground">
                {category.description}
              </span>
            </span>
          </button>
        )
      })}
    </div>
  )
}
