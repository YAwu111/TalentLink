import { create } from 'zustand'

import {
  MOCK_APPLICATIONS,
  type MockApplication,
  type MockJob,
} from '@/lib/mock-seeker'

interface MockApplicationState {
  applications: MockApplication[]
  hasApplied: (jobId: number) => boolean
  apply: (job: MockJob) => boolean
}

export const useMockApplications = create<MockApplicationState>((set, get) => ({
  applications: MOCK_APPLICATIONS,
  hasApplied(jobId) {
    return get().applications.some((item) => item.jobId === jobId)
  },
  apply(job) {
    if (get().applications.some((item) => item.jobId === job.id)) {
      return false
    }
    const nextId =
      Math.max(0, ...get().applications.map((item) => item.id)) + 1
    const application: MockApplication = {
      id: nextId,
      jobId: job.id,
      jobTitle: job.title,
      companyName: job.companyName,
      city: job.city,
      salaryMin: job.salaryMin,
      salaryMax: job.salaryMax,
      appliedAt: new Date().toISOString(),
      status: 'submitted',
      note: '演示投递，仅保存在当前页面内存',
    }
    set({ applications: [application, ...get().applications] })
    return true
  },
}))
