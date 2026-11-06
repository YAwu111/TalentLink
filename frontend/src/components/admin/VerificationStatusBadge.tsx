import { Badge } from '@/components/ui/badge'
import type { VerificationStatus } from '@/api/admin'

interface StatusMeta {
  label: string
  variant: 'warning' | 'success' | 'destructive' | 'neutral'
}

export const VERIFICATION_STATUS_META: Record<VerificationStatus, StatusMeta> = {
  pending: { label: '待审核', variant: 'warning' },
  approved: { label: '已通过', variant: 'success' },
  rejected: { label: '已驳回', variant: 'destructive' },
  revoked: { label: '已撤销', variant: 'neutral' },
}

export function VerificationStatusBadge({
  status,
}: {
  status: VerificationStatus
}) {
  const meta = VERIFICATION_STATUS_META[status]
  return <Badge variant={meta.variant}>{meta.label}</Badge>
}
