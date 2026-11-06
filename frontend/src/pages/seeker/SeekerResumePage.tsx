import { Link } from 'react-router-dom'
import { ArrowLeft, Printer } from 'lucide-react'

import { ResumeDocument } from '@/components/seeker/ResumeDocument'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { PageLoading } from '@/components/ui/page-loading'
import { usePageTitle } from '@/hooks/usePageTitle'
import { useSeekerProfile } from '@/hooks/useSeekerProfile'
import { seekerMissingLabels } from '@/lib/seeker'

export function SeekerResumePage() {
  usePageTitle('我的简历')
  const { profile, loading, error, reload } = useSeekerProfile()

  if (loading) return <PageLoading label="正在生成简历…" />
  if (error || !profile) {
    return (
      <div className="space-y-3">
        <Alert
          variant="destructive"
          className="border-destructive/20 bg-destructive/5"
        >
          <AlertDescription>{error || '简历数据不存在'}</AlertDescription>
        </Alert>
        <Button variant="outline" size="sm" onClick={() => void reload()}>
          重新加载
        </Button>
      </div>
    )
  }

  const missing = seekerMissingLabels(profile.missing_fields)

  return (
    <div>
      <header className="mb-5 flex flex-wrap items-end justify-between gap-4 print:hidden">
        <div>
          <Button variant="ghost" size="sm" className="-ml-2" asChild>
            <Link to="/seeker/profile">
              <ArrowLeft />
              返回资料
            </Link>
          </Button>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight md:text-[28px]">
            我的简历
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            简历由个人资料自动生成，资料保存后会同步更新。
          </p>
        </div>
        <Button onClick={() => window.print()}>
          <Printer />
          打印 / 另存 PDF
        </Button>
      </header>

      {!profile.is_complete ? (
        <Alert className="mb-5 border-amber-200/80 bg-amber-50 text-amber-900 print:hidden">
          <AlertDescription className="text-amber-900/90">
            资料尚未完整，仍可查看和打印。缺少：{missing.join('、')}
          </AlertDescription>
        </Alert>
      ) : null}

      <ResumeDocument profile={profile} />
    </div>
  )
}
