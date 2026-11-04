import { BadgeCheck, Building2, Hash, Phone } from 'lucide-react'

import { SpotlightCard } from '@/components/company/SpotlightCard'
import { Badge } from '@/components/ui/badge'
import type { CompanyFormValues } from '@/lib/company'

interface CompanyPreviewCardProps {
  values: CompanyFormValues
  verified: boolean
  companyId: number
}

export function CompanyPreviewCard({
  values,
  verified,
  companyId,
}: CompanyPreviewCardProps) {
  const name = values.name.trim()
  const initial = name.slice(0, 1) || '企'

  return (
    <SpotlightCard className="rounded-2xl border border-border/70 bg-card p-5 shadow-sm">
      <div className="flex items-start gap-3.5">
        <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-primary/10 text-xl font-semibold text-primary">
          {initial}
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="truncate text-lg font-semibold tracking-tight">
            {name || '企业名称待完善'}
          </h2>
          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
            <Badge variant="info">{values.industry.trim() || '行业未填写'}</Badge>
            {verified ? (
              <Badge variant="success">
                <BadgeCheck />
                已认证
              </Badge>
            ) : (
              <Badge variant="warning">待认证</Badge>
            )}
          </div>
        </div>
      </div>

      <div className="mt-5 space-y-2.5 border-t border-dashed border-border/70 pt-4 text-[13px] text-muted-foreground">
        <p className="flex items-start gap-2">
          <Building2 className="mt-0.5 size-4 shrink-0" />
          <span className="break-words">{values.address.trim() || '地址未填写'}</span>
        </p>
        <p className="flex items-center gap-2">
          <Phone className="size-4 shrink-0" />
          <span>{values.phone.trim() || '电话未填写'}</span>
        </p>
        <p className="flex items-center gap-2">
          <Hash className="size-4 shrink-0" />
          <span>企业编号 #{companyId}</span>
        </p>
      </div>

      <p className="mt-4 line-clamp-4 border-t border-dashed border-border/70 pt-4 text-[13px] leading-relaxed whitespace-pre-wrap text-muted-foreground">
        {values.intro.trim() || '补充企业简介，让求职者更了解团队与业务。'}
      </p>
    </SpotlightCard>
  )
}
