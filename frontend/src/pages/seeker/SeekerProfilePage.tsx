import { useState } from 'react'
import { Link, useBlocker } from 'react-router-dom'
import {
  AlertCircle,
  Check,
  FileText,
  LoaderCircle,
  PenLine,
  RefreshCw,
  ScanLine,
  Upload,
} from 'lucide-react'

import { SeekerCompletenessCard } from '@/components/seeker/SeekerCompletenessCard'
import { SeekerOCRPanel } from '@/components/seeker/SeekerOCRPanel'
import { SeekerPreviewCard } from '@/components/seeker/SeekerPreviewCard'
import { StaggerText } from '@/components/company/StaggerText'
import { UnsavedChangesDialog } from '@/components/company/UnsavedChangesDialog'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Field } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { PageLoading } from '@/components/ui/page-loading'
import { Textarea } from '@/components/ui/textarea'
import { usePageTitle } from '@/hooks/usePageTitle'
import { useSeekerProfileEditor } from '@/hooks/useSeekerProfileEditor'
import { formatTime } from '@/lib/format'
import type { SeekerFormValues } from '@/lib/seeker'

function SaveStatus({
  saving,
  dirty,
  error,
  savedAt,
  onRetry,
}: {
  saving: boolean
  dirty: boolean
  error: string
  savedAt: string | null
  onRetry: () => void
}) {
  if (saving) {
    return (
      <Badge variant="neutral">
        <LoaderCircle className="animate-spin" />
        保存中
      </Badge>
    )
  }
  if (error) {
    return (
      <div className="flex items-center gap-1.5">
        <Badge variant="destructive">保存失败</Badge>
        <Button size="sm" variant="link" className="h-auto px-1" onClick={onRetry}>
          重试
        </Button>
      </div>
    )
  }
  if (dirty) return <Badge variant="warning">等待保存</Badge>
  return (
    <Badge variant="success">
      <Check />
      已保存 {formatTime(savedAt)}
    </Badge>
  )
}

