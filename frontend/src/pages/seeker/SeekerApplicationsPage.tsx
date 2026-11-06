import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Send } from 'lucide-react'

import { ApplicationCard } from '@/components/seeker/ApplicationCard'
import { StaggerText } from '@/components/company/StaggerText'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { usePageTitle } from '@/hooks/usePageTitle'
import {
  APPLICATION_STATUS_META,
  type MockApplicationStatus,
} from '@/lib/mock-seeker'
import { useMockApplications } from '@/stores/mockApplications'

type Filter = 'all' | MockApplicationStatus

const FILTERS: { value: Filter; label: string }[] = [
  { value: 'all', label: '全部' },
  { value: 'submitted', label: '已投递' },
  { value: 'viewed', label: '已查看' },
  { value: 'interview', label: '面试中' },
  { value: 'offered', label: '已录用' },
  { value: 'rejected', label: '未通过' },
]

export function SeekerApplicationsPage() {
  usePageTitle('我的投递')
  const applications = useMockApplications((state) => state.applications)
  const [filter, setFilter] = useState<Filter>('all')

  const filtered = useMemo(
    () =>
      filter === 'all'
        ? applications
        : applications.filter((item) => item.status === filter),
    [applications, filter],
  )

  return (
    <>
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold tracking-[0.16em] text-primary uppercase">
            求职者中心
          </p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight md:text-[30px]">
            <StaggerText text="我的投递" />
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            跟进投递状态。当前为演示数据，刷新页面后恢复初始记录。
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="neutral">演示数据</Badge>
          <Button size="sm" asChild>
            <Link to="/seeker/jobs">
              <Send />
              继续投递
            </Link>
          </Button>
        </div>
      </header>

      <div className="mt-5 flex flex-wrap gap-2">
        {FILTERS.map((item) => (
          <Button
            key={item.value}
            size="sm"
            variant={filter === item.value ? 'default' : 'outline'}
            onClick={() => setFilter(item.value)}
          >
            {item.label}
            <span className="ml-1 tabular-nums opacity-70">
              {item.value === 'all'
                ? applications.length
                : applications.filter((app) => app.status === item.value).length}
            </span>
          </Button>
        ))}
      </div>

      <div className="mt-4 grid gap-3">
        {filtered.map((application) => (
          <ApplicationCard key={application.id} application={application} />
        ))}
      </div>

      {filtered.length === 0 ? (
        <Card className="mt-4 gap-0 rounded-2xl border-dashed border-border/80 py-0 shadow-none ring-0">
          <CardContent className="grid min-h-[240px] place-items-center text-center">
            <div>
              <Send className="mx-auto size-8 text-muted-foreground" />
              <p className="mt-3 text-sm font-semibold">暂无投递记录</p>
              <p className="mt-1 text-xs text-muted-foreground">
                去岗位列表看看有没有合适的机会。
              </p>
              <Button size="sm" className="mt-3" asChild>
                <Link to="/seeker/jobs">浏览岗位</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : null}

      <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
        状态说明：
        {Object.values(APPLICATION_STATUS_META)
          .map((item) => item.label)
          .join(' / ')}
      </p>
    </>
  )
}
