import { useCallback, useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { AlertCircle, ArrowRight, FileSearch, LoaderCircle, RefreshCw } from 'lucide-react'

import { companyApi, type CompanyPatch, type CompanyProfile } from '@/api/company'
import { ModeSwitch } from '@/components/company/ModeSwitch'
import { StaggerText } from '@/components/company/StaggerText'
import { IdentityUploadPanel } from '@/components/upload/IdentityUploadPanel'
import { RecognitionPreview } from '@/components/upload/RecognitionPreview'
import { DocumentDropzone } from '@/components/upload/DocumentDropzone'
import { FileCard } from '@/components/upload/FileCard'
import { UploadProgress } from '@/components/upload/UploadProgress'
import { UploadTypeSwitch } from '@/components/upload/UploadTypeSwitch'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PageLoading } from '@/components/ui/page-loading'
import { useDocumentRecognition } from '@/hooks/useDocumentRecognition'
import { usePageTitle } from '@/hooks/usePageTitle'
import { COMPANY_FIELDS, type CompanyField } from '@/lib/company'
import { syncEmployerProfile } from '@/lib/auth-sync'
import { errorText } from '@/lib/error'
import type { UploadCategory } from '@/lib/file'

const FLOW_STEPS = [
  { title: '选择文档', description: '企业介绍、营业执照等材料' },
  { title: '模拟识别', description: '提取企业名称、行业、联系方式等' },
  { title: '核对应用', description: '只应用你勾选的字段' },
]

