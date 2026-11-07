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
  Send,
  UserRound,
  XCircle,
} from 'lucide-react'

import {
  employerApplicationsApi,
  type EmployerApplicationDetail,
  type EmployerStatusTarget,
} from '@/api/employerApplications'
import { APPLICATION_STATUS_META } from '@/api/jobs'
import {
  OFFER_STATUS_META,
  employerOffersApi,
} from '@/api/offers'
import { ResumeDocument } from '@/components/seeker/ResumeDocument'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Field } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { PageLoading } from '@/components/ui/page-loading'
import { Textarea } from '@/components/ui/textarea'
import { usePageTitle } from '@/hooks/usePageTitle'
import { errorText } from '@/lib/error'
import { formatDateTime } from '@/lib/format'
import { offerSalaryText, salaryText } from '@/lib/seeker'

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
  const [offerOpen, setOfferOpen] = useState(false)
  const [offerSaving, setOfferSaving] = useState(false)
  const [revokeOpen, setRevokeOpen] = useState(false)
  const [offerForm, setOfferForm] = useState({
    salary: '',
    start_date: '',
    message: '',
  })

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

  async function refreshDetail() {
    const updated = await employerApplicationsApi.detail(applicationId)
    setDetail(updated)
  }

  function openOfferDialog() {
    if (!detail) return
    const current = detail.offer
    setOfferForm({
      salary: String(
        current?.salary ?? detail.seeker.expected_salary_min ?? '',
      ),
      start_date: current?.start_date ?? '',
      message: current?.message ?? '',
    })
    setOfferOpen(true)
    setError('')
  }

  async function saveOffer() {
    if (!detail || offerSaving) return
    const salary = Number(offerForm.salary)
    if (!Number.isFinite(salary) || salary <= 0) {
      setError('录用薪资必须大于 0')
      return
    }
    setOfferSaving(true)
    setError('')
    setNotice('')
    try {
      await employerOffersApi.send(detail.application.id, {
        salary,
        start_date: offerForm.start_date || null,
        message: offerForm.message,
      })
      await refreshDetail()
      setOfferOpen(false)
      setNotice('录用通知已发送，等待求职者回应。')
    } catch (err) {
      setOfferOpen(false)
      setError(errorText(err, '录用通知发送失败'))
    } finally {
      setOfferSaving(false)
    }
  }

  async function revokeOffer() {
    if (!detail || offerSaving) return
    setOfferSaving(true)
    setError('')
    setNotice('')
    try {
      await employerOffersApi.revoke(detail.application.id)
      await refreshDetail()
      setRevokeOpen(false)
      setNotice('录用通知已撤回。')
    } catch (err) {
      setRevokeOpen(false)
      setError(errorText(err, '撤回录用通知失败'))
    } finally {
      setOfferSaving(false)
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

  const { application, seeker, offer } = detail
  const meta = APPLICATION_STATUS_META[application.status]
  const offerMeta = offer ? OFFER_STATUS_META[offer.status] : null
  const canMarkViewed = application.status === 'submitted'
  const canInterview =
    application.status === 'submitted' || application.status === 'viewed'
  const canReject =
    application.status === 'submitted' ||
    application.status === 'viewed' ||
    application.status === 'interview'
  const activeApplication =
    application.status === 'submitted' ||
    application.status === 'viewed' ||
    application.status === 'interview'
  const canSendOffer =
    (activeApplication || application.status === 'offered') &&
    (!offer || offer.status === 'sent' || offer.status === 'revoked')
  const canRevokeOffer = offer?.status === 'sent'

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

          <Card className="gap-0 rounded-2xl border-border/70 py-0 shadow-sm ring-0">
            <CardHeader className="border-b border-border/60 px-5 py-4">
              <CardTitle className="flex items-center gap-2 text-[15px] font-semibold">
                <Send className="size-4 text-muted-foreground" />
                录用通知
                {offerMeta ? (
                  <Badge variant={offerMeta.variant}>{offerMeta.label}</Badge>
                ) : null}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 px-5 py-4">
              {offer ? (
                <div className="space-y-2 text-xs text-muted-foreground">
                  <p className="flex items-center justify-between">
                    <span>录用薪资</span>
                    <span className="font-medium text-foreground">
                      {offerSalaryText(offer.salary)}
                    </span>
                  </p>
                  <p className="flex items-center justify-between">
                    <span>入职日期</span>
                    <span className="text-foreground">
                      {offer.start_date ?? '待沟通'}
                    </span>
                  </p>
                  <p className="flex items-center justify-between">
                    <span>发送时间</span>
                    <span>{formatDateTime(offer.sent_at)}</span>
                  </p>
                  {offer.message ? (
                    <p className="rounded-lg bg-muted/40 px-3 py-2 leading-relaxed">
                      {offer.message}
                    </p>
                  ) : null}
                  {offer.status === 'accepted' ? (
                    <p className="rounded-lg bg-emerald-50 px-3 py-2 text-emerald-900">
                      求职者已接受该录用通知。
                    </p>
                  ) : null}
                </div>
              ) : (
                <p className="text-xs leading-relaxed text-muted-foreground">
                  还没有发送录用通知。发放后求职者可在「录用通知」中接受或拒绝。
                </p>
              )}

              {canSendOffer ? (
                <Button
                  variant={offer ? 'outline' : 'default'}
                  size="sm"
                  className="w-full"
                  disabled={offerSaving}
                  onClick={openOfferDialog}
                >
                  <Send />
                  {offer?.status === 'sent'
                    ? '修改录用通知'
                    : offer
                      ? '重新发放录用通知'
                      : '发放录用通知'}
                </Button>
              ) : null}
              {canRevokeOffer ? (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full text-destructive hover:text-destructive"
                  disabled={offerSaving}
                  onClick={() => setRevokeOpen(true)}
                >
                  <XCircle />
                  撤回录用通知
                </Button>
              ) : null}
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

      <ConfirmDialog
        open={revokeOpen}
        title="撤回录用通知"
        message={`确认撤回发给「${seeker.name}」的录用通知吗？撤回后可重新发送。`}
        confirmText="确认撤回"
        loading={offerSaving}
        onConfirm={() => void revokeOffer()}
        onClose={() => setRevokeOpen(false)}
      />

      <Dialog open={offerOpen} onOpenChange={setOfferOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{offer ? '修改录用通知' : '发放录用通知'}</DialogTitle>
            <DialogDescription>
              发送后求职者可在「录用通知」中接受或拒绝；同一求职者只能接受一个。
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4">
            <Field label="录用薪资" htmlFor="offer-salary" required hint="元/月">
              <Input
                id="offer-salary"
                type="number"
                min={1}
                value={offerForm.salary}
                onChange={(event) =>
                  setOfferForm({ ...offerForm, salary: event.target.value })
                }
              />
            </Field>
            <Field label="入职日期" htmlFor="offer-start">
              <Input
                id="offer-start"
                type="date"
                value={offerForm.start_date}
                onChange={(event) =>
                  setOfferForm({ ...offerForm, start_date: event.target.value })
                }
              />
            </Field>
            <Field label="录用说明" htmlFor="offer-message">
              <Textarea
                id="offer-message"
                rows={3}
                maxLength={2000}
                value={offerForm.message}
                placeholder="给求职者的补充说明"
                onChange={(event) =>
                  setOfferForm({ ...offerForm, message: event.target.value })
                }
              />
            </Field>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOfferOpen(false)}>
              取消
            </Button>
            <Button onClick={() => void saveOffer()} disabled={offerSaving}>
              {offerSaving ? <LoaderCircle className="animate-spin" /> : null}
              发送录用通知
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
