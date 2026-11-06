import http from './http'

export type VerificationStatus = 'pending' | 'approved' | 'rejected' | 'revoked'
export type VerificationFilter = VerificationStatus | 'all'

export interface AdminCompany {
  id: number
  name: string
  industry: string
  phone: string
  address: string
  intro: string
  verified: boolean
  completeness: number
  is_complete: boolean
}

export interface VerificationDocument {
  id: number
  original_name: string
  mime_type: string
  size: number
  created_at: string
}

export interface AdminVerification {
  id: number
  status: VerificationStatus
  version: number
  submitted_at: string
  reviewed_at: string | null
  reviewed_by: number | null
  review_note: string | null
  reject_reason: string | null
  document: VerificationDocument
}

export interface VerificationEvent {
  id: number
  from_status: VerificationStatus | null
  to_status: VerificationStatus
  actor_id: number | null
  actor_name: string | null
  note: string | null
  created_at: string
}

export interface AdminVerificationListItem {
  id: number
  company_id: number
  company_name: string
  company_verified: boolean
  version: number
  status: VerificationStatus
  submitted_at: string
  document_id: number
  document_name: string
}

export interface AdminVerificationList {
  items: AdminVerificationListItem[]
  total: number
  page: number
  page_size: number
  status: VerificationFilter
  counts: Record<string, number>
}

export interface AdminVerificationDetail {
  verification: AdminVerification
  company: AdminCompany
  history: AdminVerification[]
  events: VerificationEvent[]
}

export const adminApi = {
  list(params: { status: VerificationFilter; page: number; page_size?: number }) {
    return http
      .get<AdminVerificationList>('/admin/verifications', { params })
      .then((response) => response.data)
  },

  detail(id: number) {
    return http
      .get<AdminVerificationDetail>(`/admin/verifications/${id}`)
      .then((response) => response.data)
  },

  approve(id: number, note?: string) {
    return http
      .post<AdminVerificationDetail>(`/admin/verifications/${id}/approve`, {
        note: note?.trim() || null,
      })
      .then((response) => response.data)
  },

  reject(id: number, reason: string) {
    return http
      .post<AdminVerificationDetail>(`/admin/verifications/${id}/reject`, {
        reason,
      })
      .then((response) => response.data)
  },

  revoke(id: number, reason: string) {
    return http
      .post<AdminVerificationDetail>(`/admin/verifications/${id}/revoke`, {
        reason,
      })
      .then((response) => response.data)
  },

  fileUrl(id: number) {
    return `/api/admin/verifications/${id}/file`
  },
}
