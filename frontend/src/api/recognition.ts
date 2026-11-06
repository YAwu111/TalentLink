import http from './http'
import type { CompanyField } from '@/lib/company'

export interface RecognitionSource {
  page?: number | null
  bbox?: number[] | null
  text?: string | null
  method?: string | null
}

export interface RecognitionFieldValue {
  value: string
  confidence: number
  source?: RecognitionSource | null
}

export interface RecognitionMeta {
  pages?: number | null
  ocr_used?: boolean | null
  text_length?: number | null
  duration_ms?: number | null
}

export interface RecognitionResult {
  transport: 'mock' | 'http'
  provider: string
  model?: string | null
  schemaVersion?: string | null
  documentType: 'intro'
  confidence: number
  fields: Partial<Record<CompanyField, RecognitionFieldValue>>
  warnings: string[]
  meta?: RecognitionMeta | null
}

export type RecognitionStage = 'uploading' | 'recognizing'

export interface RecognizeOptions {
  signal?: AbortSignal
  onStage?: (stage: RecognitionStage, progress: number) => void
}

export interface RecognitionProvider {
  id: 'mock' | 'http'
  recognize: (file: File, options?: RecognizeOptions) => Promise<RecognitionResult>
}

export interface IdentitySubmissionResult {
  provider: 'mock' | 'http'
  submittedAt: string
}

export interface IdentityProvider {
  id: 'mock' | 'http'
  submit: (
    file: File,
    options?: {
      signal?: AbortSignal
      onProgress?: (progress: number) => void
    },
  ) => Promise<IdentitySubmissionResult>
}

interface BackendRecognitionField {
  value: string
  confidence: number
  source?: RecognitionSource | null
}

interface BackendRecognitionResult {
  schema_version?: string | null
  provider: string
  model?: string | null
  document_type: string
  confidence: number
  fields: Record<string, BackendRecognitionField>
  warnings?: string[]
  meta?: RecognitionMeta | null
}

interface BackendDocument {
  id: number
  status: 'processing' | 'parsed' | 'failed' | string
  result: BackendRecognitionResult | null
  error: string | null
}

interface BackendVerification {
  submitted_at: string
  status: string
}

const MOCK_FIELDS: RecognitionResult['fields'] = {
  name: { value: '星河科技（上海）有限公司', confidence: 0.96 },
  industry: { value: '企业服务 / SaaS', confidence: 0.91 },
  phone: { value: '021-58881234', confidence: 0.88 },
  address: { value: '上海市浦东新区张江路 88 号 3 层', confidence: 0.93 },
  intro: {
    value:
      '星河科技专注企业级 SaaS 产品研发，团队约 200 人，已完成 B 轮融资，服务客户覆盖零售、制造与物流行业。',
    confidence: 0.84,
  },
}

const COMPANY_FIELD_SET = new Set<string>([
  'name',
  'industry',
  'phone',
  'address',
  'intro',
])

function abortError(): DOMException {
  return new DOMException('操作已取消', 'AbortError')
}

function delay(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(abortError())
      return
    }
    const timer = window.setTimeout(() => {
      signal?.removeEventListener('abort', handleAbort)
      resolve()
    }, ms)
    function handleAbort() {
      window.clearTimeout(timer)
      signal?.removeEventListener('abort', handleAbort)
      reject(abortError())
    }
    signal?.addEventListener('abort', handleAbort, { once: true })
  })
}

function mapResult(result: BackendRecognitionResult): RecognitionResult {
  const fields: Partial<Record<CompanyField, RecognitionFieldValue>> = {}
  for (const [key, value] of Object.entries(result.fields ?? {})) {
    if (!COMPANY_FIELD_SET.has(key)) continue
    fields[key as CompanyField] = {
      value: value.value,
      confidence: value.confidence,
      source: value.source,
    }
  }
  return {
    transport: 'http',
    provider: result.provider,
    model: result.model,
    schemaVersion: result.schema_version,
    documentType: 'intro',
    confidence: result.confidence,
    fields,
    warnings: result.warnings ?? [],
    meta: result.meta,
  }
}

