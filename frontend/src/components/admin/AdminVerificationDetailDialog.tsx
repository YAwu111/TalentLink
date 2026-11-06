import {
  AlertCircle,
  BadgeCheck,
  Clock3,
  Download,
  FileText,
  LoaderCircle,
  RefreshCw,
  ShieldCheck,
} from 'lucide-react'

import type { AdminVerificationDetail, VerificationEvent } from '@/api/admin'
import { adminApi } from '@/api/admin'
import type { ReviewMode } from '@/components/admin/ReviewActionDialog'
import { VerificationStatusBadge } from '@/components/admin/VerificationStatusBadge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { formatFileSize } from '@/lib/file'
import { formatDateTime } from '@/lib/format'

interface AdminVerificationDetailDialogProps {
  open: boolean
  detail: AdminVerificationDetail | null
  loading: boolean
  error: string
  onClose: () => void
  onRetry: () => void
  onAction: (mode: ReviewMode) => void
}

const STATUS_TEXT: Record<string, string> = {
  pending: '待审核',
  approved: '已通过',
  rejected: '已驳回',
  revoked: '已撤销',
}

function EventRow({ event }: { event: VerificationEvent }) {
  return (
    <li className="relative border-l border-border/80 pb-4 pl-4 last:pb-0">
      <span className="absolute top-1 -left-[5px] size-2.5 rounded-full border-2 border-card bg-primary" />
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-medium">
          {event.from_status ? `${STATUS_TEXT[event.from_status]} → ` : '提交申请 → '}
          {STATUS_TEXT[event.to_status]}
        </span>
        <span className="text-[11px] text-muted-foreground">
          {event.actor_name ?? '系统'}
        </span>
      </div>
      {event.note ? (
        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
          {event.note}
        </p>
      ) : null}
      <p className="mt-1 text-[10.5px] text-muted-foreground">
        {formatDateTime(event.created_at)}
      </p>
    </li>
  )
}

export function AdminVerificationDetailDialog({
  open,
  detail,
  loading,
  error,
  onClose,
  onRetry,
  onAction,
}: AdminVerificationDetailDialogProps) {
  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) onClose()
      }}
    >
      <DialogContent className="flex max-h-[88vh] flex-col gap-0 overflow-hidden p-0 sm:max-w-3xl">
        <div className="min-h-0 flex-1 space-y-5 overflow-y-auto p-5">
          <DialogHeader>
          <DialogTitle className="flex flex-wrap items-center gap-2">
            认证审核详情
            {detail ? (
              <VerificationStatusBadge status={detail.verification.status} />
            ) : null}
          </DialogTitle>
          <DialogDescription>
            {detail
              ? `${detail.company.name} · 第 ${detail.verification.version} 次申请 · ${formatDateTime(detail.verification.submitted_at)}`
              : '查看企业提交的认证材料与审核记录'}
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="grid min-h-[300px] place-items-center">
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <LoaderCircle className="size-4 animate-spin" />
              正在加载审核详情…
            </p>
          </div>
        ) : error ? (
          <div className="space-y-3">
            <Alert
              variant="destructive"
              className="border-destructive/20 bg-destructive/5"
            >
              <AlertCircle />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
            <Button variant="outline" size="sm" onClick={onRetry}>
              <RefreshCw />
              重试
            </Button>
          </div>
        ) : detail ? (
          <>
            <section className="rounded-xl border border-border/70 bg-muted/20 p-4">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-sm font-semibold">{detail.company.name}</h3>
                {detail.company.verified ? (
                  <Badge variant="success">
                    <BadgeCheck />
                    当前已认证
                  </Badge>
                ) : (
                  <Badge variant="neutral">当前未认证</Badge>
                )}
                <Badge variant="info">
                  完整度 {detail.company.completeness}%
                </Badge>
              </div>
              <dl className="mt-3 grid gap-2 text-xs sm:grid-cols-2">
                <div>
                  <dt className="text-muted-foreground">经营行业</dt>
                  <dd className="mt-0.5">{detail.company.industry || '—'}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">企业电话</dt>
                  <dd className="mt-0.5">{detail.company.phone || '—'}</dd>
                </div>
                <div className="sm:col-span-2">
                  <dt className="text-muted-foreground">企业地址</dt>
                  <dd className="mt-0.5">{detail.company.address || '—'}</dd>
                </div>
                <div className="sm:col-span-2">
                  <dt className="text-muted-foreground">企业简介</dt>
                  <dd className="mt-0.5 leading-relaxed">
                    {detail.company.intro || '—'}
                  </dd>
                </div>
              </dl>
            </section>

            <section>
              <h3 className="flex items-center gap-2 text-sm font-semibold">
                <FileText className="size-4 text-muted-foreground" />
                认证材料
              </h3>
              <div className="mt-2 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border/70 p-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">
                    {detail.verification.document.original_name}
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {formatFileSize(detail.verification.document.size)} ·{' '}
                    {detail.verification.document.mime_type}
                  </p>
                </div>
                <Button variant="outline" size="sm" asChild>
                  <a
                    href={adminApi.fileUrl(detail.verification.id)}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <Download className="size-4" />
                    下载材料
                  </a>
                </Button>
              </div>
            </section>

            {detail.verification.review_note ||
            detail.verification.reject_reason ? (
              <section className="rounded-xl border border-amber-200/80 bg-amber-50 p-3 text-amber-900">
                <p className="text-xs font-medium">审核说明</p>
                <p className="mt-1 whitespace-pre-wrap text-xs leading-relaxed">
                  {detail.verification.reject_reason ||
                    detail.verification.review_note}
                </p>
              </section>
            ) : null}

            <section>
              <h3 className="flex items-center gap-2 text-sm font-semibold">
                <ShieldCheck className="size-4 text-muted-foreground" />
                审核记录
              </h3>
              <ol className="mt-3">
                {detail.events.length > 0 ? (
                  detail.events.map((event) => (
                    <EventRow key={event.id} event={event} />
                  ))
                ) : (
                  <li className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Clock3 className="size-3.5" />
                    暂无审核事件
                  </li>
                )}
              </ol>
            </section>

            <section>
              <h3 className="text-sm font-semibold">历史申请</h3>
              <div className="mt-2 space-y-2">
                {detail.history.map((item) => (
                  <div
                    key={item.id}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border/60 px-3 py-2 text-xs"
                  >
                    <span className="font-medium">v{item.version}</span>
                    <VerificationStatusBadge status={item.status} />
                    <span className="text-muted-foreground">
                      提交 {formatDateTime(item.submitted_at)}
                    </span>
                  </div>
                ))}
              </div>
            </section>
          </>
        ) : null}
        </div>

        {detail && !loading && !error ? (
          <DialogFooter className="mx-0 mb-0 mt-0 rounded-none border-t bg-muted/40 p-4">
            {detail.verification.status === 'pending' ? (
              <>
                <Button
                  variant="outline"
                  className="text-destructive hover:text-destructive"
                  onClick={() => onAction('reject')}
                >
                  驳回
                </Button>
                <Button onClick={() => onAction('approve')}>通过认证</Button>
              </>
            ) : detail.verification.status === 'approved' ? (
              <Button variant="destructive" onClick={() => onAction('revoke')}>
                撤销认证
              </Button>
            ) : (
              <p className="text-xs text-muted-foreground">
                该申请已结束，企业可重新提交认证材料。
              </p>
            )}
          </DialogFooter>
        ) : null}
      </DialogContent>
    </Dialog>
  )
}
