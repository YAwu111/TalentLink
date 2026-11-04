import axios from 'axios'

import type { ApiError } from '@/api/types'

/** 把 axios/业务异常的 detail 统一转成可直接展示的中文。 */
export function errorText(error: unknown, fallback = '操作失败，请稍后重试'): string {
  if (axios.isAxiosError<ApiError>(error)) {
    const detail = error.response?.data?.detail
    if (typeof detail === 'string') return detail
    if (Array.isArray(detail) && detail[0]?.msg) {
      return '提交内容不符合要求，请检查后重试'
    }
  }
  return fallback
}
