import { useEffect, useRef, useState } from 'react'

import {
  recognitionProvider,
  type RecognitionResult,
  type RecognitionStage,
} from '@/api/recognition'
import { errorText } from '@/lib/error'
import { validateUploadFile, type UploadCategory } from '@/lib/file'

export type RecognitionPhase =
  | 'idle'
  | 'file_selected'
  | 'uploading'
  | 'recognizing'
  | 'success'
  | 'error'

export interface DocumentRecognitionState {
  file: File | null
  phase: RecognitionPhase
  stage: RecognitionStage
  progress: number
  result: RecognitionResult | null
  error: string
  fileError: string
  isProcessing: boolean
  selectFile: (file: File) => void
  start: () => Promise<void>
  cancel: () => void
  reset: () => void
}

export function useDocumentRecognition(
  category: UploadCategory,
): DocumentRecognitionState {
  const [file, setFile] = useState<File | null>(null)
  const [phase, setPhase] = useState<RecognitionPhase>('idle')
  const [stage, setStage] = useState<RecognitionStage>('uploading')
  const [progress, setProgress] = useState(0)
  const [result, setResult] = useState<RecognitionResult | null>(null)
  const [error, setError] = useState('')
  const [fileError, setFileError] = useState('')

  const abortRef = useRef<AbortController | null>(null)
  const sequenceRef = useRef(0)
  const mountedRef = useRef(true)

  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
      abortRef.current?.abort()
    }
  }, [])

  function selectFile(nextFile: File) {
    abortRef.current?.abort()
    sequenceRef.current += 1
    const validationError = validateUploadFile(nextFile, category)
    if (validationError) {
      setFile(null)
      setResult(null)
      setPhase('idle')
      setProgress(0)
      setFileError(validationError)
      setError('')
      return
    }
    setFile(nextFile)
    setFileError('')
    setResult(null)
    setPhase('file_selected')
    setProgress(0)
    setError('')
  }

  async function start() {
    if (!file) return
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller
    const currentSequence = ++sequenceRef.current

    setResult(null)
    setError('')
    setStage('uploading')
    setProgress(0)
    setPhase('uploading')

    try {
      const recognition = await recognitionProvider.recognize(file, {
        signal: controller.signal,
        onStage: (nextStage, nextProgress) => {
          if (sequenceRef.current !== currentSequence) return
          setStage(nextStage)
          setProgress(nextProgress)
          setPhase(nextStage === 'uploading' ? 'uploading' : 'recognizing')
        },
      })
      if (!mountedRef.current || sequenceRef.current !== currentSequence) return
      setResult(recognition)
      setProgress(100)
      setPhase('success')
    } catch (err) {
      if (!mountedRef.current || sequenceRef.current !== currentSequence) return
      if (err instanceof DOMException && err.name === 'AbortError') {
        setPhase('file_selected')
        setProgress(0)
        return
      }
      setError(errorText(err, '识别失败，请稍后重试'))
      setPhase('error')
    }
  }

  function cancel() {
    abortRef.current?.abort()
    sequenceRef.current += 1
    setResult(null)
    setProgress(0)
    setError('')
    setPhase(file ? 'file_selected' : 'idle')
  }

  function reset() {
    abortRef.current?.abort()
    sequenceRef.current += 1
    setFile(null)
    setResult(null)
    setPhase('idle')
    setStage('uploading')
    setProgress(0)
    setError('')
    setFileError('')
  }

  return {
    file,
    phase,
    stage,
    progress,
    result,
    error,
    fileError,
    isProcessing: phase === 'uploading' || phase === 'recognizing',
    selectFile,
    start,
    cancel,
    reset,
  }
}
