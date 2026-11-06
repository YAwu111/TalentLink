import { Link } from 'react-router-dom'
import { Building2, MapPin } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  APPLICATION_STATUS_META,
  formatSalaryRange,
  type Application,
} from '@/api/jobs'
import { formatDateTime } from '@/lib/format'

export function ApplicationCard({ application }: { application: Application }) {
  const meta = APPLICATION_STATUS_META[application.status]

  return (
    <article className="rounded-2xl border border-border/70 bg-card p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-base font-semibold">{application.job_title}</h2>
          <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
            <Building2 className="size-3.5" />
            {application.company_name}
            <span className="text-border">·</span>
            <MapPin className="size-3.5" />
            {application.city}
          </p>
        </div>
        <Badge variant={meta.variant}>{meta.label}</Badge>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
        <span className="font-medium text-foreground">
          {formatSalaryRange(application.salary_min, application.salary_max)}
        </span>
        <span>投递于 {formatDateTime(application.applied_at)}</span>
      </div>

      {application.note ? (
        <p className="mt-3 rounded-lg bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
          {application.note}
          {application.offer_salary
            ? ` · 录用薪资 ${Math.round(application.offer_salary / 1000)}K`
            : ''}
        </p>
      ) : null}

      <div className="mt-4 flex justify-end">
        <Button variant="outline" size="sm" asChild>
          <Link to={`/seeker/jobs/${application.job_id}`}>查看岗位</Link>
        </Button>
      </div>
    </article>
  )
}
