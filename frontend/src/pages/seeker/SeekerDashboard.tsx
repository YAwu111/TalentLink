import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight,
  BriefcaseBusiness,
  FileText,
  LoaderCircle,
  Send,
  UserRound,
} from 'lucide-react'

import {
  APPLICATION_STATUS_META,
  seekerJobsApi,
  type Application,
  type Job,
} from '@/api/jobs'
import { SeekerCompletenessCard } from '@/components/seeker/SeekerCompletenessCard'
import { SeekerPreviewCard } from '@/components/seeker/SeekerPreviewCard'
import { JobCard } from '@/components/seeker/JobCard'
import { StaggerText } from '@/components/company/StaggerText'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PageLoading } from '@/components/ui/page-loading'
import { usePageTitle } from '@/hooks/usePageTitle'
import { useSeekerProfile } from '@/hooks/useSeekerProfile'
import { errorText } from '@/lib/error'
import { toSeekerForm } from '@/lib/seeker'

export function SeekerDashboard() {
  usePageTitle('求职者工作台')
  const { profile, loading, error, reload } = useSeekerProfile()
  const [jobs, setJobs] = useState<Job[]>([])
  const [applications, setApplications] = useState<Application[]>([])
  const [dataLoading, setDataLoading] = useState(true)
  const [dataError, setDataError] = useState('')

  useEffect(() => {
    let alive = true
    setDataLoading(true)
    setDataError('')
    Promise.all([seekerJobsApi.list(), seekerJobsApi.applications()])
      .then(([jobData, applicationData]) => {
        if (!alive) return
        setJobs(jobData)
        setApplications(applicationData)
      })
      .catch((err) => {
        if (alive) setDataError(errorText(err, '岗位与投递加载失败'))
      })
      .finally(() => {
        if (alive) setDataLoading(false)
      })
    return () => {
      alive = false
    }
  }, [])

  if (loading) return <PageLoading label="正在加载求职者工作台…" />
  if (error || !profile) {
    return (
      <Alert
        variant="destructive"
        className="border-destructive/20 bg-destructive/5"
      >
        <AlertDescription>{error || '求职者资料不存在'}</AlertDescription>
        <Button variant="outline" size="sm" className="mt-2" onClick={() => void reload()}>
          重新加载
        </Button>
      </Alert>
    )
  }

  const form = toSeekerForm(profile)
  const completeness = {
    score: profile.completeness,
    missing: profile.missing_fields,
    isComplete: profile.is_complete,
  }
  const latest = applications.slice(0, 2)
  const recommended = jobs.filter((job) => !job.applied).slice(0, 2)
  const recommendedJobs = recommended.length > 0 ? recommended : jobs.slice(0, 2)

  return (
    <div>
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold tracking-[0.16em] text-primary uppercase">
            求职者工作台
          </p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight md:text-[30px]">
            <StaggerText text={`你好，${profile.name || '求职者'}`} />
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            完善资料、浏览岗位、跟进投递状态。岗位与投递数据来自后端。
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link to="/seeker/profile">
              <UserRound className="size-4" />
              个人资料
            </Link>
          </Button>
          <Button size="sm" asChild>
            <Link to="/seeker/jobs">
              <BriefcaseBusiness className="size-4" />
              浏览岗位
            </Link>
          </Button>
        </div>
      </header>

      {!profile.is_complete ? (
        <Alert className="mt-5 border-amber-200/80 bg-amber-50 text-amber-900">
          <AlertDescription className="text-amber-900/90">
            资料完整度 {profile.completeness}%，补全后才可以投递岗位。
            <Link className="ml-1 font-medium underline" to="/seeker/profile">
              去完善
            </Link>
          </AlertDescription>
        </Alert>
      ) : null}

      {dataError ? (
        <Alert
          variant="destructive"
          className="mt-5 border-destructive/20 bg-destructive/5"
        >
          <AlertDescription>{dataError}</AlertDescription>
        </Alert>
      ) : null}

      <div className="mt-6 grid items-start gap-5 lg:grid-cols-[minmax(0,1.45fr)_minmax(0,1fr)]">
        <div className="space-y-5">
          <section>
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold">推荐岗位</h2>
              <Button variant="link" size="sm" className="h-auto p-0" asChild>
                <Link to="/seeker/jobs">
                  查看全部
                  <ArrowRight />
                </Link>
              </Button>
            </div>
            <div className="mt-3 grid gap-3">
              {dataLoading ? (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <LoaderCircle className="size-3.5 animate-spin" />
                  正在加载岗位…
                </div>
              ) : recommendedJobs.length > 0 ? (
                recommendedJobs.map((job) => <JobCard key={job.id} job={job} />)
              ) : (
                <p className="text-xs text-muted-foreground">暂无已发布岗位。</p>
              )}
            </div>
          </section>

          <Card className="gap-0 rounded-2xl border-border/70 py-0 shadow-sm ring-0">
            <CardHeader className="flex flex-row items-center justify-between border-b border-border/60 px-5 py-4">
              <CardTitle className="flex items-center gap-2 text-[15px] font-semibold">
                <Send className="size-4 text-muted-foreground" />
                最近投递
              </CardTitle>
              <Button variant="link" size="sm" className="h-auto p-0" asChild>
                <Link to="/seeker/applications">
                  全部投递
                  <ArrowRight />
                </Link>
              </Button>
            </CardHeader>
            <CardContent className="px-5 py-4">
              <div className="space-y-2.5">
                {latest.map((application) => {
                  const meta = APPLICATION_STATUS_META[application.status] ?? {
                    label: application.status,
                    variant: 'neutral' as const,
                  }
                  return (
                    <div
                      key={application.id}
                      className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border/60 px-3 py-2.5 text-xs"
                    >
                      <span className="font-medium">
                        {application.job_title}
                      </span>
                      <span className="text-muted-foreground">
                        {application.company_name}
                      </span>
                      <Badge variant={meta.variant}>{meta.label}</Badge>
                    </div>
                  )
                })}
              </div>
              {latest.length === 0 ? (
                <p className="text-xs text-muted-foreground">
                  还没有投递记录。
                </p>
              ) : null}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-5">
          <SeekerPreviewCard values={form} />
          <SeekerCompletenessCard completeness={completeness} />
          <Card className="gap-0 rounded-2xl border-border/70 py-0 shadow-sm ring-0">
            <CardContent className="px-5 py-5">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <FileText className="size-4 text-muted-foreground" />
                我的简历
              </div>
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                简历由资料自动生成，可查看并打印。
              </p>
              <Button variant="outline" size="sm" className="mt-3" asChild>
                <Link to="/seeker/resume">查看简历</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
