import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { companyApi, type CompanyPatch, type CompanyProfile } from '@/api/company'
import {
  EMPTY_COMPANY_FORM,
  completenessOf,
  toCompanyForm,
  type CompanyField,
  type CompanyFormValues,
} from '@/lib/company'
import { errorText } from '@/lib/error'

const DEBOUNCE_MS = 800

export interface CompanyEditor {
  profile: CompanyProfile | null
  form: CompanyFormValues
  loading: boolean
  loadError: string
  saving: boolean
  saveError: string
  savedAt: string | null
  dirty: boolean
  hasUnsavedChanges: boolean
  completeness: ReturnType<typeof completenessOf>
  updateField: (field: CompanyField, value: string) => void
  saveNow: () => Promise<boolean>
  retrySave: () => Promise<boolean>
  discard: () => void
  reload: () => Promise<void>
}

export function useCompanyProfileEditor(): CompanyEditor {
  const [profile, setProfile] = useState<CompanyProfile | null>(null)
  const [form, setForm] = useState<CompanyFormValues>(EMPTY_COMPANY_FORM)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [savedAt, setSavedAt] = useState<string | null>(null)
  const [dirty, setDirty] = useState(false)

  const mountedRef = useRef(true)
  const formRef = useRef(form)
  const baselineRef = useRef<CompanyFormValues>(EMPTY_COMPANY_FORM)
  const pendingRef = useRef<Set<CompanyField>>(new Set())
  const timerRef = useRef<number | undefined>(undefined)
  const saveChainRef = useRef<Promise<boolean>>(Promise.resolve(true))

  formRef.current = form

  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
      if (timerRef.current !== undefined) {
        window.clearTimeout(timerRef.current)
      }
    }
  }, [])

  const load = useCallback(async () => {
    setLoading(true)
    setLoadError('')
    if (timerRef.current !== undefined) {
      window.clearTimeout(timerRef.current)
      timerRef.current = undefined
    }
    pendingRef.current.clear()
    setDirty(false)
    try {
      const data = await companyApi.get()
      if (!mountedRef.current) return
      const values = toCompanyForm(data)
      setProfile(data)
      setForm(values)
      formRef.current = values
      baselineRef.current = values
      setSavedAt(data.updated_at)
      setSaveError('')
    } catch (error) {
      if (mountedRef.current) {
        setLoadError(errorText(error, '企业资料加载失败'))
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
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault()
      event.returnValue = ''
    }
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [dirty, saving])

  async function savePendingOnce(): Promise<boolean> {
    const fields = Array.from(pendingRef.current)
    if (!fields.length) return true

    const snapshot: CompanyPatch = {}
    for (const field of fields) {
      snapshot[field] = formRef.current[field]
    }

    if (mountedRef.current) {
      setSaving(true)
      setSaveError('')
    }

    try {
      const updated = await companyApi.patch(snapshot)
      if (!mountedRef.current) return true

      for (const field of fields) {
        const sentValue = snapshot[field]
        if (sentValue !== undefined) {
          baselineRef.current = {
            ...baselineRef.current,
            [field]: sentValue,
          }
        }
        // 请求期间用户可能又改了同一个字段，只有值未变化才清除待保存标记
        if (formRef.current[field] === snapshot[field]) {
          pendingRef.current.delete(field)
        }
      }

      setProfile(updated)
      setSavedAt(updated.updated_at)
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

    let ok = true
    while (pendingRef.current.size > 0) {
      const task = saveChainRef.current.then(savePendingOnce)
      saveChainRef.current = task.catch(() => false)
      ok = await task
      if (!ok) return false
    }
    return ok
  }

  function scheduleSave() {
    if (timerRef.current !== undefined) {
      window.clearTimeout(timerRef.current)
    }
    timerRef.current = window.setTimeout(() => {
      timerRef.current = undefined
      void flush()
    }, DEBOUNCE_MS)
  }

  function updateField(field: CompanyField, value: string) {
    const next = { ...formRef.current, [field]: value }
    formRef.current = next
    setForm(next)
    pendingRef.current.add(field)
    setDirty(true)
    setSaveError('')
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
    setDirty(false)
    setSaveError('')
  }

  const completeness = useMemo(() => completenessOf(form), [form])

  return {
    profile,
    form,
    loading,
    loadError,
    saving,
    saveError,
    savedAt,
    dirty,
    hasUnsavedChanges: dirty || saving,
    completeness,
    updateField,
    saveNow: flush,
    retrySave: flush,
    discard,
    reload: load,
  }
}
