import { useCallback, useEffect, useState } from 'react'

import {
  companyApi,
  type EmployerVerificationState,
} from '@/api/company'
import { errorText } from '@/lib/error'

export function useVerificationStatus() {
  const [state, setState] = useState<EmployerVerificationState | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const reload = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      setState(await companyApi.getVerification())
    } catch (err) {
      setError(errorText(err, '认证状态加载失败'))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void reload()
  }, [reload])

  return {
    state,
    current: state?.current ?? null,
    loading,
    error,
    reload,
  }
}
