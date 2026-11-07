import http from './http'

export type JobStatus = 'draft' | 'published' | 'closed'
export type ApplicationStatus =
  | 'submitted'
  | 'viewed'
  | 'interview'
  | 'offered'
  | 'offer_accepted'
  | 'offer_declined'
  | 'rejected'

export interface JobCompany {
  id: number
  name: string
  industry: string
  address: string
  verified: boolean
}

export interface Job {
  id: number
  title: string
  requirement: string
  other_requirement: string
  salary_min: number
  salary_max: number | null
  headcount: number
  status: JobStatus
  published_at: string | null
  company: JobCompany
  applied: boolean
}

export interface JobCreate {
  title: string
  requirement: string
  other_requirement: string
  salary_min: number
  salary_max: number | null
  headcount: number
}

export type JobUpdate = Partial<JobCreate>

export interface Application {
  id: number
  job_id: number
  job_title: string
  company_name: string
  city: string
  salary_min: number
  salary_max: number | null
  status: ApplicationStatus
  note: string
  applied_at: string
  offer_salary: number | null
}

export interface JobFilters {
  keyword?: string
  city?: string
  industry?: string
  salary_min?: number
  salary_max?: number
}

export const seekerJobsApi = {
  list(filters: JobFilters = {}) {
    const params: Record<string, string | number> = {}
    if (filters.keyword) params.keyword = filters.keyword
    if (filters.city) params.city = filters.city
    if (filters.industry) params.industry = filters.industry
    if (filters.salary_min) params.salary_min = filters.salary_min
    if (filters.salary_max) params.salary_max = filters.salary_max
    return http.get<Job[]>('/jobs', { params }).then((res) => res.data)
  },

  detail(id: number) {
    return http.get<Job>(`/jobs/${id}`).then((res) => res.data)
  },

  apply(jobId: number, note?: string) {
    return http
      .post<Application>('/seeker/applications', { job_id: jobId, note })
      .then((res) => res.data)
  },

  applications() {
    return http
      .get<Application[]>('/seeker/applications')
      .then((res) => res.data)
  },
}

export const employerJobsApi = {
  list() {
    return http.get<Job[]>('/employer/jobs').then((res) => res.data)
  },

  create(payload: JobCreate) {
    return http.post<Job>('/employer/jobs', payload).then((res) => res.data)
  },

  update(id: number, payload: JobUpdate) {
    return http
      .patch<Job>(`/employer/jobs/${id}`, payload)
      .then((res) => res.data)
  },

  publish(id: number) {
    return http
      .post<Job>(`/employer/jobs/${id}/publish`)
      .then((res) => res.data)
  },

  close(id: number) {
    return http
      .post<Job>(`/employer/jobs/${id}/close`)
      .then((res) => res.data)
  },
}

export function cityOf(address: string): string {
  const match = address.match(/([\u4e00-\u9fa5]{2,10}市)/)
  return match ? match[1] : address || '—'
}

export function formatSalaryRange(min: number, max: number | null): string {
  if (max === null) return `${Math.round(min / 1000)}K 起`
  return `${Math.round(min / 1000)}K–${Math.round(max / 1000)}K`
}

export const APPLICATION_STATUS_META: Record<
  ApplicationStatus,
  {
    label: string
    variant: 'info' | 'success' | 'warning' | 'destructive' | 'neutral' | 'teal'
  }
> = {
  submitted: { label: '已投递', variant: 'info' },
  viewed: { label: '已查看', variant: 'warning' },
  interview: { label: '面试中', variant: 'teal' },
  offered: { label: '已发录用', variant: 'success' },
  offer_accepted: { label: '已接受录用', variant: 'success' },
  offer_declined: { label: '已拒绝录用', variant: 'neutral' },
  rejected: { label: '未通过', variant: 'destructive' },
}
