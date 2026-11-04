import type { CompanyField } from '@/lib/company'

export interface RecognitionFieldValue {
  value: string
  confidence: number
}

export interface RecognitionResult {
  provider: 'mock' | 'http'
  documentType: 'intro'
  confidence: number
  fields: Partial<Record<CompanyField, RecognitionFieldValue>>
  warnings: string[]
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
  provider: 'mock'
  submittedAt: string
}

export interface IdentityProvider {
  submit: (
    file: File,
    options?: {
      signal?: AbortSignal
      onProgress?: (progress: number) => void
    },
  ) => Promise<IdentitySubmissionResult>
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
      provider: 'mock',
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
  async recognize() {
    throw new Error('识别服务尚未接入，请等待后端接口完成')
  },
}

export const recognitionProvider: RecognitionProvider =
  import.meta.env.VITE_RECOGNITION_PROVIDER === 'http'
    ? httpRecognitionProvider
    : mockRecognitionProvider

const mockIdentityProvider: IdentityProvider = {
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

export const identityProvider: IdentityProvider = mockIdentityProvider
