import { useEffect, useState } from 'react'
import { Link, useBlocker, useLocation, useNavigate } from 'react-router-dom'
import {
  AlertCircle,
  BadgeCheck,
  Check,
  CheckCircle2,
  LoaderCircle,
  RefreshCw,
  ShieldCheck,
  Upload,
} from 'lucide-react'

import { CompletenessCard } from '@/components/company/CompletenessCard'
import { CompanyPreviewCard } from '@/components/company/CompanyPreviewCard'
import { ModeSwitch } from '@/components/company/ModeSwitch'
import { StaggerText } from '@/components/company/StaggerText'
import { UnsavedChangesDialog } from '@/components/company/UnsavedChangesDialog'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Field } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { PageLoading } from '@/components/ui/page-loading'
import { usePageTitle } from '@/hooks/usePageTitle'
import { useCompanyProfileEditor } from '@/hooks/useCompanyProfileEditor'
import { COMPANY_LABELS, type CompanyField } from '@/lib/company'
import { formatTime } from '@/lib/format'
import { useAuthStore } from '@/stores/auth'

interface SaveStatusProps {
  saving: boolean
  dirty: boolean
  error: string
  savedAt: string | null
  onRetry: () => void
}

function SaveStatus({ saving, dirty, error, savedAt, onRetry }: SaveStatusProps) {
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
  if (dirty) {
    return <Badge variant="warning">等待保存</Badge>
  }
  return (
    <Badge variant="success">
      <Check />
      已保存 {formatTime(savedAt)}
    </Badge>
  )
}