export function SeekerProfilePage() {
  usePageTitle('个人资料')
  const editor = useSeekerProfileEditor()
  const [mode, setMode] = useState<'manual' | 'ocr'>('manual')
  const [leaving, setLeaving] = useState(false)
  const [notice, setNotice] = useState('')

  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      editor.hasUnsavedChanges &&
      currentLocation.pathname !== nextLocation.pathname,
  )

  async function saveAndLeave() {
    setLeaving(true)
    const ok = await editor.saveNow()
    setLeaving(false)
    if (ok && blocker.state === 'blocked') blocker.proceed()
  }

  function discardAndLeave() {
    editor.discard()
    if (blocker.state === 'blocked') blocker.proceed()
  }

  function closeDialog() {
    if (blocker.state === 'blocked') blocker.reset()
  }

  function applyRecognition(values: Partial<SeekerFormValues>) {
    editor.applyRecognized(values)
    setMode('manual')
    setNotice('识别结果已合并到表单，正在自动保存。')
  }

  if (editor.loading) return <PageLoading label="正在加载个人资料…" />
  if (editor.loadError || !editor.profile) {
    return (
      <div className="space-y-4">
        <Alert
          variant="destructive"
          className="border-destructive/20 bg-destructive/5"
        >
          <AlertCircle />
          <AlertDescription>{editor.loadError || '求职者资料不存在'}</AlertDescription>
        </Alert>
        <Button onClick={() => void editor.reload()}>
          <RefreshCw />
          重新加载
        </Button>
      </div>
    )
  }

  const { form, completeness } = editor
  const today = new Date().toISOString().slice(0, 10)

  return (
    <>
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold tracking-[0.16em] text-primary uppercase">
            求职者中心
          </p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight md:text-[30px]">
            <StaggerText text="个人资料" />
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            完善 13 项资料后即可投递岗位。修改会自动保存，也可以上传简历辅助填写。
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <SaveStatus
            saving={editor.saving}
            dirty={editor.dirty}
            error={editor.saveError}
            savedAt={editor.savedAt}
            onRetry={() => void editor.retrySave()}
          />
          <div className="inline-flex items-center gap-1 rounded-xl border border-border/70 bg-card p-1">
            <Button
              size="sm"
              variant={mode === 'manual' ? 'default' : 'ghost'}
              className="h-8"
              onClick={() => setMode('manual')}
            >
              <PenLine />
              手动填写
            </Button>
            <Button
              size="sm"
              variant={mode === 'ocr' ? 'default' : 'ghost'}
              className="h-8"
              onClick={() => setMode('ocr')}
            >
              <ScanLine />
              简历识别
            </Button>
          </div>
          <Button variant="outline" size="sm" asChild>
            <Link to="/seeker/resume">
              <FileText className="size-4" />
              查看简历
            </Link>
          </Button>
        </div>
      </header>

      {notice ? (
        <Alert className="mt-6 border-emerald-200/80 bg-emerald-50 text-emerald-900">
          <Check />
          <AlertDescription className="text-emerald-900/90">
            {notice}
          </AlertDescription>
        </Alert>
      ) : null}

      {!completeness.isComplete ? (
        <Alert className="mt-6 border-amber-200/80 bg-amber-50 text-amber-900">
          <AlertCircle />
          <AlertDescription className="text-amber-900/90">
            资料尚未完整（{completeness.score}%）。13 项资料全部完成后才能投递岗位。
          </AlertDescription>
        </Alert>
      ) : null}

      {editor.saveError ? (
        <Alert
          variant="destructive"
          className="mt-6 border-destructive/20 bg-destructive/5"
        >
          <AlertCircle />
          <AlertDescription>{editor.saveError}</AlertDescription>
        </Alert>
      ) : null}

      <div className="mt-6 grid items-start gap-5 lg:grid-cols-[minmax(0,1.55fr)_minmax(0,1fr)]">
        <div className="space-y-5">
          {mode === 'ocr' ? (
            <Card className="gap-0 rounded-2xl border-border/70 py-0 shadow-sm ring-0">
              <CardHeader className="border-b border-border/60 px-5 py-4">
                <CardTitle className="flex items-center gap-2 text-[15px] font-semibold">
                  <ScanLine className="size-4 text-primary" />
                  简历识别
                  <Badge variant="neutral">本地 OCR / 规则</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="px-5 py-5">
                <SeekerOCRPanel
                  currentValues={form}
                  onApply={applyRecognition}
                />
              </CardContent>
            </Card>
          ) : (
            <>
              <Card className="gap-0 rounded-2xl border-border/70 py-0 shadow-sm ring-0">
                <CardHeader className="border-b border-border/60 px-5 py-4">
                  <CardTitle className="text-[15px] font-semibold">基本信息</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-4 px-5 py-5 sm:grid-cols-2">
                  <Field label="姓名" htmlFor="seeker-name" required error={editor.errors.name}>
                    <Input
                      id="seeker-name"
                      value={form.name}
                      maxLength={50}
                      placeholder="请输入姓名"
                      className="h-11"
                      onChange={(event) => editor.updateField('name', event.target.value)}
                    />
                  </Field>
                  <Field label="性别" htmlFor="seeker-gender" required>
                    <Input
                      id="seeker-gender"
                      value={form.gender}
                      maxLength={10}
                      placeholder="男 / 女"
                      className="h-11"
                      onChange={(event) => editor.updateField('gender', event.target.value)}
                    />
                  </Field>
                  <Field label="出生日期" htmlFor="seeker-birth" required error={editor.errors.birth_date}>
                    <Input
                      id="seeker-birth"
                      type="date"
                      max={today}
                      value={form.birth_date}
                      className="h-11"
                      onChange={(event) => editor.updateField('birth_date', event.target.value)}
                    />
                  </Field>
                  <Field label="联系电话" htmlFor="seeker-phone" required error={editor.errors.phone}>
                    <Input
                      id="seeker-phone"
                      value={form.phone}
                      maxLength={20}
                      placeholder="手机号或座机"
                      className="h-11"
                      onChange={(event) => editor.updateField('phone', event.target.value)}
                    />
                  </Field>
                  <Field label="邮箱" htmlFor="seeker-email" required error={editor.errors.email}>
                    <Input
                      id="seeker-email"
                      type="email"
                      value={form.email}
                      maxLength={120}
                      placeholder="name@example.com"
                      className="h-11"
                      onChange={(event) => editor.updateField('email', event.target.value)}
                    />
                  </Field>
                  <Field label="户籍所在地" htmlFor="seeker-household" required>
                    <Input
                      id="seeker-household"
                      value={form.household}
                      maxLength={100}
                      placeholder="如：江苏省南京市"
                      className="h-11"
                      onChange={(event) => editor.updateField('household', event.target.value)}
                    />
                  </Field>
                </CardContent>
              </Card>

              <Card className="gap-0 rounded-2xl border-border/70 py-0 shadow-sm ring-0">
                <CardHeader className="border-b border-border/60 px-5 py-4">
                  <CardTitle className="text-[15px] font-semibold">教育背景</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-4 px-5 py-5 sm:grid-cols-2">
                  <Field label="学历" htmlFor="seeker-education" required>
                    <Input
                      id="seeker-education"
                      value={form.education}
                      maxLength={20}
                      placeholder="本科 / 硕士"
                      className="h-11"
                      onChange={(event) => editor.updateField('education', event.target.value)}
                    />
                  </Field>
                  <Field label="毕业学校" htmlFor="seeker-school" required>
                    <Input
                      id="seeker-school"
                      value={form.school}
                      maxLength={100}
                      placeholder="学校名称"
                      className="h-11"
                      onChange={(event) => editor.updateField('school', event.target.value)}
                    />
                  </Field>
                  <Field label="专业" htmlFor="seeker-major" required>
                    <Input
                      id="seeker-major"
                      value={form.major}
                      maxLength={50}
                      placeholder="专业名称"
                      className="h-11"
                      onChange={(event) => editor.updateField('major', event.target.value)}
                    />
                  </Field>
                  <Field label="学位" htmlFor="seeker-degree" required>
                    <Input
                      id="seeker-degree"
                      value={form.degree}
                      maxLength={20}
                      placeholder="工学学士"
                      className="h-11"
                      onChange={(event) => editor.updateField('degree', event.target.value)}
                    />
                  </Field>
                </CardContent>
              </Card>

              <Card className="gap-0 rounded-2xl border-border/70 py-0 shadow-sm ring-0">
                <CardHeader className="border-b border-border/60 px-5 py-4">
                  <CardTitle className="text-[15px] font-semibold">
                    工作经历
                    <span className="ml-2 text-xs font-normal text-muted-foreground">
                      选填
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 px-5 py-5">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="工作单位" htmlFor="seeker-work-company">
                      <Input
                        id="seeker-work-company"
                        value={form.work_company}
                        maxLength={100}
                        placeholder="公司名称"
                        className="h-11"
                        onChange={(event) => editor.updateField('work_company', event.target.value)}
                      />
                    </Field>
                    <Field label="工作职位" htmlFor="seeker-work-title">
                      <Input
                        id="seeker-work-title"
                        value={form.work_title}
                        maxLength={100}
                        placeholder="职位名称"
                        className="h-11"
                        onChange={(event) => editor.updateField('work_title', event.target.value)}
                      />
                    </Field>
                    <Field label="开始时间" htmlFor="seeker-work-start">
                      <Input
                        id="seeker-work-start"
                        value={form.work_start}
                        maxLength={20}
                        placeholder="如：2021.07"
                        className="h-11"
                        onChange={(event) => editor.updateField('work_start', event.target.value)}
                      />
                    </Field>
                    <Field label="结束时间" htmlFor="seeker-work-end">
                      <Input
                        id="seeker-work-end"
                        value={form.work_end}
                        maxLength={20}
                        placeholder="如：至今"
                        className="h-11"
                        onChange={(event) => editor.updateField('work_end', event.target.value)}
                      />
                    </Field>
                  </div>
                  <Field label="工作描述" htmlFor="seeker-work-description">
                    <Textarea
                      id="seeker-work-description"
                      value={form.work_description}
                      maxLength={1000}
                      rows={4}
                      placeholder="描述主要职责和成果"
                      onChange={(event) => editor.updateField('work_description', event.target.value)}
                    />
                  </Field>
                </CardContent>
              </Card>

              <Card className="gap-0 rounded-2xl border-border/70 py-0 shadow-sm ring-0">
                <CardHeader className="border-b border-border/60 px-5 py-4">
                  <CardTitle className="text-[15px] font-semibold">求职意向与技能</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 px-5 py-5">
                  <Field label="求职意向" htmlFor="seeker-intention" required>
                    <Input
                      id="seeker-intention"
                      value={form.job_intention}
                      maxLength={100}
                      placeholder="如：后端开发工程师"
                      className="h-11"
                      onChange={(event) => editor.updateField('job_intention', event.target.value)}
                    />
                  </Field>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field
                      label="期望薪资下限"
                      htmlFor="seeker-salary-min"
                      required
                      error={editor.errors.expected_salary_min}
                      hint="月薪，单位元"
                    >
                      <Input
                        id="seeker-salary-min"
                        type="number"
                        min={0}
                        value={form.expected_salary_min}
                        placeholder="15000"
                        className="h-11"
                        onChange={(event) => editor.updateField('expected_salary_min', event.target.value)}
                      />
                    </Field>
                    <Field
                      label="期望薪资上限"
                      htmlFor="seeker-salary-max"
                      required
                      error={editor.errors.expected_salary_max}
                      hint="月薪，单位元"
                    >
                      <Input
                        id="seeker-salary-max"
                        type="number"
                        min={0}
                        value={form.expected_salary_max}
                        placeholder="25000"
                        className="h-11"
                        onChange={(event) => editor.updateField('expected_salary_max', event.target.value)}
                      />
                    </Field>
                  </div>
                  <Field label="技能" htmlFor="seeker-skills" required>
                    <Textarea
                      id="seeker-skills"
                      value={form.skills}
                      maxLength={2000}
                      rows={4}
                      placeholder="如：Python、FastAPI、MySQL、Redis"
                      onChange={(event) => editor.updateField('skills', event.target.value)}
                    />
                  </Field>
                </CardContent>
              </Card>
            </>
          )}
        </div>

        <div className="space-y-5 lg:sticky lg:top-24">
          <SeekerPreviewCard values={form} />
          <SeekerCompletenessCard completeness={completeness} />
          <Card className="gap-0 rounded-2xl border-border/70 py-0 shadow-sm ring-0">
            <CardHeader className="border-b border-border/60 px-5 py-4">
              <CardTitle className="flex items-center gap-2 text-[15px] font-semibold">
                <FileText className="size-4 text-muted-foreground" />
                我的简历
              </CardTitle>
            </CardHeader>
            <CardContent className="px-5 py-5">
              <p className="text-xs leading-relaxed text-muted-foreground">
                简历由个人资料自动生成，资料保存后会在简历页同步更新。
              </p>
              <Button variant="outline" size="sm" className="mt-4" asChild>
                <Link to="/seeker/resume">
                  <Upload className="size-4" />
                  查看 / 打印简历
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      <UnsavedChangesDialog
        open={blocker.state === 'blocked'}
        saving={leaving}
        error={editor.saveError}
        onSaveAndLeave={() => void saveAndLeave()}
        onDiscard={discardAndLeave}
        onClose={closeDialog}
      />
    </>
  )
}
