import { FileText, LoaderCircle } from 'lucide-react'

import { VerificationStatusBadge } from '@/components/admin/VerificationStatusBadge'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import type { AdminVerificationListItem } from '@/api/admin'
import { formatDateTime } from '@/lib/format'

interface AdminVerificationTableProps {
  items: AdminVerificationListItem[]
  loading: boolean
  onSelect: (id: number) => void
}

export function AdminVerificationTable({
  items,
  loading,
  onSelect,
}: AdminVerificationTableProps) {
  if (loading) {
    return (
      <div className="grid min-h-[260px] place-items-center">
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <LoaderCircle className="size-4 animate-spin" />
          正在加载认证申请…
        </p>
      </div>
    )
  }

  return (
    <>
      <div className="hidden md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="pl-1">企业</TableHead>
              <TableHead>材料</TableHead>
              <TableHead>版本</TableHead>
              <TableHead>提交时间</TableHead>
              <TableHead>状态</TableHead>
              <TableHead className="pr-1 text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item) => (
              <TableRow
                key={item.id}
                className="cursor-pointer"
                onClick={() => onSelect(item.id)}
              >
                <TableCell className="pl-1">
                  <div className="flex flex-col gap-0.5">
                    <span className="font-medium">{item.company_name}</span>
                    <span className="text-xs text-muted-foreground">
                      {item.company_verified ? '当前已认证' : '当前未认证'}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <span className="flex items-center gap-1.5 text-[13px]">
                    <FileText className="size-3.5 text-muted-foreground" />
                    <span className="max-w-[220px] truncate">
                      {item.document_name}
                    </span>
                  </span>
                </TableCell>
                <TableCell className="text-[13px]">v{item.version}</TableCell>
                <TableCell className="text-[13px] text-muted-foreground">
                  {formatDateTime(item.submitted_at)}
                </TableCell>
                <TableCell>
                  <VerificationStatusBadge status={item.status} />
                </TableCell>
                <TableCell className="pr-1 text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(event) => {
                      event.stopPropagation()
                      onSelect(item.id)
                    }}
                  >
                    查看详情
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="space-y-3 md:hidden">
        {items.map((item) => (
          <button
            key={item.id}
            type="button"
            className="w-full rounded-xl border border-border/70 bg-card p-4 text-left transition-colors hover:bg-muted/40"
            onClick={() => onSelect(item.id)}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">
                  {item.company_name}
                </p>
                <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                  <FileText className="size-3.5 shrink-0" />
                  <span className="truncate">{item.document_name}</span>
                </p>
              </div>
              <VerificationStatusBadge status={item.status} />
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <Badge variant="neutral">v{item.version}</Badge>
              <Badge variant={item.company_verified ? 'success' : 'neutral'}>
                {item.company_verified ? '当前已认证' : '当前未认证'}
              </Badge>
              <span>{formatDateTime(item.submitted_at)}</span>
            </div>
          </button>
        ))}
      </div>
    </>
  )
}
