import { useEffect, useState } from 'react'
import {
  BriefcaseBusiness,
  LoaderCircle,
  Pencil,
  Plus,
  Rocket,
  StopCircle,
} from 'lucide-react'

import {
  employerJobsApi,
  formatSalaryRange,
  type Job,
  type JobCreate,
} from '@/api/jobs'
import { StaggerText } from '@/components/company/StaggerText'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Field } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { PageLoading } from '@/components/ui/page-loading'
import { Textarea } from '@/components/ui/textarea'
import { usePageTitle } from '@/hooks/usePageTitle'
import { errorText } from '@/lib/error'
import { formatDateTime } from '@/lib/format'

const EMPTY_FORM: JobCreate = {
  title: '',
  requirement: '',
  other_requirement: '',
  salary_min: 0,
  salary_max: null,
  headcount: 1,
}

const STATUS_META = {
  draft: { label: '草稿', variant: 'neutral' as const },
  published: { label: '已发布', variant: 'success' as const },
  closed: { label: '已关闭', variant: 'neutral' as const },
}

export function EmployerJobsPage() {
  usePageTitle('岗位管理')
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [actionError, setActionError] = useState('')
  const [formOpen, setFormOpen] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [form, setForm] = useState<JobCreate>(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [actionId, setActionId] = useState<number | null>(null)

  async function loadJobs() {
    setLoading(true)
    setError('')
    try {
      setJobs(await employerJobsApi.list())
    } catch (err) {
      setError(errorText(err, '岗位列表加载失败'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadJobs()
  }, [])

  function openCreate() {
    setEditingId(null)
    setForm(EMPTY_FORM)
    setActionError('')
    setFormOpen(true)
  }

  function openEdit(job: Job) {
    setEditingId(job.id)
    setForm({
      title: job.title,
      requirement: job.requirement,
      other_requirement: job.other_requirement,
      salary_min: job.salary_min,
      salary_max: job.salary_max,
      headcount: job.headcount,
    })
    setActionError('')
    setFormOpen(true)
  }

  async function saveJob() {
    if (!form.title.trim()) {
      setActionError('岗位名称不能为空')
      return
    }
    if (form.salary_max !== null && form.salary_min > form.salary_max) {
      setActionError('薪资下限不能高于上限')
      return
    }
    setSaving(true)
    setActionError('')
    try {
      if (editingId === null) {
        await employerJobsApi.create(form)
      } else {
        await employerJobsApi.update(editingId, form)
      }
      setFormOpen(false)
      await loadJobs()
    } catch (err) {
      setActionError(errorText(err, '岗位保存失败'))
    } finally {
      setSaving(false)
    }
  }

  async function changeStatus(job: Job, action: 'publish' | 'close') {
    setActionId(job.id)
    setActionError('')
    try {
      if (action === 'publish') await employerJobsApi.publish(job.id)
      else await employerJobsApi.close(job.id)
      await loadJobs()
    } catch (err) {
      setActionError(errorText(err, '岗位状态更新失败'))
    } finally {
      setActionId(null)
    }
  }

  if (loading && jobs.length === 0) {
    return <PageLoading label="正在加载岗位…" />
  }

  return (
    <>
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold tracking-[0.16em] text-primary uppercase">
            企业中心
          </p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight md:text-[30px]">
            <StaggerText text="岗位管理" />
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            创建、编辑、发布和关闭岗位。发布前会校验企业资料完整度。
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus />
          新建岗位
        </Button>
      </header>

      {error ? (
        <Alert
          variant="destructive"
          className="mt-5 border-destructive/20 bg-destructive/5"
        >
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}
      {actionError && !formOpen ? (
        <Alert
          variant="destructive"
          className="mt-5 border-destructive/20 bg-destructive/5"
        >
          <AlertDescription>{actionError}</AlertDescription>
        </Alert>
      ) : null}

      <div className="mt-5 grid gap-3">
        {jobs.map((job) => {
          const meta = STATUS_META[job.status]
          return (
            <Card
              key={job.id}
              className="gap-0 rounded-2xl border-border/70 py-0 shadow-sm ring-0"
            >
              <CardContent className="flex flex-wrap items-start justify-between gap-4 px-5 py-4">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-base font-semibold">{job.title}</h2>
                    <Badge variant={meta.variant}>{meta.label}</Badge>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {formatSalaryRange(job.salary_min, job.salary_max)} · 招{' '}
                    {job.headcount} 人
                    {job.published_at
                      ? ` · 发布于 ${formatDateTime(job.published_at)}`
                      : ''}
                  </p>
                  <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                    {job.requirement || '岗位要求待补充'}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openEdit(job)}
                  >
                    <Pencil />
                    编辑
                  </Button>
                  {job.status !== 'published' ? (
                    <Button
                      size="sm"
                      disabled={actionId === job.id}
                      onClick={() => void changeStatus(job, 'publish')}
                    >
                      {actionId === job.id ? (
                        <LoaderCircle className="animate-spin" />
                      ) : (
                        <Rocket />
                      )}
                      {job.status === 'closed' ? '重新发布' : '发布'}
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={actionId === job.id}
                      onClick={() => void changeStatus(job, 'close')}
                    >
                      {actionId === job.id ? (
                        <LoaderCircle className="animate-spin" />
                      ) : (
                        <StopCircle />
                      )}
                      关闭
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {!loading && jobs.length === 0 ? (
        <Card className="mt-5 gap-0 rounded-2xl border-dashed border-border/80 py-0 shadow-none ring-0">
          <CardContent className="grid min-h-[240px] place-items-center text-center">
            <div>
              <BriefcaseBusiness className="mx-auto size-8 text-muted-foreground" />
              <p className="mt-3 text-sm font-semibold">还没有岗位</p>
              <p className="mt-1 text-xs text-muted-foreground">
                创建第一个岗位，发布后才会出现在求职者岗位列表。
              </p>
              <Button size="sm" className="mt-3" onClick={openCreate}>
                <Plus />
                新建岗位
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : null}

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-h-[88vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingId === null ? '新建岗位' : '编辑岗位'}</DialogTitle>
            <DialogDescription>
              保存为草稿；发布前请确认岗位信息完整。
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4">
            {actionError ? (
              <Alert
                variant="destructive"
                className="border-destructive/20 bg-destructive/5"
              >
                <AlertDescription>{actionError}</AlertDescription>
              </Alert>
            ) : null}
            <Field label="岗位名称" htmlFor="job-title" required>
              <Input
                id="job-title"
                value={form.title}
                maxLength={100}
                placeholder="如：后端开发工程师"
                onChange={(event) =>
                  setForm({ ...form, title: event.target.value })
                }
              />
            </Field>
            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="薪资下限" htmlFor="job-salary-min" required hint="元/月">
                <Input
                  id="job-salary-min"
                  type="number"
                  min={0}
                  value={form.salary_min}
                  onChange={(event) =>
                    setForm({ ...form, salary_min: Number(event.target.value) || 0 })
                  }
                />
              </Field>
              <Field label="薪资上限" htmlFor="job-salary-max" hint="元/月，可空">
                <Input
                  id="job-salary-max"
                  type="number"
                  min={0}
                  value={form.salary_max ?? ''}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      salary_max: event.target.value
                        ? Number(event.target.value)
                        : null,
                    })
                  }
                />
              </Field>
              <Field label="招聘人数" htmlFor="job-headcount" required>
                <Input
                  id="job-headcount"
                  type="number"
                  min={1}
                  value={form.headcount}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      headcount: Math.max(1, Number(event.target.value) || 1),
                    })
                  }
                />
              </Field>
            </div>
            <Field label="岗位要求" htmlFor="job-requirement">
              <Textarea
                id="job-requirement"
                value={form.requirement}
                maxLength={4000}
                rows={5}
                placeholder="岗位职责、技能要求等"
                onChange={(event) =>
                  setForm({ ...form, requirement: event.target.value })
                }
              />
            </Field>
            <Field label="其他要求" htmlFor="job-other">
              <Textarea
                id="job-other"
                value={form.other_requirement}
                maxLength={2000}
                rows={3}
                placeholder="加分项、工作地点说明等"
                onChange={(event) =>
                  setForm({ ...form, other_requirement: event.target.value })
                }
              />
            </Field>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setFormOpen(false)}>
              取消
            </Button>
            <Button onClick={() => void saveJob()} disabled={saving}>
              {saving ? <LoaderCircle className="animate-spin" /> : null}
              保存草稿
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