export function CompanyUploadPage() {
  usePageTitle('资料上传')
  const [params, setParams] = useSearchParams()
  const navigate = useNavigate()

  const category: UploadCategory =
    params.get('type') === 'identity' ? 'identity' : 'intro'
  const recognition = useDocumentRecognition(category)

  const [current, setCurrent] = useState<CompanyProfile | null>(null)
  const [currentLoading, setCurrentLoading] = useState(true)
  const [currentError, setCurrentError] = useState('')
  const [selected, setSelected] = useState<Set<CompanyField>>(new Set())
  const [applying, setApplying] = useState(false)
  const [applyError, setApplyError] = useState('')

  const loadCurrent = useCallback(async () => {
    setCurrentLoading(true)
    setCurrentError('')
    try {
      setCurrent(await companyApi.get())
    } catch (error) {
      setCurrentError(errorText(error, '读取当前企业资料失败'))
    } finally {
      setCurrentLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadCurrent()
  }, [loadCurrent])

  useEffect(() => {
    if (!recognition.result || !current) {
      setSelected(new Set())
      return
    }
    const initial = new Set<CompanyField>()
    for (const field of COMPANY_FIELDS) {
      const parsed = recognition.result.fields[field]?.value.trim()
      if (parsed && !current[field].trim()) initial.add(field)
    }
    setSelected(initial)
  }, [recognition.result, current])

  function changeCategory(next: UploadCategory) {
    if (next === category) return
    recognition.reset()
    setSelected(new Set())
    setApplyError('')
    setParams(next === 'identity' ? { type: 'identity' } : {})
  }

  function toggleField(field: CompanyField) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(field)) next.delete(field)
      else next.add(field)
      return next
    })
  }

  async function applyResult() {
    if (!recognition.result || selected.size === 0) return
    const payload: CompanyPatch = {}
    for (const field of selected) {
      const value = recognition.result.fields[field]?.value
      if (value) payload[field] = value
    }
    if (!Object.keys(payload).length) return

    setApplying(true)
    setApplyError('')
    try {
      const updated = await companyApi.patch(payload)
      syncEmployerProfile(updated)
      navigate('/employer/profile', {
        state: { applied: Object.keys(payload).length },
      })
    } catch (error) {
      setApplyError(errorText(error, '应用识别结果失败，请重试'))
    } finally {
      setApplying(false)
    }
  }

  const showIntroLoading = category === 'intro' && currentLoading
  const showIntroError = category === 'intro' && !currentLoading && currentError

  return (
    <>
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold tracking-[0.16em] text-primary uppercase">
            企业中心
          </p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight md:text-[30px]">
            <StaggerText text="资料上传" />
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            上传企业介绍文档，识别后核对并应用；也可以提交身份验证材料。
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Badge variant="neutral">联调模拟</Badge>
          <ModeSwitch value="upload" />
        </div>
      </header>

      <div className="mt-5">
        <UploadTypeSwitch value={category} onChange={changeCategory} />
      </div>

      {category === 'identity' ? (
        <div className="mt-5">
          <IdentityUploadPanel />
        </div>
      ) : showIntroLoading ? (
        <PageLoading label="正在读取当前企业资料…" />
      ) : showIntroError ? (
        <div className="mt-5 space-y-4">
          <Alert
            variant="destructive"
            className="border-destructive/20 bg-destructive/5"
          >
            <AlertCircle />
            <AlertDescription>{currentError}</AlertDescription>
          </Alert>
          <Button onClick={() => void loadCurrent()}>
            <RefreshCw />
            重新加载
          </Button>
        </div>
      ) : (
        <div className="mt-5 grid items-start gap-5 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)]">
          <Card className="gap-0 rounded-2xl border-border/70 py-0 shadow-sm ring-0 lg:sticky lg:top-24">
            <CardHeader className="border-b border-border/60 px-5 py-4">
              <CardTitle className="flex flex-wrap items-center gap-2 text-[15px] font-semibold">
                选择企业介绍文档
                <Badge variant="info">优先支持</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 px-5 py-5">
              {recognition.file ? (
                <FileCard
                  file={recognition.file}
                  disabled={recognition.isProcessing}
                  onRemove={recognition.reset}
                />
              ) : (
                <DocumentDropzone
                  category="intro"
                  disabled={recognition.isProcessing}
                  onSelect={recognition.selectFile}
                />
              )}

              {recognition.fileError ? (
                <Alert
                  variant="destructive"
                  className="border-destructive/20 bg-destructive/5"
                >
                  <AlertCircle />
                  <AlertDescription>{recognition.fileError}</AlertDescription>
                </Alert>
              ) : null}

              {recognition.isProcessing ? (
                <UploadProgress
                  stage={recognition.stage}
                  progress={recognition.progress}
                  onCancel={recognition.cancel}
                />
              ) : null}

              {recognition.error ? (
                <Alert
                  variant="destructive"
                  className="border-destructive/20 bg-destructive/5"
                >
                  <AlertCircle />
                  <AlertDescription>{recognition.error}</AlertDescription>
                </Alert>
              ) : null}

              <div className="flex flex-wrap items-center gap-2">
                <Button
                  type="button"
                  onClick={() => void recognition.start()}
                  disabled={!recognition.file || recognition.isProcessing}
                >
                  {recognition.phase === 'success' ||
                  recognition.phase === 'error'
                    ? '重新识别'
                    : '开始识别'}
                </Button>
                {recognition.file ? (
                  <span className="text-xs text-muted-foreground">
                    只做本地模拟，不会上传服务器
                  </span>
                ) : null}
              </div>
            </CardContent>
          </Card>

          <Card className="gap-0 rounded-2xl border-border/70 py-0 shadow-sm ring-0">
            <CardHeader className="border-b border-border/60 px-5 py-4">
              <CardTitle className="text-[15px] font-semibold">识别结果</CardTitle>
            </CardHeader>
            <CardContent className="px-5 py-5">
              {recognition.phase === 'success' && recognition.result && current ? (
                <RecognitionPreview
                  result={recognition.result}
                  current={{
                    name: current.name,
                    industry: current.industry,
                    phone: current.phone,
                    address: current.address,
                    intro: current.intro,
                  }}
                  selected={selected}
                  applying={applying}
                  applyError={applyError}
                  onToggle={toggleField}
                  onApply={() => void applyResult()}
                />
              ) : recognition.isProcessing ? (
                <div className="grid min-h-[260px] place-items-center text-center">
                  <div>
                    <LoaderCircle className="mx-auto size-6 animate-spin text-primary" />
                    <p className="mt-3 text-sm font-medium">正在识别文档内容</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      识别完成后在这里核对字段
                    </p>
                  </div>
                </div>
              ) : (
                <div className="grid min-h-[300px] place-items-center text-center">
                  <div className="max-w-sm">
                    <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-muted text-muted-foreground">
                      <FileSearch className="size-5" />
                    </span>
                    <h2 className="mt-4 text-sm font-semibold">识别结果会显示在这里</h2>
                    <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                      当前为联调模拟。选择文件并开始识别后，可以逐字段核对，
                      只应用你勾选的内容。
                    </p>
                  </div>
                </div>
              )}

              {recognition.phase !== 'success' ? (
                <ol className="mt-5 space-y-2.5 border-t border-dashed border-border/70 pt-4">
                  {FLOW_STEPS.map((step, index) => (
                    <li
                      key={step.title}
                      className="flex items-start gap-2.5 text-xs text-muted-foreground"
                    >
                      <span className="grid size-5 shrink-0 place-items-center rounded-md bg-accent text-[10px] font-semibold text-accent-foreground">
                        {index + 1}
                      </span>
                      <span>
                        <span className="font-medium text-foreground/80">
                          {step.title}
                        </span>
                        <ArrowRight className="mx-1 inline size-3" />
                        {step.description}
                      </span>
                    </li>
                  ))}
                </ol>
              ) : null}
            </CardContent>
          </Card>
        </div>
      )}
    </>
  )
}
