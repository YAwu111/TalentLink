import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  LoaderCircle,
  Mail,
  Phone,
  Printer,
  UserRound,
  XCircle,
} from 'lucide-react'

import {
  employerApplicationsApi,
  type EmployerApplicationDetail,
  type EmployerStatusTarget,
} from '@/api/employerApplications'
import { APPLICATION_STATUS_META } from '@/api/jobs'
import { ResumeDocument } from '@/components/seeker/ResumeDocument'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { PageLoading } from '@/components/ui/page-loading'
import { usePageTitle } from '@/hooks/usePageTitle'
import { errorText } from '@/lib/error'
import { formatDateTime } from '@/lib/format'
import { salaryText } from '@/lib/seeker'

export function EmployerApplicationDetailPage() {
  const { id } = useParams()
  const applicationId = Number(id)
  const [detail, setDetail] = useState<EmployerApplicationDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [actionLoading, setActionLoading] = useState<EmployerStatusTarget | null>(
    null,
  )
  const [rejectOpen, setRejectOpen] = useState(false)

  usePageTitle(detail ? `${detail.seeker.name} · 投递详情` : '投递详情')

  useEffect(() => {
    let alive = true
    setLoading(true)
    setError('')
    employerApplicationsApi
      .detail(applicationId)
      .then((data) => {
        if (alive) setDetail(data)
      })
      .catch((err) => {
        if (alive) setError(errorText(err, '投递详情加载失败'))
      })
      .finally(() => {
        if (alive) setLoading(false)
      })
    return () => {
      alive = false
    }
  }, [applicationId])

  async function updateStatus(target: EmployerStatusTarget) {
    if (!detail || actionLoading) return
    setActionLoading(target)
    setError('')
    setNotice('')
    try {
      const updated = await employerApplicationsApi.updateStatus(
        detail.application.id,
        target,
      )
      setDetail(updated)
      setNotice(`状态已更新为「${APPLICATION_STATUS_META[target].label}」。`)
      setRejectOpen(false)
    } catch (err) {
      setRejectOpen(false)
      setError(errorText(err, '状态更新失败'))
    } finally {
      setActionLoading(null)
    }
  }

  if (loading) return <PageLoading label="正在加载投递详情…" />
  if (!detail) {
    return (
      <div className="space-y-4">
        <Alert
          variant="destructive"
          className="border-destructive/20 bg-destructive/5"
        >
          <AlertDescription>{error || '投递记录不存在'}</AlertDescription>
        </Alert>
        <Button variant="outline" size="sm" asChild>
          <Link to="/employer/applications">
            <ArrowLeft />
            返回投递管理
          </Link>
        </Button>
      </div>
    )
  }

  const { application, seeker } = detail
  const meta = APPLICATION_STATUS_META[application.status]
  const canMarkViewed = application.status === 'submitted'
  const canInterview =
    application.status === 'submitted' || application.status === 'viewed'
  const canReject =
    application.status === 'submitted' ||
    application.status === 'viewed' ||
    application.status === 'interview'

  return (
    <>
      <header className="mb-5 flex flex-wrap items-end justify-between gap-4 print:hidden">
        <div>
          <Button variant="ghost" size="sm" className="-ml-2" asChild>
            <Link to="/employer/applications">
              <ArrowLeft />
              返回投递管理
            </Link>
          </Button>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight md:text-[28px]">
              {seeker.name} 的简历
            </h1>
            <Badge variant={meta.variant}>{meta.label}</Badge>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            投递岗位：{application.job_title} · {formatDateTime(application.applied_at)}
          </p>
        </div>
        <Button variant="outline" onClick={() => window.print()}>
          <Printer />
          打印简历
        </Button>
      </header>

      {notice ? (
        <Alert className="mb-5 border-emerald-200/80 bg-emerald-50 text-emerald-900 print:hidden">
          <CheckCircle2 />
          <AlertDescription className="text-emerald-900/90">
            {notice}
          </AlertDescription>
        </Alert>
      ) : null}
      {error ? (
        <Alert
          variant="destructive"
          className="mb-5 border-destructive/20 bg-destructive/5 print:hidden"
        >
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
        <div className="min-w-0">
          <ResumeDocument profile={seeker} />
        </div>

        <div className="space-y-4 print:hidden lg:sticky lg:top-24">
          <Card className="gap-0 rounded-2xl border-border/70 py-0 shadow-sm ring-0">
            <CardHeader className="border-b border-border/60 px-5 py-4">
              <CardTitle className="flex items-center gap-2 text-[15px] font-semibold">
                <UserRound className="size-4 text-muted-foreground" />
                求职者信息
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2.5 px-5 py-4 text-xs text-muted-foreground">
              <p className="flex items-center gap-2">
                <Phone className="size-3.5" />
                {seeker.phone || '未填写'}
              </p>
              <p className="flex items-center gap-2">
                <Mail className="size-3.5" />
                {seeker.email || '未填写'}
              </p>
              <p className="flex items-center gap-2">
                <CalendarDays className="size-3.5" />
                投递于 {formatDateTime(application.applied_at)}
              </p>
              <p className="border-t border-dashed border-border/70 pt-2.5">
                期望薪资：
                <span className="font-medium text-foreground">
                  {salaryText(
                    seeker.expected_salary_min,
                    seeker.expected_salary_max,
                  )}
                </span>
              </p>
              <p>
                求职意向：
                <span className="text-foreground">{seeker.job_intention || '未填写'}</span>
              </p>
              {application.note ? (
                <p className="rounded-lg bg-muted/40 px-3 py-2">
                  留言：{application.note}
                </p>
              ) : null}
            </CardContent>
          </Card>

          <Card className="gap-0 rounded-2xl border-border/70 py-0 shadow-sm ring-0">
            <CardHeader className="border-b border-border/60 px-5 py-4">
              <CardTitle className="text-[15px] font-semibold">投递状态</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 px-5 py-4">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">当前状态</span>
                <Badge variant={meta.variant}>{meta.label}</Badge>
              </div>
              {canMarkViewed || canInterview || canReject ? (
                <div className="grid gap-2 border-t border-dashed border-border/70 pt-3">
                  {canMarkViewed ? (
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={Boolean(actionLoading)}
                      onClick={() => void updateStatus('viewed')}
                    >
                      {actionLoading === 'viewed' ? (
                        <LoaderCircle className="animate-spin" />
                      ) : (
                        <CheckCircle2 />
                      )}
                      标记已查看
                    </Button>
                  ) : null}
                  {canInterview ? (
                    <Button
                      size="sm"
                      disabled={Boolean(actionLoading)}
                      onClick={() => void updateStatus('interview')}
                    >
                      {actionLoading === 'interview' ? (
                        <LoaderCircle className="animate-spin" />
                      ) : (
                        <CalendarDays />
                      )}
                      安排面试
                    </Button>
                  ) : null}
                  {canReject ? (
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-destructive hover:text-destructive"
                      disabled={Boolean(actionLoading)}
                      onClick={() => setRejectOpen(true)}
                    >
                      <XCircle />
                      标记不合适
                    </Button>
                  ) : null}
                </div>
              ) : (
                <p className="border-t border-dashed border-border/70 pt-3 text-xs leading-relaxed text-muted-foreground">
                  {application.status === 'offered'
                    ? '该投递已进入录用阶段，暂不支持在此修改。'
                    : '该投递已结束，不能继续修改状态。'}
                </p>
              )}
            </CardContent>
          </Card>

          <p className="text-[11px] leading-relaxed text-muted-foreground">
            简历由求职者资料自动生成；企业修改状态后，求职者可在「我的投递」中看到最新状态。
          </p>
        </div>
      </div>

      <ConfirmDialog
        open={rejectOpen}
        title="标记为不合适"
        message={`确认将「${seeker.name}」的投递标记为未通过吗？标记后不能恢复。`}
        confirmText="确认标记"
        loading={actionLoading === 'rejected'}
        onConfirm={() => void updateStatus('rejected')}
        onClose={() => setRejectOpen(false)}
      />
    </>
  )
}
