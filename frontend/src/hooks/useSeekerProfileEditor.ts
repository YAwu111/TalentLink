import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import {
  seekerApi,
  type SeekerPatch,
  type SeekerProfile,
} from '@/api/seeker'
import {
  EMPTY_SEEKER_FORM,
  SEEKER_FORM_FIELDS,
  seekerCompleteness,
  toSeekerForm,
  validateSeekerForm,
  type SeekerErrors,
  type SeekerField,
  type SeekerFormValues,
} from '@/lib/seeker'
import { syncSeekerProfile } from '@/lib/auth-sync'
import { errorText } from '@/lib/error'

const DEBOUNCE_MS = 800

function toPatch(field: SeekerField, value: string): SeekerPatch {
  if (field === 'email') return { email: value.trim() || null }
  if (field === 'birth_date') return { birth_date: value || null }
  if (field === 'expected_salary_min') {
    return { expected_salary_min: Number(value) || 0 }
  }
  if (field === 'expected_salary_max') {
    return { expected_salary_max: Number(value) || 0 }
  }
  return { [field]: value } as SeekerPatch
}

export function useSeekerProfileEditor() {
  const [profile, setProfile] = useState<SeekerProfile | null>(null)
  const [form, setForm] = useState<SeekerFormValues>(EMPTY_SEEKER_FORM)
  const [errors, setErrors] = useState<SeekerErrors>({})
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [savedAt, setSavedAt] = useState<string | null>(null)
  const [dirty, setDirty] = useState(false)

  const mountedRef = useRef(true)
  const formRef = useRef(form)
  const baselineRef = useRef<SeekerFormValues>(EMPTY_SEEKER_FORM)
  const pendingRef = useRef<Set<SeekerField>>(new Set())
  const timerRef = useRef<number | undefined>(undefined)
  const chainRef = useRef<Promise<boolean>>(Promise.resolve(true))

  formRef.current = form

  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
      if (timerRef.current !== undefined) window.clearTimeout(timerRef.current)
    }
  }, [])

  const load = useCallback(async () => {
    setLoading(true)
    setLoadError('')
    try {
      const data = await seekerApi.get()
      if (!mountedRef.current) return
      const values = toSeekerForm(data)
      setProfile(data)
      setForm(values)
      formRef.current = values
      baselineRef.current = values
      setSavedAt(data.updated_at)
      setSaveError('')
      setErrors({})
      pendingRef.current.clear()
      setDirty(false)
    } catch (error) {
      if (mountedRef.current) {
        setLoadError(errorText(error, '求职者资料加载失败'))
      }
    } finally {
      if (mountedRef.current) setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  useEffect(() => {
    if (!dirty && !saving) return
    const handler = (event: BeforeUnloadEvent) => {
      event.preventDefault()
      event.returnValue = ''
    }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [dirty, saving])

  async function savePendingOnce(): Promise<boolean> {    const fields = Array.from(pendingRef.current)
    if (!fields.length) return true

    const snapshot: Record<string, string> = {}
    const patch: SeekerPatch = {}
    for (const field of fields) {
      snapshot[field] = formRef.current[field]
      Object.assign(patch, toPatch(field, formRef.current[field]))
    }

    if (mountedRef.current) {
      setSaving(true)
      setSaveError('')
    }
    try {
      const updated = await seekerApi.patch(patch)
      if (!mountedRef.current) return true
      syncSeekerProfile(updated)
      setProfile(updated)
      setSavedAt(updated.updated_at)
      for (const field of fields) {
        baselineRef.current = {
          ...baselineRef.current,
          [field]: snapshot[field],
        }
        if (formRef.current[field] === snapshot[field]) {
          pendingRef.current.delete(field)
        }
      }
      setDirty(pendingRef.current.size > 0)
      return true
    } catch (error) {
      if (mountedRef.current) {
        setSaveError(errorText(error, '保存失败，请重试'))
      }
      return false
    } finally {
      if (mountedRef.current) setSaving(false)
    }
  }

  async function flush(): Promise<boolean> {
    if (timerRef.current !== undefined) {
      window.clearTimeout(timerRef.current)
      timerRef.current = undefined
    }
    if (Object.keys(errors).length > 0) {
      setSaveError('请先修正表单中的错误')
      return false
    }
    let ok = true
    while (pendingRef.current.size > 0) {
      const task = chainRef.current.then(savePendingOnce)
      chainRef.current = task.catch(() => false)
      ok = await task
      if (!ok) return false
    }
    return ok
  }

  function scheduleSave() {
    if (timerRef.current !== undefined) window.clearTimeout(timerRef.current)
    timerRef.current = window.setTimeout(() => {
      timerRef.current = undefined
      void flush()
    }, DEBOUNCE_MS)
  }

  function markFields(fields: SeekerField[], nextErrors: SeekerErrors) {
    for (const field of fields) {
      if (nextErrors[field]) pendingRef.current.delete(field)
      else pendingRef.current.add(field)
    }
  }

  function updateField(field: SeekerField, value: string) {
    const next = { ...formRef.current, [field]: value }
    const nextErrors = validateSeekerForm(next)
    formRef.current = next
    setForm(next)
    setErrors(nextErrors)
    setSaveError('')

    if (field === 'expected_salary_min' || field === 'expected_salary_max') {
      markFields(
        ['expected_salary_min', 'expected_salary_max'],
        nextErrors,
      )
    } else {
      markFields([field], nextErrors)
    }
    const hasErrors = Object.keys(nextErrors).length > 0
    setDirty(pendingRef.current.size > 0 || hasErrors)
    if (!hasErrors) scheduleSave()
  }

  function applyRecognized(values: Partial<SeekerFormValues>) {
    const next = { ...formRef.current }
    const fields: SeekerField[] = []
    for (const field of SEEKER_FORM_FIELDS) {
      const value = values[field]
      if (value === undefined) continue
      next[field] = value
      fields.push(field)
    }
    const nextErrors = validateSeekerForm(next)
    formRef.current = next
    setForm(next)
    setErrors(nextErrors)
    setSaveError('')
    markFields(fields, nextErrors)
    setDirty(pendingRef.current.size > 0)
    scheduleSave()
  }

  function discard() {
    if (timerRef.current !== undefined) {
      window.clearTimeout(timerRef.current)
      timerRef.current = undefined
    }
    pendingRef.current.clear()
    formRef.current = baselineRef.current
    setForm(baselineRef.current)
    setErrors({})
    setSaveError('')
    setDirty(false)
  }

  const completeness = useMemo(() => seekerCompleteness(form), [form])

  return {
    profile,
    form,
    errors,
    loading,
    loadError,
    saving,
    saveError,
    savedAt,
    dirty,
    hasUnsavedChanges: dirty || saving,
    completeness,
    updateField,
    applyRecognized,
    saveNow: flush,
    retrySave: flush,
    discard,
    reload: load,
  }
}
