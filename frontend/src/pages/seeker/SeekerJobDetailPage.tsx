import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  BriefcaseBusiness,
  Building2,
  CalendarDays,
  LoaderCircle,
  MapPin,
  Users,
} from 'lucide-react'

import { cityOf, formatSalaryRange, seekerJobsApi, type Job } from '@/api/jobs'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { PageLoading } from '@/components/ui/page-loading'
import { usePageTitle } from '@/hooks/usePageTitle'
import { useSeekerProfile } from '@/hooks/useSeekerProfile'
import { seekerMissingLabels } from '@/lib/seeker'
import { formatDateTime } from '@/lib/format'
import { errorText } from '@/lib/error'

export function SeekerJobDetailPage() {
  const { id } = useParams()
  const jobId = Number(id)
  const { profile, loading: profileLoading } = useSeekerProfile()
  const [job, setJob] = useState<Job | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [applying, setApplying] = useState(false)
  const [notice, setNotice] = useState('')

  usePageTitle(job?.title ?? '岗位详情')

  useEffect(() => {
    let alive = true
    setLoading(true)
    setError('')
    seekerJobsApi
      .detail(jobId)
      .then((data) => {
        if (alive) setJob(data)
      })
      .catch((err) => {
        if (alive) setError(errorText(err, '岗位加载失败'))
      })
      .finally(() => {
        if (alive) setLoading(false)
      })
    return () => {
      alive = false
    }
  }, [jobId])

  if (loading || profileLoading) return <PageLoading label="正在加载岗位详情…" />

  if (!job) {
    return (
      <Card className="gap-0 rounded-2xl py-0">
        <CardContent className="grid min-h-[260px] place-items-center text-center">
          <div>
            <p className="text-sm font-semibold">{error || '岗位不存在或已关闭'}</p>
            <Button variant="outline" size="sm" className="mt-3" asChild>
              <Link to="/seeker/jobs">返回岗位列表</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  const canApply = Boolean(profile?.can_apply)
  const missing = seekerMissingLabels(profile?.missing_fields ?? [])

  async function handleApply() {
    if (!job || !canApply || job.applied || applying) return
    setApplying(true)
    setError('')
    try {
      await seekerJobsApi.apply(job.id)
      setJob({ ...job, applied: true })
      setConfirmOpen(false)
      setNotice('投递成功，已写入我的投递。')
    } catch (err) {
      setConfirmOpen(false)
      setError(errorText(err, '投递失败，请重试'))
    } finally {
      setApplying(false)
    }
  }

  return (
    <>
      <header className="mb-5">
        <Button variant="ghost" size="sm" className="-ml-2 print:hidden" asChild>
          <Link to="/seeker/jobs">
            <ArrowLeft />
            返回岗位列表
          </Link>
        </Button>
        <div className="mt-3 flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-semibold tracking-tight md:text-[30px]">
                {job.title}
              </h1>
              <Badge variant="success">真实岗位</Badge>
            </div>
            <p className="mt-2 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <Building2 className="size-3.5" />
                {job.company.name}
              </span>
              <span className="flex items-center gap-1.5">
                <MapPin className="size-3.5" />
                {cityOf(job.company.address)}
              </span>
              <span className="flex items-center gap-1.5">
                <Users className="size-3.5" />
                招 {job.headcount} 人
              </span>
            </p>
          </div>
          <span className="text-lg font-semibold text-primary">
            {formatSalaryRange(job.salary_min, job.salary_max)}
          </span>
        </div>
      </header>

      {notice ? (
        <Alert className="mb-5 border-emerald-200/80 bg-emerald-50 text-emerald-900">
          <AlertDescription className="text-emerald-900/90">
            {notice}
          </AlertDescription>
        </Alert>
      ) : null}

      {error ? (
        <Alert
          variant="destructive"
          className="mb-5 border-destructive/20 bg-destructive/5"
        >
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
        <div className="space-y-5">
          <Card className="gap-0 rounded-2xl border-border/70 py-0 shadow-sm ring-0">
            <CardHeader className="border-b border-border/60 px-5 py-4">
              <CardTitle className="text-[15px] font-semibold">岗位要求</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 px-5 py-5 text-sm leading-relaxed">
              <p className="whitespace-pre-wrap text-foreground/85">
                {job.requirement || '岗位要求待补充'}
              </p>
              <div className="border-t border-dashed border-border/70 pt-4">
                <p className="text-xs font-medium text-muted-foreground">其他要求</p>
                <p className="mt-1.5 text-foreground/85">
                  {job.other_requirement || '无'}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="gap-0 rounded-2xl border-border/70 py-0 shadow-sm ring-0">
            <CardHeader className="border-b border-border/60 px-5 py-4">
              <CardTitle className="text-[15px] font-semibold">企业信息</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 px-5 py-5 text-sm text-muted-foreground">
              <p className="flex items-center gap-2">
                <BriefcaseBusiness className="size-4" />
                {job.company.name} · {job.company.industry}
              </p>
              <p className="flex items-center gap-2">
                <MapPin className="size-4" />
                {job.company.address}
              </p>
              <p className="flex items-center gap-2">
                <CalendarDays className="size-4" />
                发布于 {job.published_at ? formatDateTime(job.published_at) : '—'}
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4 lg:sticky lg:top-24">
          <Card className="gap-0 rounded-2xl border-border/70 py-0 shadow-sm ring-0">
            <CardContent className="space-y-3 px-5 py-5">
              <div className="flex flex-wrap gap-1.5">
                <Badge variant="neutral">{job.company.industry}</Badge>
                <Badge variant={job.company.verified ? 'success' : 'neutral'}>
                  {job.company.verified ? '已认证企业' : '未认证企业'}
                </Badge>
              </div>
              {!canApply ? (
                <Alert className="border-amber-200/80 bg-amber-50 text-amber-900">
                  <AlertDescription className="text-amber-900/90">
                    资料未完整，暂不能投递。缺少：{missing.join('、')}。
                    <Link className="ml-1 font-medium underline" to="/seeker/profile">
                      去完善
                    </Link>
                  </AlertDescription>
                </Alert>
              ) : null}
              <Button
                className="w-full"
                size="lg"
                disabled={job.applied || !canApply || applying}
                onClick={() => setConfirmOpen(true)}
              >
                {applying ? <LoaderCircle className="animate-spin" /> : null}
                {job.applied ? '已投递' : canApply ? '投递简历' : '资料未完整'}
              </Button>
              <p className="text-[11px] leading-relaxed text-muted-foreground">
                投递会写入后端；同一岗位不可重复投递。
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        title="确认投递"
        message={`确认向「${job.company.name}」投递「${job.title}」吗？`}
        confirmText="确认投递"
        loading={applying}
        onConfirm={() => void handleApply()}
        onClose={() => setConfirmOpen(false)}
      />
    </>
  )
}
