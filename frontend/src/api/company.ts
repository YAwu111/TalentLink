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

export const companyApi = {
  get() {
    return http.get<CompanyProfile>('/employer/company').then((res) => res.data)
  },

  patch(payload: CompanyPatch) {
    return http
      .patch<CompanyProfile>('/employer/company', payload)
      .then((res) => res.data)
  },
}