const mockRecognitionProvider: RecognitionProvider = {
  id: 'mock',
  async recognize(file, options = {}) {
    const { signal, onStage } = options
    const uploadSteps = [12, 28, 46, 65, 82, 100]
    for (const progress of uploadSteps) {
      if (signal?.aborted) throw abortError()
      onStage?.('uploading', progress)
      await delay(70, signal)
    }

    const recognizeSteps = [10, 28, 48, 70, 88, 100]
    for (const progress of recognizeSteps) {
      if (signal?.aborted) throw abortError()
      onStage?.('recognizing', progress)
      await delay(120, signal)
    }

    return {
      transport: 'mock',
      provider: 'mock',
      model: 'mock-rule-v0',
      schemaVersion: 'recognition.v1',
      documentType: 'intro',
      confidence: 0.92,
      fields: MOCK_FIELDS,
      warnings: [
        `当前为联调模拟识别，文件「${file.name}」未上传服务器，结果仅用于界面演示。`,
      ],
    }
  },
}

const httpRecognitionProvider: RecognitionProvider = {
  id: 'http',
  async recognize(file, options = {}) {
    const { signal, onStage } = options
    const form = new FormData()
    form.append('file', file)

    try {
      onStage?.('uploading', 8)
      const response = await http.post<BackendDocument>(
        '/employer/company/documents',
        form,
        {
          signal,
          onUploadProgress: (event) => {
            const total = event.total ?? file.size
            if (total > 0) {
              onStage?.(
                'uploading',
                Math.min(95, Math.round((event.loaded / total) * 100)),
              )
            }
          },
        },
      )
      onStage?.('uploading', 100)
      onStage?.('recognizing', 12)

      let current = response.data
      const startedAt = Date.now()
      while (current.status === 'processing') {
        if (signal?.aborted) throw abortError()
        if (Date.now() - startedAt > 60000) {
          throw new Error('识别超时，请稍后重试')
        }
        await delay(600, signal)
        const poll = await http.get<BackendDocument>(
          `/employer/company/documents/${current.id}`,
          { signal },
        )
        current = poll.data
        const elapsed = Date.now() - startedAt
        onStage?.('recognizing', Math.min(95, 20 + Math.floor(elapsed / 500) * 4))
      }

      if (current.status === 'failed') {
        throw new Error(current.error || '识别失败，请检查文档清晰度')
      }
      if (!current.result) {
        throw new Error('识别结果为空，请稍后重试')
      }
      onStage?.('recognizing', 100)
      return mapResult(current.result)
    } catch (error) {
      if (signal?.aborted) throw abortError()
      throw error
    }
  },
}

const mockIdentityProvider: IdentityProvider = {
  id: 'mock',
  async submit(_file, options = {}) {
    const { signal, onProgress } = options
    for (const progress of [15, 35, 58, 78, 100]) {
      if (signal?.aborted) throw abortError()
      onProgress?.(progress)
      await delay(160, signal)
    }
    return {
      provider: 'mock',
      submittedAt: new Date().toISOString(),
    }
  },
}

const httpIdentityProvider: IdentityProvider = {
  id: 'http',
  async submit(file, options = {}) {
    const { signal, onProgress } = options
    const form = new FormData()
    form.append('file', file)
    try {
      onProgress?.(8)
      const response = await http.post<BackendVerification>(
        '/employer/company/verification',
        form,
        {
          signal,
          onUploadProgress: (event) => {
            const total = event.total ?? file.size
            if (total > 0) {
              onProgress?.(
                Math.min(95, Math.round((event.loaded / total) * 100)),
              )
            }
          },
        },
      )
      onProgress?.(100)
      return {
        provider: 'http',
        submittedAt: response.data.submitted_at,
      }
    } catch (error) {
      if (signal?.aborted) throw abortError()
      throw error
    }
  },
}

const useMock = import.meta.env.VITE_RECOGNITION_PROVIDER === 'mock'

export const recognitionProvider: RecognitionProvider = useMock
  ? mockRecognitionProvider
  : httpRecognitionProvider

export const identityProvider: IdentityProvider = useMock
  ? mockIdentityProvider
  : httpIdentityProvider
