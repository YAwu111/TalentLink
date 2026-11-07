import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Building2,
  CalendarDays,
  CheckCircle2,
  Mail,
  XCircle,
} from 'lucide-react'

import {
  OFFER_STATUS_META,
  seekerOffersApi,
  type SeekerOffer,
} from '@/api/offers'
import { StaggerText } from '@/components/company/StaggerText'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { PageLoading } from '@/components/ui/page-loading'
import { usePageTitle } from '@/hooks/usePageTitle'
import { errorText } from '@/lib/error'
import { formatDateTime } from '@/lib/format'
import { offerSalaryText } from '@/lib/seeker'

type PendingAction = { offer: SeekerOffer; action: 'accept' | 'decline' }

export function SeekerOffersPage() {
  usePageTitle('录用通知')
  const [offers, setOffers] = useState<SeekerOffer[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [pending, setPending] = useState<PendingAction | null>(null)
  const [actionLoading, setActionLoading] = useState(false)

  async function loadOffers() {
    setLoading(true)
    setError('')
    try {
      setOffers(await seekerOffersApi.list())
    } catch (err) {
      setError(errorText(err, '录用通知加载失败'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadOffers()
  }, [])

  const accepted = useMemo(
    () => offers.find((offer) => offer.status === 'accepted'),
    [offers],
  )
  const pendingOffers = offers.filter((offer) => offer.status === 'sent')
  const history = offers.filter((offer) => offer.status !== 'sent')

  async function confirmAction() {
    if (!pending || actionLoading) return
    setActionLoading(true)
    setError('')
    setNotice('')
    try {
      if (pending.action === 'accept') {
        await seekerOffersApi.accept(pending.offer.id)
        setNotice(
          `已接受「${pending.offer.company_name}」的录用通知，其他待回应通知已自动失效。`,
        )
      } else {
        await seekerOffersApi.decline(pending.offer.id)
        setNotice(`已拒绝「${pending.offer.company_name}」的录用通知。`)
      }
      setPending(null)
      await loadOffers()
    } catch (err) {
      setPending(null)
      setError(errorText(err, '操作失败，请重试'))
    } finally {
      setActionLoading(false)
    }
  }

  if (loading && offers.length === 0) {
    return <PageLoading label="正在加载录用通知…" />
  }

  return (
    <>
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold tracking-[0.16em] text-primary uppercase">
            求职者中心
          </p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight md:text-[30px]">
            <StaggerText text="录用通知" />
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            可以同时收到多家企业的录用通知，但只能接受一个；接受后其他待回应通知会自动失效。
          </p>
        </div>
        <Button variant="outline" size="sm" asChild>
          <Link to="/seeker/applications">返回我的投递</Link>
        </Button>
      </header>

      {accepted ? (
        <Alert className="mt-5 border-emerald-200/80 bg-emerald-50 text-emerald-900">
          <CheckCircle2 />
          <AlertDescription className="text-emerald-900/90">
            你已接受「{accepted.company_name}」的「{accepted.job_title}」录用通知。
            其他企业的待回应通知已自动失效。
          </AlertDescription>
        </Alert>
      ) : pendingOffers.length > 1 ? (
        <Alert className="mt-5 border-amber-200/80 bg-amber-50 text-amber-900">
          <AlertDescription className="text-amber-900/90">
            当前有 {pendingOffers.length} 个待回应通知，接受其中一个后其余会自动拒绝。
          </AlertDescription>
        </Alert>
      ) : null}

      {notice && !accepted ? (
        <Alert className="mt-5 border-emerald-200/80 bg-emerald-50 text-emerald-900">
          <CheckCircle2 />
          <AlertDescription className="text-emerald-900/90">
            {notice}
          </AlertDescription>
        </Alert>
      ) : null}
      {error ? (
        <Alert
          variant="destructive"
          className="mt-5 border-destructive/20 bg-destructive/5"
        >
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      {offers.length === 0 ? (
        <Card className="mt-5 gap-0 rounded-2xl border-dashed border-border/80 py-0 shadow-none ring-0">
          <CardContent className="grid min-h-[240px] place-items-center text-center">
            <div>
              <Mail className="mx-auto size-8 text-muted-foreground" />
              <p className="mt-3 text-sm font-semibold">还没有录用通知</p>
              <p className="mt-1 text-xs text-muted-foreground">
                企业发送录用通知后会出现在这里。
              </p>
              <Button size="sm" className="mt-3" asChild>
                <Link to="/seeker/applications">查看我的投递</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="mt-5 space-y-5">
          {pendingOffers.length > 0 ? (
            <section>
              <h2 className="text-sm font-semibold">待回应</h2>
              <div className="mt-3 grid gap-3">
                {pendingOffers.map((offer) => {
                  const meta = OFFER_STATUS_META[offer.status]
                  return (
                    <article
                      key={offer.id}
                      className="rounded-2xl border border-border/70 bg-card p-5 shadow-sm"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-base font-semibold">
                              {offer.job_title}
                            </h3>
                            <Badge variant={meta.variant}>{meta.label}</Badge>
                          </div>
                          <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                            <Building2 className="size-3.5" />
                            {offer.company_name}
                            <span className="text-border">·</span>
                            {offer.city}
                          </p>
                        </div>
                        <span className="text-lg font-semibold text-primary">
                          {offerSalaryText(offer.salary)}
                        </span>
                      </div>
                      <div className="mt-4 grid gap-2 border-t border-dashed border-border/70 pt-3 text-xs text-muted-foreground sm:grid-cols-2">
                        <p className="flex items-center gap-1.5">
                          <CalendarDays className="size-3.5" />
                          入职日期：{offer.start_date ?? '待沟通'}
                        </p>
                        <p>发送于 {formatDateTime(offer.sent_at)}</p>
                      </div>
                      {offer.message ? (
                        <p className="mt-3 rounded-lg bg-muted/40 px-3 py-2 text-xs leading-relaxed text-muted-foreground">
                          {offer.message}
                        </p>
                      ) : null}
                      <div className="mt-4 flex flex-wrap justify-end gap-2">
                        {accepted ? (
                          <span className="text-xs text-muted-foreground">
                            已接受其他录用通知
                          </span>
                        ) : (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                setPending({ offer, action: 'decline' })
                              }
                            >
                              <XCircle />
                              拒绝
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => setPending({ offer, action: 'accept' })}
                            >
                              <CheckCircle2 />
                              接受录用
                            </Button>
                          </>
                        )}
                      </div>
                    </article>
                  )
                })}
              </div>
            </section>
          ) : null}

          {history.length > 0 ? (
            <section>
              <h2 className="text-sm font-semibold">已处理</h2>
              <div className="mt-3 grid gap-3">
                {history.map((offer) => {
                  const meta = OFFER_STATUS_META[offer.status]
                  return (
                    <article
                      key={offer.id}
                      className="rounded-2xl border border-border/70 bg-card p-4 shadow-sm"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-sm font-semibold">
                              {offer.job_title}
                            </span>
                            <Badge variant={meta.variant}>{meta.label}</Badge>
                          </div>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {offer.company_name} · {offerSalaryText(offer.salary)}
                            {offer.start_date ? ` · 入职 ${offer.start_date}` : ''}
                          </p>
                        </div>
                        {offer.responded_at ? (
                          <span className="text-xs text-muted-foreground">
                            {formatDateTime(offer.responded_at)}
                          </span>
                        ) : null}
                      </div>
                    </article>
                  )
                })}
              </div>
            </section>
          ) : null}
        </div>
      )}

      <ConfirmDialog
        open={Boolean(pending)}
        title={pending?.action === 'accept' ? '接受录用通知' : '拒绝录用通知'}
        message={
          pending?.action === 'accept'
            ? `确认接受「${pending?.offer.company_name}」的「${pending?.offer.job_title}」录用通知吗？接受后其他待回应通知会自动失效。`
            : `确认拒绝「${pending?.offer.company_name}」的录用通知吗？`
        }
        confirmText={pending?.action === 'accept' ? '确认接受' : '确认拒绝'}
        loading={actionLoading}
        onConfirm={() => void confirmAction()}
        onClose={() => setPending(null)}
      />
    </>
  )
}
