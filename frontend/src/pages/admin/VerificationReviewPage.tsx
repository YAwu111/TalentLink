import { useCallback, useEffect, useRef, useState } from 'react'
import {
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  ShieldCheck,
} from 'lucide-react'

import type {
  AdminVerificationDetail,
  AdminVerificationList,
  VerificationFilter,
} from '@/api/admin'
import { adminApi } from '@/api/admin'
import { AdminVerificationDetailDialog } from '@/components/admin/AdminVerificationDetailDialog'
import { AdminVerificationTable } from '@/components/admin/AdminVerificationTable'
import {
  ReviewActionDialog,
  type ReviewMode,
} from '@/components/admin/ReviewActionDialog'
import { StaggerText } from '@/components/company/StaggerText'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { usePageTitle } from '@/hooks/usePageTitle'
import { errorText } from '@/lib/error'

const PAGE_SIZE = 20

const FILTERS: { value: VerificationFilter; label: string }[] = [
  { value: 'pending', label: '待审核' },
  { value: 'approved', label: '已通过' },
  { value: 'rejected', label: '已驳回' },
  { value: 'revoked', label: '已撤销' },
  { value: 'all', label: '全部' },
]

const ACTION_SUCCESS: Record<ReviewMode, string> = {
  approve: '认证已通过，企业认证状态已更新。',
  reject: '认证已驳回，企业认证状态已更新。',
  revoke: '认证已撤销，企业认证状态已更新。',
}

