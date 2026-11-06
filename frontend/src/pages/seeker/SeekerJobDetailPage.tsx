import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  BriefcaseBusiness,
  Building2,
  CalendarDays,
  MapPin,
  Users,
} from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { PageLoading } from '@/components/ui/page-loading'
import { usePageTitle } from '@/hooks/usePageTitle'
import { useSeekerProfile } from '@/hooks/useSeekerProfile'
import {
  formatSalaryRange,
  getMockJob,
} from '@/lib/mock-seeker'
import { seekerMissingLabels } from '@/lib/seeker'
import { formatDateTime } from '@/lib/format'
import { useMockApplications } from '@/stores/mockApplications'

export function SeekerJobDetailPage() {
  const { id } = useParams()
  const job = getMockJob(Number(id))
  usePageTitle(job?.title ?? '岗位详情')

  const { profile, loading, error } = useSeekerProfile()
  const applications = useMockApplications((state) => state.applications)
  const apply = useMockApplications((state) => state.apply)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [notice, setNotice] = useState('')

  if (!job) {
    return (
      <Card className="gap-0 rounded-2xl py-0">
        <CardContent className="grid min-h-[260px] place-items-center text-center">
          <div>
            <p className="text-sm font-semibold">岗位不存在</p>
            <Button variant="outline" size="sm" className="mt-3" asChild>
              <Link to="/seeker/jobs">返回岗位列表</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (loading) return <PageLoading label="正在加载岗位详情…" />

  const applied = applications.some((item) => item.jobId === job.id)
  const canApply = Boolean(profile?.can_apply)
  const missing = seekerMissingLabels(profile?.missing_fields ?? [])

  function handleApply() {
    if (!job || !canApply || applied) return
    const ok = apply(job)
    setConfirmOpen(false)
    if (ok) setNotice('投递成功（演示数据，仅保存在当前页面内存）。')
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
              <Badge variant="neutral">演示岗位</Badge>
            </div>
            <p className="mt-2 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <Building2 className="size-3.5" />
                {job.companyName}
              </span>
              <span className="flex items-center gap-1.5">
                <MapPin className="size-3.5" />
                {job.city}
              </span>
              <span className="flex items-center gap-1.5">
                <Users className="size-3.5" />
                招 {job.headcount} 人
              </span>
            </p>
          </div>
          <span className="text-lg font-semibold text-primary">
            {formatSalaryRange(job.salaryMin, job.salaryMax)}
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
                {job.requirement}
              </p>
              <div className="border-t border-dashed border-border/70 pt-4">
                <p className="text-xs font-medium text-muted-foreground">其他要求</p>
                <p className="mt-1.5 text-foreground/85">
                  {job.otherRequirement}
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
                {job.companyName} · {job.industry}
              </p>
              <p className="flex items-center gap-2">
                <MapPin className="size-4" />
                {job.city}
              </p>
              <p className="flex items-center gap-2">
                <CalendarDays className="size-4" />
                发布于 {formatDateTime(job.publishedAt)}
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4 lg:sticky lg:top-24">
          <Card className="gap-0 rounded-2xl border-border/70 py-0 shadow-sm ring-0">
            <CardContent className="space-y-3 px-5 py-5">
              <div className="flex flex-wrap gap-1.5">
                {job.tags.map((tag) => (
                  <Badge key={tag} variant="neutral">
                    {tag}
                  </Badge>
                ))}
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
                disabled={applied || !canApply}
                onClick={() => setConfirmOpen(true)}
              >
                {applied ? '已投递' : canApply ? '投递简历' : '资料未完整'}
              </Button>
              <p className="text-[11px] leading-relaxed text-muted-foreground">
                当前为演示投递，不会写入后端；刷新页面后恢复初始数据。
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        title="确认投递"
        message={`确认向「${job.companyName}」投递「${job.title}」吗？本次为演示投递。`}
        confirmText="确认投递"
        onConfirm={handleApply}
        onClose={() => setConfirmOpen(false)}
      />
    </>
  )
}
