import http from './http'
import type { ApplicationStatus, Job } from './jobs'
import type { SeekerProfile } from './seeker'

export interface EmployerApplicationSummary {
  id: number
  job_id: number
  job_title: string
  seeker_id: number
  seeker_name: string
  gender: string
  age: number | null
  education: string
  school: string
  major: string
  job_intention: string
  expected_salary_min: number
  expected_salary_max: number
  status: ApplicationStatus
  note: string
  applied_at: string
}

export interface EmployerApplicationDetail {
  application: EmployerApplicationSummary
  seeker: SeekerProfile
  job: Job
}

export type EmployerStatusTarget = 'viewed' | 'interview' | 'rejected'

export interface EmployerApplicationFilters {
  job_id?: number
  status?: ApplicationStatus
}

export const employerApplicationsApi = {
  list(filters: EmployerApplicationFilters = {}) {
    const params: Record<string, string | number> = {}
    if (filters.job_id) params.job_id = filters.job_id
    if (filters.status) params.status = filters.status
    return http
      .get<EmployerApplicationSummary[]>('/employer/applications', { params })
      .then((res) => res.data)
  },

  detail(id: number) {
    return http
      .get<EmployerApplicationDetail>(`/employer/applications/${id}`)
      .then((res) => res.data)
  },

  updateStatus(id: number, status: EmployerStatusTarget) {
    return http
      .patch<EmployerApplicationDetail>(
        `/employer/applications/${id}/status`,
        { status },
      )
      .then((res) => res.data)
  },
}
