import { useEffect, useState } from 'react'
import { BriefcaseBusiness, LoaderCircle, Search, SlidersHorizontal } from 'lucide-react'

import { seekerJobsApi, type Job } from '@/api/jobs'
import { JobCard } from '@/components/seeker/JobCard'
import { StaggerText } from '@/components/company/StaggerText'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { usePageTitle } from '@/hooks/usePageTitle'
import { errorText } from '@/lib/error'
import { cn } from '@/lib/utils'

const CITIES = ['全部城市', '上海', '深圳']
const INDUSTRIES = ['全部行业', '互联网 / 软件', '大数据']
const SALARY_RANGES = [
  { label: '全部薪资', min: undefined, max: undefined },
  { label: '8K–15K', min: 8000, max: 15000 },
  { label: '15K–25K', min: 15000, max: 25000 },
  { label: '25K 以上', min: 25000, max: undefined },
] as const

export function SeekerJobsPage() {
  usePageTitle('岗位浏览')
  const [keyword, setKeyword] = useState('')
  const [city, setCity] = useState('全部城市')
  const [industry, setIndustry] = useState('全部行业')
  const [salaryIndex, setSalaryIndex] = useState(0)
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let alive = true
    const timer = window.setTimeout(async () => {
      setLoading(true)
      setError('')
      try {
        const range = SALARY_RANGES[salaryIndex]
        const data = await seekerJobsApi.list({
          keyword: keyword.trim() || undefined,
          city: city === '全部城市' ? undefined : city,
          industry: industry === '全部行业' ? undefined : industry,
          salary_min: range.min,
          salary_max: range.max,
        })
        if (alive) setJobs(data)
      } catch (err) {
        if (alive) setError(errorText(err, '岗位加载失败'))
      } finally {
        if (alive) setLoading(false)
      }
    }, 250)
    return () => {
      alive = false
      window.clearTimeout(timer)
    }
  }, [keyword, city, industry, salaryIndex])

  function resetFilters() {
    setKeyword('')
    setCity('全部城市')
    setIndustry('全部行业')
    setSalaryIndex(0)
  }

  const hasFilters =
    keyword ||
    city !== '全部城市' ||
    industry !== '全部行业' ||
    salaryIndex !== 0

  return (
    <>
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold tracking-[0.16em] text-primary uppercase">
            求职者中心
          </p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight md:text-[30px]">
            <StaggerText text="岗位浏览" />
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            浏览企业已发布岗位，投递会写入后端并出现在「我的投递」中。
          </p>
        </div>
        <Badge variant="success">真实岗位</Badge>
      </header>

      <Card className="mt-5 gap-0 rounded-2xl border-border/70 py-0 shadow-sm ring-0">
        <CardContent className="space-y-3 px-5 py-4">
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative min-w-[220px] flex-1">
              <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={keyword}
                placeholder="搜索岗位、企业或技能"
                className="h-10 pl-9"
                onChange={(event) => setKeyword(event.target.value)}
              />
            </div>
            <select
              value={city}
              onChange={(event) => setCity(event.target.value)}
              className="h-10 rounded-lg border border-input bg-card px-3 text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
              aria-label="城市筛选"
            >
              {CITIES.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
            <select
              value={industry}
              onChange={(event) => setIndustry(event.target.value)}
              className="h-10 rounded-lg border border-input bg-card px-3 text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
              aria-label="行业筛选"
            >
              {INDUSTRIES.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
            <select
              value={salaryIndex}
              onChange={(event) => setSalaryIndex(Number(event.target.value))}
              className="h-10 rounded-lg border border-input bg-card px-3 text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
              aria-label="薪资筛选"
            >
              {SALARY_RANGES.map((item, index) => (
                <option key={item.label} value={index}>
                  {item.label}
                </option>
              ))}
            </select>
            <Button
              variant="ghost"
              size="sm"
              className={cn(!hasFilters && 'hidden')}
              onClick={resetFilters}
            >
              重置
            </Button>
          </div>
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <SlidersHorizontal className="size-3.5" />
            共 {jobs.length} 个岗位
          </p>
        </CardContent>
      </Card>

      {error ? (
        <Alert
          variant="destructive"
          className="mt-5 border-destructive/20 bg-destructive/5"
        >
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      {loading ? (
        <div className="mt-8 grid min-h-[220px] place-items-center">
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <LoaderCircle className="size-4 animate-spin" />
            正在加载岗位…
          </p>
        </div>
      ) : jobs.length > 0 ? (
        <div className="mt-5 grid gap-3">
          {jobs.map((job) => (
            <JobCard key={job.id} job={job} />
          ))}
        </div>
      ) : (
        <Card className="mt-5 gap-0 rounded-2xl border-dashed border-border/80 py-0 shadow-none ring-0">
          <CardContent className="grid min-h-[240px] place-items-center text-center">
            <div>
              <BriefcaseBusiness className="mx-auto size-8 text-muted-foreground" />
              <p className="mt-3 text-sm font-semibold">没有匹配的岗位</p>
              <p className="mt-1 text-xs text-muted-foreground">
                调整关键词或筛选条件后再试。
              </p>
              <Button variant="outline" size="sm" className="mt-3" onClick={resetFilters}>
                重置筛选
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </>
  )
}
