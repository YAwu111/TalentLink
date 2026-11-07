import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import {
  BriefcaseBusiness,
  CalendarDays,
  GraduationCap,
  LoaderCircle,
  MapPin,
  UserRound,
} from 'lucide-react'

import {
  employerApplicationsApi,
  type EmployerApplicationSummary,
} from '@/api/employerApplications'
import { employerJobsApi, type Job } from '@/api/jobs'
import {
  APPLICATION_STATUS_META,
  type ApplicationStatus,
} from '@/api/jobs'
import { StaggerText } from '@/components/company/StaggerText'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { usePageTitle } from '@/hooks/usePageTitle'
import { errorText } from '@/lib/error'
import { formatDateTime } from '@/lib/format'
import { salaryText } from '@/lib/seeker'

const STATUS_FILTERS: { value: 'all' | ApplicationStatus; label: string }[] = [
  { value: 'all', label: '全部状态' },
  { value: 'submitted', label: '已投递' },
  { value: 'viewed', label: '已查看' },
  { value: 'interview', label: '面试中' },
  { value: 'offered', label: '已发录用' },
  { value: 'offer_accepted', label: '已接受录用' },
  { value: 'offer_declined', label: '已拒绝录用' },
  { value: 'rejected', label: '未通过' },
]

export function EmployerApplicationsPage() {
  usePageTitle('投递管理')
  const [searchParams] = useSearchParams()
  const queryJob = Number(searchParams.get('job_id'))
  const initialJob = Number.isInteger(queryJob) && queryJob > 0 ? String(queryJob) : 'all'
  const [jobs, setJobs] = useState<Job[]>([])
  const [applications, setApplications] = useState<EmployerApplicationSummary[]>([])
  const [jobFilter, setJobFilter] = useState(initialJob)
  const [statusFilter, setStatusFilter] = useState<'all' | ApplicationStatus>('all')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let alive = true
    employerJobsApi
      .list()
      .then((data) => {
        if (alive) setJobs(data)
      })
      .catch(() => {
        // 筛选器失败不阻断投递列表
      })
    return () => {
      alive = false
    }
  }, [])

  useEffect(() => {
    let alive = true
    setLoading(true)
    setError('')
    employerApplicationsApi
      .list({
        job_id: jobFilter === 'all' ? undefined : Number(jobFilter),
        status: statusFilter === 'all' ? undefined : statusFilter,
      })
      .then((data) => {
        if (alive) setApplications(data)
      })
      .catch((err) => {
        if (alive) setError(errorText(err, '投递列表加载失败'))
      })
      .finally(() => {
        if (alive) setLoading(false)
      })
    return () => {
      alive = false
    }
  }, [jobFilter, statusFilter])

  const stats = useMemo(() => {
    return {
      total: applications.length,
      pending: applications.filter((item) => item.status === 'submitted').length,
      interview: applications.filter((item) => item.status === 'interview').length,
    }
  }, [applications])

  return (
    <>
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold tracking-[0.16em] text-primary uppercase">
            企业中心
          </p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight md:text-[30px]">
            <StaggerText text="投递管理" />
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            查看投递简历，标记已查看、进入面试或未通过。状态会同步到求职者的我的投递。
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge variant="neutral">共 {stats.total} 条</Badge>
          <Badge variant="info">待查看 {stats.pending}</Badge>
          <Badge variant="teal">面试中 {stats.interview}</Badge>
        </div>
      </header>

      <Card className="mt-5 gap-0 rounded-2xl border-border/70 py-0 shadow-sm ring-0">
        <CardContent className="flex flex-wrap items-center gap-2 px-5 py-4">
          <select
            value={jobFilter}
            onChange={(event) => setJobFilter(event.target.value)}
            className="h-10 min-w-[220px] rounded-lg border border-input bg-card px-3 text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
            aria-label="按岗位筛选"
          >
            <option value="all">全部岗位</option>
            {jobs.map((job) => (
              <option key={job.id} value={job.id}>
                {job.title}
              </option>
            ))}
          </select>
          <select
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(event.target.value as 'all' | ApplicationStatus)
            }
            className="h-10 min-w-[150px] rounded-lg border border-input bg-card px-3 text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
            aria-label="按状态筛选"
          >
            {STATUS_FILTERS.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
          <span className="text-xs text-muted-foreground">
            筛选后 {applications.length} 条
          </span>
        </CardContent>
      </Card>

      {error ? (
        <Alert
          variant="destructive"
          className="mt-5 border-destructive/20 bg-destructive/5"
        >
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      {loading ? (
        <div className="mt-8 grid min-h-[220px] place-items-center">
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <LoaderCircle className="size-4 animate-spin" />
            正在加载投递…
          </p>
        </div>
      ) : applications.length > 0 ? (
        <div className="mt-5 grid gap-3">
          {applications.map((application) => {
            const meta = APPLICATION_STATUS_META[application.status]
            return (
              <article
                key={application.id}
                className="rounded-2xl border border-border/70 bg-card p-5 shadow-sm"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex min-w-0 items-start gap-3">
                    <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-base font-semibold text-primary">
                      {application.seeker_name.slice(0, 1)}
                    </span>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-base font-semibold">
                          {application.seeker_name}
                        </h2>
                        <Badge variant={meta.variant}>{meta.label}</Badge>
                      </div>
                      <p className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <UserRound className="size-3.5" />
                          {[application.gender, application.age ? `${application.age} 岁` : '']
                            .filter(Boolean)
                            .join(' · ')}
                        </span>
                        <span className="flex items-center gap-1">
                          <GraduationCap className="size-3.5" />
                          {[application.education, application.school, application.major]
                            .filter(Boolean)
                            .join(' · ')}
                        </span>
                      </p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" asChild>
                    <Link to={`/employer/applications/${application.id}`}>
                      查看简历
                    </Link>
                  </Button>
                </div>

                <div className="mt-4 grid gap-2 border-t border-dashed border-border/70 pt-3 text-xs text-muted-foreground sm:grid-cols-2">
                  <p className="flex items-center gap-1.5">
                    <BriefcaseBusiness className="size-3.5" />
                    投递岗位：{application.job_title}
                  </p>
                  <p className="flex items-center gap-1.5">
                    <CalendarDays className="size-3.5" />
                    投递于 {formatDateTime(application.applied_at)}
                  </p>
                  <p className="flex items-center gap-1.5">
                    <MapPin className="size-3.5" />
                    求职意向：{application.job_intention || '未填写'}
                  </p>
                  <p className="font-medium text-foreground">
                    期望薪资：
                    {salaryText(
                      application.expected_salary_min,
                      application.expected_salary_max,
                    )}
                  </p>
                </div>

                {application.note ? (
                  <p className="mt-3 rounded-lg bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
                    求职者留言：{application.note}
                  </p>
                ) : null}
              </article>
            )
          })}
        </div>
      ) : (
        <Card className="mt-5 gap-0 rounded-2xl border-dashed border-border/80 py-0 shadow-none ring-0">
          <CardContent className="grid min-h-[240px] place-items-center text-center">
            <div>
              <BriefcaseBusiness className="mx-auto size-8 text-muted-foreground" />
              <p className="mt-3 text-sm font-semibold">暂无投递</p>
              <p className="mt-1 text-xs text-muted-foreground">
                发布岗位后，求职者投递会出现在这里。
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </>
  )
}
