import type { SeekerProfile } from '@/api/seeker'

export const SEEKER_FORM_FIELDS = [
  'name',
  'gender',
  'birth_date',
  'phone',
  'email',
  'household',
  'education',
  'major',
  'degree',
  'school',
  'skills',
  'job_intention',
  'expected_salary_min',
  'expected_salary_max',
  'work_company',
  'work_title',
  'work_start',
  'work_end',
  'work_description',
] as const

export type SeekerField = (typeof SEEKER_FORM_FIELDS)[number]

export type SeekerFormValues = Record<SeekerField, string>

export type SeekerErrors = Partial<Record<SeekerField, string>>

export const SEEKER_LABELS: Record<SeekerField, string> = {
  name: '姓名',
  gender: '性别',
  birth_date: '出生日期',
  phone: '联系电话',
  email: '邮箱',
  household: '户籍所在地',
  education: '学历',
  major: '专业',
  degree: '学位',
  school: '毕业学校',
  skills: '技能',
  job_intention: '求职意向',
  expected_salary_min: '期望薪资下限',
  expected_salary_max: '期望薪资上限',
  work_company: '工作单位',
  work_title: '工作职位',
  work_start: '开始时间',
  work_end: '结束时间',
  work_description: '工作描述',
}

/** 与后端 seeker_service.FIELD_WEIGHTS 保持一致 */
export const SEEKER_WEIGHTS = {
  name: 12,
  gender: 4,
  birth_date: 8,
  phone: 12,
  email: 8,
  household: 4,
  education: 8,
  major: 5,
  degree: 4,
  school: 8,
  skills: 10,
  job_intention: 8,
  expected_salary: 9,
} as const

export const EMPTY_SEEKER_FORM: SeekerFormValues = {
  name: '',
  gender: '',
  birth_date: '',
  phone: '',
  email: '',
  household: '',
  education: '',
  major: '',
  degree: '',
  school: '',
  skills: '',
  job_intention: '',
  expected_salary_min: '',
  expected_salary_max: '',
  work_company: '',
  work_title: '',
  work_start: '',
  work_end: '',
  work_description: '',
}

export function toSeekerForm(profile: SeekerProfile): SeekerFormValues {
  return {
    name: profile.name,
    gender: profile.gender,
    birth_date: profile.birth_date ?? '',
    phone: profile.phone,
    email: profile.email ?? '',
    household: profile.household,
    education: profile.education,
    major: profile.major,
    degree: profile.degree,
    school: profile.school,
    skills: profile.skills,
    job_intention: profile.job_intention,
    expected_salary_min:
      profile.expected_salary_min > 0 ? String(profile.expected_salary_min) : '',
    expected_salary_max:
      profile.expected_salary_max > 0 ? String(profile.expected_salary_max) : '',
    work_company: profile.work_company,
    work_title: profile.work_title,
    work_start: profile.work_start,
    work_end: profile.work_end,
    work_description: profile.work_description,
  }
}

export interface SeekerCompleteness {
  score: number
  missing: string[]
  isComplete: boolean
}

function salaryValid(values: SeekerFormValues): boolean {
  const min = Number(values.expected_salary_min)
  const max = Number(values.expected_salary_max)
  return (
    Number.isFinite(min) &&
    Number.isFinite(max) &&
    min > 0 &&
    max > 0 &&
    min <= max
  )
}

export function seekerCompleteness(values: SeekerFormValues): SeekerCompleteness {
  const missing: string[] = []
  const simpleFields: (keyof typeof SEEKER_WEIGHTS)[] = [
    'name',
    'gender',
    'birth_date',
    'phone',
    'email',
    'household',
    'education',
    'major',
    'degree',
    'school',
    'skills',
    'job_intention',
  ]
  for (const field of simpleFields) {
    if (!values[field as SeekerField].trim()) missing.push(field)
  }
  if (!salaryValid(values)) missing.push('expected_salary')

  let score = 0
  for (const field of simpleFields) {
    if (!missing.includes(field)) score += SEEKER_WEIGHTS[field]
  }
  if (!missing.includes('expected_salary')) score += SEEKER_WEIGHTS.expected_salary

  return { score, missing, isComplete: missing.length === 0 }
}

export function seekerMissingLabels(missing: string[]): string[] {
  const labelMap: Record<string, string> = {
    name: '姓名',
    gender: '性别',
    birth_date: '出生日期',
    phone: '联系电话',
    email: '邮箱',
    household: '户籍所在地',
    education: '学历',
    major: '专业',
    degree: '学位',
    school: '毕业学校',
    skills: '技能',
    job_intention: '求职意向',
    expected_salary: '期望薪资',
  }
  return missing.map((field) => labelMap[field] ?? field)
}

export function validateSeekerForm(values: SeekerFormValues): SeekerErrors {
  const errors: SeekerErrors = {}
  if (values.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim())) {
    errors.email = '请输入正确的邮箱地址'
  }
  if (values.phone.trim() && !/^(?:1[3-9]\d{9}|0\d{2,3}-?\d{7,8})$/.test(values.phone.trim())) {
    errors.phone = '请输入正确的手机或座机号码'
  }
  if (values.birth_date) {
    const date = new Date(`${values.birth_date}T00:00:00`)
    if (Number.isNaN(date.getTime()) || date > new Date()) {
      errors.birth_date = '出生日期不能晚于今天'
    }
  }
  const minText = values.expected_salary_min.trim()
  const maxText = values.expected_salary_max.trim()
  if (minText && (!/^\d+$/.test(minText) || Number(minText) <= 0)) {
    errors.expected_salary_min = '请输入大于 0 的整数'
  }
  if (maxText && (!/^\d+$/.test(maxText) || Number(maxText) <= 0)) {
    errors.expected_salary_max = '请输入大于 0 的整数'
  }
  if (
    !errors.expected_salary_min &&
    !errors.expected_salary_max &&
    minText &&
    maxText &&
    Number(minText) > Number(maxText)
  ) {
    errors.expected_salary_min = '下限不能高于上限'
    errors.expected_salary_max = '上限不能低于下限'
  }
  return errors
}

export function salaryText(min: number, max: number): string {
  if (min <= 0 && max <= 0) return '期望薪资待完善'
  if (min > 0 && max > 0) return `${Math.round(min / 1000)}K–${Math.round(max / 1000)}K`
  if (min > 0) return `${Math.round(min / 1000)}K 起`
  return `最高 ${Math.round(max / 1000)}K`
}

export function offerSalaryText(value: number): string {
  return value > 0 ? `${Math.round(value / 1000)}K` : '薪资待沟通'
}

export function splitSkills(skills: string): string[] {
  return skills
    .split(/[、,，;；\n]/)
    .map((item) => item.trim())
    .filter(Boolean)
}
