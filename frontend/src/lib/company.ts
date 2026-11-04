import type { CompanyProfile } from '@/api/company'

export const COMPANY_FIELDS = [
  'name',
  'industry',
  'phone',
  'address',
  'intro',
] as const

export type CompanyField = (typeof COMPANY_FIELDS)[number]

export type CompanyFormValues = Record<CompanyField, string>

/** 与后端 company_service.FIELD_WEIGHTS 保持一致 */
export const COMPANY_WEIGHTS: Record<CompanyField, number> = {
  name: 30,
  industry: 15,
  phone: 20,
  address: 15,
  intro: 20,
}

export const COMPANY_LABELS: Record<CompanyField, string> = {
  name: '企业名称',
  industry: '经营行业',
  phone: '企业电话',
  address: '企业地址',
  intro: '企业简介',
}

export const EMPTY_COMPANY_FORM: CompanyFormValues = {
  name: '',
  industry: '',
  phone: '',
  address: '',
  intro: '',
}

export function toCompanyForm(profile: CompanyProfile): CompanyFormValues {
  return {
    name: profile.name,
    industry: profile.industry,
    phone: profile.phone,
    address: profile.address,
    intro: profile.intro,
  }
}

export interface CompanyCompleteness {
  score: number
  missing: CompanyField[]
  isComplete: boolean
}

export function completenessOf(values: CompanyFormValues): CompanyCompleteness {
  const missing = COMPANY_FIELDS.filter((field) => !values[field].trim())
  const score = COMPANY_FIELDS.reduce(
    (total, field) => (missing.includes(field) ? total : total + COMPANY_WEIGHTS[field]),
    0,
  )
  return { score, missing, isComplete: missing.length === 0 }
}
