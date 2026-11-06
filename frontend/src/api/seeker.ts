import http from './http'

export interface SeekerProfile {
  id: number
  name: string
  gender: string
  birth_date: string | null
  age: number | null
  phone: string
  email: string | null
  household: string
  education: string
  major: string
  degree: string
  school: string
  skills: string
  job_intention: string
  expected_salary_min: number
  expected_salary_max: number
  work_company: string
  work_title: string
  work_start: string
  work_end: string
  work_description: string
  completeness: number
  is_complete: boolean
  missing_fields: string[]
  can_apply: boolean
  updated_at: string
}

export interface SeekerPatch {
  name?: string
  gender?: string
  birth_date?: string | null
  phone?: string
  email?: string | null
  household?: string
  education?: string
  major?: string
  degree?: string
  school?: string
  skills?: string
  job_intention?: string
  expected_salary_min?: number
  expected_salary_max?: number
  work_company?: string
  work_title?: string
  work_start?: string
  work_end?: string
  work_description?: string
}

export interface SeekerRecognitionField {
  value: string
  confidence: number
  source?: {
    page?: number | null
    bbox?: number[] | null
    text?: string | null
    method?: string | null
  } | null
}

export interface SeekerRecognitionResult {
  schema_version?: string | null
  provider: string
  model?: string | null
  document_type: string
  confidence: number
  fields: Record<string, SeekerRecognitionField>
  warnings: string[]
  meta?: {
    pages?: number | null
    ocr_used?: boolean | null
    text_length?: number | null
    duration_ms?: number | null
  } | null
}

export const seekerApi = {
  get() {
    return http.get<SeekerProfile>('/seeker/profile').then((res) => res.data)
  },

  patch(payload: SeekerPatch) {
    return http
      .patch<SeekerProfile>('/seeker/profile', payload)
      .then((res) => res.data)
  },

  recognize(
    file: File,
    options: {
      signal?: AbortSignal
      onProgress?: (progress: number) => void
    } = {},
  ) {
    const form = new FormData()
    form.append('file', file)
    return http
      .post<SeekerRecognitionResult>('/seeker/profile/recognize', form, {
        signal: options.signal,
        onUploadProgress: (event) => {
          const total = event.total ?? file.size
          if (total > 0) {
            options.onProgress?.(
              Math.min(95, Math.round((event.loaded / total) * 100)),
            )
          }
        },
      })
      .then((res) => {
        options.onProgress?.(100)
        return res.data
      })
      .catch((error) => {
        if (options.signal?.aborted) {
          throw new DOMException('操作已取消', 'AbortError')
        }
        throw error
      })
  },
}
