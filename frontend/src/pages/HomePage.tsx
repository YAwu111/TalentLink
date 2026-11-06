import { StaggerText } from '@/components/company/StaggerText'
import { FadeIn } from '@/components/motion/fade-in'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { usePageTitle } from '@/hooks/usePageTitle'
import { ROLE_META } from '@/lib/role'
import { useAuthStore } from '@/stores/auth'
import { SeekerDashboard } from '@/pages/seeker/SeekerDashboard'

const PROFILE_LABELS: Record<string, string> = {
  id: '编号',
  name: '姓名',
  gender: '性别',
  age: '年龄',
  birth_date: '出生日期',
  phone: '联系电话',
  email: '邮箱',
  household: '户籍所在地',
  education: '最后学历',
  major: '专业',
  degree: '学位',
  school: '毕业学校',
  skills: '业务技能',
  address: '企业地址',
  intro: '企业简介',
  industry: '经营行业',
  verified: '企业认证',
}

const NEXT_STEPS = [
  '岗位发布与检索（企业侧）',
  '简历投递与状态流转（求职者侧）',
  '简历解析与智能匹配（双向推送）',
  '管理员驾驶舱与测试台',
]

function profileValue(value: unknown): string {
  if (value === null || value === undefined || value === '') return '—'
  if (typeof value === 'boolean') return value ? '已认证' : '未认证'
  return String(value)
}

export function HomePage() {
  usePageTitle('工作台')

  const user = useAuthStore((state) => state.user)
  if (!user) return null
  if (user.role === 'seeker') return <SeekerDashboard />

  const role = ROLE_META[user.role]
  const profileEntries = Object.entries(user.profile ?? {}).filter(
    ([key]) => key !== 'kind',
  )

  return (
    <div>
      <FadeIn>
        <p className="text-[11px] font-semibold tracking-[0.16em] text-primary uppercase">
          工作台
        </p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight md:text-[28px]">
          <StaggerText text={`你好，${user.display_name}`} />
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
          登录成功。当前账号已完成认证，可以开始使用系统。
        </p>
      </FadeIn>

      <div className="mt-6 grid gap-5 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <FadeIn delay={0.06} className="min-w-0">
          <Card className="gap-0 overflow-hidden rounded-2xl border-border/70 py-0 shadow-sm ring-0">
            <CardHeader className="border-b border-border/60 px-5 py-4">
              <CardTitle className="text-[15px] font-semibold">账号信息</CardTitle>
            </CardHeader>
            <CardContent className="px-5 pt-1.5 pb-4">
              <dl className="divide-y divide-dashed divide-border/70">
                <div className="grid grid-cols-[8.5rem_1fr] gap-4 py-2.5 max-sm:grid-cols-1 max-sm:gap-0.5">
                  <dt className="text-[13px] text-muted-foreground">用户名</dt>
                  <dd className="text-[13.5px] font-medium break-words">
                    {user.username}
                  </dd>
                </div>
                <div className="grid grid-cols-[8.5rem_1fr] gap-4 py-2.5 max-sm:grid-cols-1 max-sm:gap-0.5">
                  <dt className="text-[13px] text-muted-foreground">角色</dt>
                  <dd className="text-[13.5px] font-medium">{role.label}</dd>
                </div>
                <div className="grid grid-cols-[8.5rem_1fr] gap-4 py-2.5 max-sm:grid-cols-1 max-sm:gap-0.5">
                  <dt className="text-[13px] text-muted-foreground">账号状态</dt>
                  <dd>
                    <Badge
                      variant={user.status === 'active' ? 'success' : 'neutral'}
                    >
                      {user.status === 'active' ? '正常' : '已禁用'}
                    </Badge>
                  </dd>
                </div>
                {profileEntries.map(([key, value]) => (
                  <div
                    key={key}
                    className="grid grid-cols-[8.5rem_1fr] gap-4 py-2.5 max-sm:grid-cols-1 max-sm:gap-0.5"
                  >
                    <dt className="text-[13px] text-muted-foreground">
                      {PROFILE_LABELS[key] ?? key}
                    </dt>
                    <dd className="text-[13.5px] font-medium break-words whitespace-pre-wrap">
                      {profileValue(value)}
                    </dd>
                  </div>
                ))}
              </dl>
            </CardContent>
          </Card>
        </FadeIn>

        <FadeIn delay={0.12} className="min-w-0">
          <Card className="gap-0 overflow-hidden rounded-2xl border-border/70 py-0 shadow-sm ring-0">
            <CardHeader className="border-b border-border/60 px-5 py-4">
              <CardTitle className="text-[15px] font-semibold">接下来的模块</CardTitle>
            </CardHeader>
            <CardContent className="px-5 pt-4 pb-5">
              <ol className="space-y-3.5">
                {NEXT_STEPS.map((step, index) => (
                  <li
                    key={step}
                    className="flex gap-3 text-[13.5px] leading-relaxed text-foreground/80"
                  >
                    <span className="grid size-6 shrink-0 place-items-center rounded-lg bg-accent text-[11px] font-semibold text-accent-foreground">
                      {index + 1}
                    </span>
                    <span>{step}</span>
                  </li>
                ))}
              </ol>
              <p className="mt-5 border-t border-dashed border-border/70 pt-4 text-xs leading-relaxed text-muted-foreground">
                当前完成的是认证与权限模块，以上功能按课程设计计划继续推进。
              </p>
            </CardContent>
          </Card>
        </FadeIn>
      </div>
    </div>
  )
}