export function VerificationReviewPage() {
  usePageTitle('认证审核')

  const [filter, setFilter] = useState<VerificationFilter>('pending')
  const [page, setPage] = useState(1)
  const [list, setList] = useState<AdminVerificationList | null>(null)
  const [loading, setLoading] = useState(true)
  const [listError, setListError] = useState('')

  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [detail, setDetail] = useState<AdminVerificationDetail | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [detailError, setDetailError] = useState('')

  const [actionMode, setActionMode] = useState<ReviewMode | null>(null)
  const [actionLoading, setActionLoading] = useState(false)
  const [actionError, setActionError] = useState('')
  const [success, setSuccess] = useState('')

  const listSequence = useRef(0)
  const detailSequence = useRef(0)

  const loadList = useCallback(async () => {
    const sequence = ++listSequence.current
    setLoading(true)
    setListError('')
    try {
      const data = await adminApi.list({
        status: filter,
        page,
        page_size: PAGE_SIZE,
      })
      if (sequence === listSequence.current) setList(data)
    } catch (error) {
      if (sequence === listSequence.current) {
        setListError(errorText(error, '认证申请列表加载失败'))
      }
    } finally {
      if (sequence === listSequence.current) setLoading(false)
    }
  }, [filter, page])

  useEffect(() => {
    void loadList()
  }, [loadList])

  function changeFilter(next: VerificationFilter) {
    if (next === filter) return
    setFilter(next)
    setPage(1)
    setSuccess('')
  }

  async function openDetail(id: number) {
    const sequence = ++detailSequence.current
    setSelectedId(id)
    setDetail(null)
    setDetailLoading(true)
    setDetailError('')
    try {
      const data = await adminApi.detail(id)
      if (sequence === detailSequence.current) setDetail(data)
    } catch (error) {
      if (sequence === detailSequence.current) {
        setDetailError(errorText(error, '审核详情加载失败'))
      }
    } finally {
      if (sequence === detailSequence.current) setDetailLoading(false)
    }
  }

  function closeDetail() {
    detailSequence.current += 1
    setSelectedId(null)
    setDetail(null)
    setDetailError('')
    setActionMode(null)
    setActionError('')
  }

  function openAction(mode: ReviewMode) {
    setActionMode(mode)
    setActionError('')
  }

  function closeAction() {
    if (actionLoading) return
    setActionMode(null)
    setActionError('')
  }

  async function confirmAction(value: string) {
    if (selectedId === null || actionMode === null) return
    setActionLoading(true)
    setActionError('')
    try {
      const updated =
        actionMode === 'approve'
          ? await adminApi.approve(selectedId, value)
          : actionMode === 'reject'
            ? await adminApi.reject(selectedId, value)
            : await adminApi.revoke(selectedId, value)
      setDetail(updated)
      setSuccess(ACTION_SUCCESS[actionMode])
      setActionMode(null)
      await loadList()
    } catch (error) {
      setActionError(errorText(error, '审核操作失败，请刷新后重试'))
    } finally {
      setActionLoading(false)
    }
  }

  const counts = list?.counts ?? {}
  const total = list?.total ?? 0
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const pendingCount = counts.pending ?? 0

  return (
    <>
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold tracking-[0.16em] text-primary uppercase">
            管理员
          </p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight md:text-[30px]">
            <StaggerText text="认证审核" />
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            审核企业提交的身份认证材料。通过后企业认证状态即时生效。
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="warning">
            <ShieldCheck />
            待审核 {pendingCount}
          </Badge>
          <Button
            variant="outline"
            size="sm"
            disabled={loading}
            onClick={() => void loadList()}
          >
            <RefreshCw className={loading ? 'animate-spin' : ''} />
            刷新
          </Button>
        </div>
      </header>

      {success ? (
        <Alert className="mt-6 border-emerald-200/80 bg-emerald-50 text-emerald-900">
          <ShieldCheck />
          <AlertDescription className="text-emerald-900/90">
            {success}
          </AlertDescription>
        </Alert>
      ) : null}

      <div className="mt-5 flex flex-wrap items-center gap-2">
        {FILTERS.map((item) => (
          <Button
            key={item.value}
            variant={filter === item.value ? 'default' : 'outline'}
            size="sm"
            onClick={() => changeFilter(item.value)}
          >
            {item.label}
            <span className="ml-1 tabular-nums opacity-70">
              {counts[item.value] ?? 0}
            </span>
          </Button>
        ))}
      </div>

      <Card className="mt-4 gap-0 rounded-2xl border-border/70 py-0 shadow-sm ring-0">
        <CardHeader className="flex flex-row items-center justify-between gap-3 border-b border-border/60 px-5 py-4">
          <CardTitle className="text-[15px] font-semibold">认证申请</CardTitle>
          <span className="text-xs text-muted-foreground">
            共 {total} 条
          </span>
        </CardHeader>
        <CardContent className="px-5 py-4">
          {listError ? (
            <div className="space-y-3">
              <Alert
                variant="destructive"
                className="border-destructive/20 bg-destructive/5"
              >
                <AlertCircle />
                <AlertDescription>{listError}</AlertDescription>
              </Alert>
              <Button variant="outline" size="sm" onClick={() => void loadList()}>
                <RefreshCw />
                重新加载
              </Button>
            </div>
          ) : !loading && (list?.items.length ?? 0) === 0 ? (
            <div className="grid min-h-[260px] place-items-center text-center">
              <div>
                <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-muted text-muted-foreground">
                  <ShieldCheck className="size-5" />
                </span>
                <p className="mt-3 text-sm font-semibold">
                  {filter === 'pending' ? '暂无待审核申请' : '当前筛选下没有申请'}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  企业提交身份认证材料后会出现在这里。
                </p>
              </div>
            </div>
          ) : (
            <AdminVerificationTable
              items={list?.items ?? []}
              loading={loading}
              onSelect={(id) => void openDetail(id)}
            />
          )}

          {!listError && total > PAGE_SIZE ? (
            <div className="mt-4 flex items-center justify-between border-t border-dashed border-border/70 pt-3">
              <span className="text-xs text-muted-foreground">
                第 {page} / {totalPages} 页
              </span>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1 || loading}
                  onClick={() => setPage((current) => Math.max(1, current - 1))}
                >
                  <ChevronLeft />
                  上一页
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages || loading}
                  onClick={() =>
                    setPage((current) => Math.min(totalPages, current + 1))
                  }
                >
                  下一页
                  <ChevronRight />
                </Button>
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <AdminVerificationDetailDialog
        open={selectedId !== null}
        detail={detail}
        loading={detailLoading}
        error={detailError}
        onClose={closeDetail}
        onRetry={() => {
          if (selectedId !== null) void openDetail(selectedId)
        }}
        onAction={openAction}
      />

      <ReviewActionDialog
        open={actionMode !== null}
        mode={actionMode}
        companyName={detail?.company.name ?? ''}
        loading={actionLoading}
        error={actionError}
        onConfirm={(value) => void confirmAction(value)}
        onClose={closeAction}
      />
    </>
  )
}
