import { useCallback, useEffect, useState } from 'react'

import { seekerApi, type SeekerProfile } from '@/api/seeker'
import { errorText } from '@/lib/error'

export function useSeekerProfile() {
  const [profile, setProfile] = useState<SeekerProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const reload = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      setProfile(await seekerApi.get())
    } catch (err) {
      setError(errorText(err, '求职者资料加载失败'))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void reload()
  }, [reload])

  return { profile, loading, error, reload }
}
