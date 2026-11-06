import { Link } from 'react-router-dom'
import { Building2, MapPin, Users } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  cityOf,
  formatSalaryRange,
  type Job,
} from '@/api/jobs'

interface JobCardProps {
  job: Job
}

export function JobCard({ job }: JobCardProps) {
  return (
    <article className="rounded-2xl border border-border/70 bg-card p-5 shadow-sm transition-colors hover:border-primary/25">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-base font-semibold">{job.title}</h2>
          <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
            <Building2 className="size-3.5" />
            {job.company.name}
            <span className="text-border">·</span>
            {job.company.industry}
          </p>
        </div>
        <span className="shrink-0 text-sm font-semibold text-primary">
          {formatSalaryRange(job.salary_min, job.salary_max)}
        </span>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <MapPin className="size-3.5" />
          {cityOf(job.company.address)}
        </span>
        <span className="flex items-center gap-1">
          <Users className="size-3.5" />
          招 {job.headcount} 人
        </span>
        {job.applied ? <Badge variant="success">已投递</Badge> : null}
      </div>

      <p className="mt-3 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
        {job.requirement || '岗位要求待补充'}
      </p>

      <div className="mt-4 flex justify-end">
        <Button variant="outline" size="sm" asChild>
          <Link to={`/seeker/jobs/${job.id}`}>查看详情</Link>
        </Button>
      </div>
    </article>
  )
}
