import http from './http'

export interface CompanyProfile {
  id: number
  name: string
  phone: string
  address: string
  intro: string
  industry: string
  verified: boolean
  completeness: number
  is_complete: boolean
  missing_fields: string[]
  can_receive_applications: boolean
  updated_at: string
}

export type CompanyPatch = Partial<
  Pick<CompanyProfile, 'name' | 'industry' | 'phone' | 'address' | 'intro'>
>

export type EmployerVerificationStatus =
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'revoked'

export interface EmployerVerificationDocument {
  id: number
  original_name: string
  mime_type: string
  size: number
  created_at: string
}

export interface EmployerVerification {
  id: number
  status: EmployerVerificationStatus
  version: number
  submitted_at: string
  reviewed_at: string | null
  reviewed_by: number | null
  review_note: string | null
  reject_reason: string | null
  document: EmployerVerificationDocument
}

export interface EmployerVerificationState {
  current: EmployerVerification | null
  history: EmployerVerification[]
}

export const companyApi = {
  get() {
    return http.get<CompanyProfile>('/employer/company').then((res) => res.data)
  },

  patch(payload: CompanyPatch) {
    return http
      .patch<CompanyProfile>('/employer/company', payload)
      .then((res) => res.data)
  },

  getVerification() {
    return http
      .get<EmployerVerificationState>('/employer/company/verification')
      .then((res) => res.data)
  },
}