export function CompanyProfilePage() {
  usePageTitle('企业资料')

  const editor = useCompanyProfileEditor()
  const [leaving, setLeaving] = useState(false)
  const [appliedNotice, setAppliedNotice] = useState<number | null>(null)
  const user = useAuthStore((state) => state.user)
  const location = useLocation()
  const navigate = useNavigate()

  useEffect(() => {
    const state = location.state as { applied?: number } | null
    if (!state?.applied) return
    setAppliedNotice(state.applied)
    navigate(location.pathname, { replace: true, state: null })
  }, [location.pathname, location.state, navigate])

  useEffect(() => {
    if (!appliedNotice) return
    const timer = window.setTimeout(() => setAppliedNotice(null), 6000)
    return () => window.clearTimeout(timer)
  }, [appliedNotice])

  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      Boolean(user) &&
      editor.hasUnsavedChanges &&
      currentLocation.pathname !== nextLocation.pathname,
  )

  async function handleSaveAndLeave() {
    setLeaving(true)
    const ok = await editor.saveNow()
    setLeaving(false)
    if (ok && blocker.state === 'blocked') blocker.proceed()
  }

  function handleDiscard() {
    editor.discard()
    if (blocker.state === 'blocked') blocker.proceed()
  }

  function handleCloseDialog() {
    if (blocker.state === 'blocked') blocker.reset()
  }

  if (editor.loading) {
    return <PageLoading label="正在加载企业资料…" />
  }

  if (editor.loadError || !editor.profile) {
    return (
      <div className="space-y-4">
        <Alert
          variant="destructive"
          className="border-destructive/20 bg-destructive/5"
        >
          <AlertCircle />
          <AlertDescription>
            {editor.loadError || '企业资料不存在'}
          </AlertDescription>
        </Alert>
        <Button onClick={() => void editor.reload()}>
          <RefreshCw />
          重新加载
        </Button>
      </div>
    )
  }

  const { profile, form } = editor
  const missingLabels = editor.completeness.missing
    .map((field: CompanyField) => COMPANY_LABELS[field])
    .join('、')

  return (
    <>
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold tracking-[0.16em] text-primary uppercase">
            企业中心
          </p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight md:text-[30px]">
            <StaggerText text="企业资料" />
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            完善企业信息，让求职者更快了解你。修改会自动保存，不需要手动提交。
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
          <ModeSwitch value="manual" />
        </div>
      </header>

      {appliedNotice ? (
        <Alert className="mt-6 border-emerald-200/80 bg-emerald-50 text-emerald-900">
          <CheckCircle2 />
          <AlertDescription className="text-emerald-900/90">
            已应用 {appliedNotice} 个识别字段，修改已自动保存。
          </AlertDescription>
        </Alert>
      ) : null}

      {!editor.completeness.isComplete ? (
        <Alert className="mt-6 border-amber-200/80 bg-amber-50 text-amber-900">
          <AlertCircle />
          <AlertDescription className="text-amber-900/90">
            资料尚未完整：{missingLabels}。完成后企业岗位才能接收投递，并进入推送范围。
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
        <Card className="gap-0 rounded-2xl border-border/70 py-0 shadow-sm ring-0">
          <CardHeader className="border-b border-border/60 px-5 py-4">
            <CardTitle className="text-[15px] font-semibold">企业基本信息</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5 px-5 py-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                label="企业名称"
                htmlFor="company-name"
                required
                hint="展示在岗位与企业名片上"
              >
                <Input
                  id="company-name"
                  value={form.name}
                  maxLength={100}
                  placeholder="请输入企业全称"
                  className="h-11"
                  onChange={(event) =>
                    editor.updateField('name', event.target.value)
                  }
                />
              </Field>
              <Field label="经营行业" htmlFor="company-industry" required>
                <Input
                  id="company-industry"
                  value={form.industry}
                  maxLength={50}
                  placeholder="如：互联网 / 软件"
                  className="h-11"
                  onChange={(event) =>
                    editor.updateField('industry', event.target.value)
                  }
                />
              </Field>
              <Field label="企业电话" htmlFor="company-phone" required>
                <Input
                  id="company-phone"
                  value={form.phone}
                  maxLength={20}
                  placeholder="如：021-58889000"
                  className="h-11"
                  onChange={(event) =>
                    editor.updateField('phone', event.target.value)
                  }
                />
              </Field>
              <Field label="企业地址" htmlFor="company-address" required>
                <Input
                  id="company-address"
                  value={form.address}
                  maxLength={200}
                  placeholder="如：上海市浦东新区张江路 88 号"
                  className="h-11"
                  onChange={(event) =>
                    editor.updateField('address', event.target.value)
                  }
                />
              </Field>
            </div>

            <Field
              label="企业简介"
              htmlFor="company-intro"
              required
              hint="建议写明主营业务、团队规模与发展阶段"
            >
              <Textarea
                id="company-intro"
                value={form.intro}
                maxLength={2000}
                rows={6}
                placeholder="向求职者介绍你的企业……"
                className="min-h-[150px] resize-y"
                onChange={(event) =>
                  editor.updateField('intro', event.target.value)
                }
              />
            </Field>

            <p className="border-t border-dashed border-border/70 pt-4 text-xs leading-relaxed text-muted-foreground">
              修改会自动保存。资料完整前，企业岗位暂不能接收投递，也不会进入推送范围。
            </p>
          </CardContent>
        </Card>

        <div className="space-y-5 lg:sticky lg:top-24">
          <CompanyPreviewCard
            values={form}
            verified={profile.verified}
            companyId={profile.id}
          />
          <CompletenessCard completeness={editor.completeness} />

          <Card className="gap-0 rounded-2xl border-border/70 py-0 shadow-sm ring-0">
            <CardHeader className="border-b border-border/60 px-5 py-4">
              <CardTitle className="flex items-center gap-2 text-[15px] font-semibold">
                <ShieldCheck className="size-4 text-muted-foreground" />
                身份认证
              </CardTitle>
            </CardHeader>
            <CardContent className="px-5 py-5">
              <div className="flex items-center gap-2">
                {profile.verified ? (
                  <Badge variant="success">
                    <BadgeCheck />
                    已认证企业
                  </Badge>
                ) : (
                  <Badge variant="warning">待认证</Badge>
                )}
              </div>
              <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
                身份材料用于管理员审核，不参与资料完整度计算，也不影响岗位展示。
              </p>
              <Button variant="outline" size="sm" className="mt-4" asChild>
                <Link to="/employer/profile/upload?type=identity">
                  <Upload className="size-4" />
                  上传身份材料
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
        onSaveAndLeave={() => void handleSaveAndLeave()}
        onDiscard={handleDiscard}
        onClose={handleCloseDialog}
      />
    </>
  )
}
