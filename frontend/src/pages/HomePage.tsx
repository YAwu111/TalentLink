import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { LogOut } from 'lucide-react'

import { Button } from '@/components/ui/Button'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { Tag } from '@/components/ui/Tag'
import { usePageTitle } from '@/hooks/usePageTitle'
import type { Role } from '@/api/types'
import { useAuthStore } from '@/stores/auth'

const ROLE_META: Record<Role, { label: string; tone: 'blue' | 'purple' | 'amber' }> = {
  seeker: { label: '求职者', tone: 'blue' },
  employer: { label: '企业', tone: 'purple' },
  admin: { label: '系统管理员', tone: 'amber' },
}

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
  const logout = useAuthStore((state) => state.logout)
  const navigate = useNavigate()

  const [confirmOpen, setConfirmOpen] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)

  if (!user) return null

  const role = ROLE_META[user.role]
  const profileEntries = Object.entries(user.profile ?? {}).filter(
    ([key]) => key !== 'kind',
  )

  async function handleLogout() {
    setLoggingOut(true)
    try {
      await logout()
    } finally {
      setLoggingOut(false)
      setConfirmOpen(false)
      navigate('/login', { replace: true })
    }
  }

  return (
    <div className="home">
      <header className="topbar">
        <div className="topbar__brand">
          <span className="brand-mark brand-mark--sm">T</span>
          <span className="topbar__name">TalentLink</span>
        </div>

        <div className="topbar__user">
          <Tag tone={role.tone} dot>
            {role.label}
          </Tag>
          <span className="topbar__username">{user.display_name}</span>
          <Button
            variant="ghost"
            icon={<LogOut size={15} />}
            onClick={() => setConfirmOpen(true)}
          >
            退出
          </Button>
        </div>
      </header>

      <main className="home__content">
        <section className="welcome">
          <span className="welcome__eyebrow">工作台</span>
          <h1>你好，{user.display_name}</h1>
          <p>登录成功。当前账号已完成认证，可以开始使用系统。</p>
        </section>

        <div className="home-grid">
          <section className="panel">
            <header className="panel__head">
              <h2>账号信息</h2>
            </header>
            <dl className="account-list">
              <div className="account-row">
                <dt>用户名</dt>
                <dd>{user.username}</dd>
              </div>
              <div className="account-row">
                <dt>角色</dt>
                <dd>{role.label}</dd>
              </div>
              <div className="account-row">
                <dt>账号状态</dt>
                <dd>
                  <Tag tone={user.status === 'active' ? 'green' : 'slate'} dot>
                    {user.status === 'active' ? '正常' : '已禁用'}
                  </Tag>
                </dd>
              </div>
              {profileEntries.map(([key, value]) => (
                <div className="account-row" key={key}>
                  <dt>{PROFILE_LABELS[key] ?? key}</dt>
                  <dd>{profileValue(value)}</dd>
                </div>
              ))}
            </dl>
          </section>

          <section className="panel">
            <header className="panel__head">
              <h2>接下来的模块</h2>
            </header>
            <ol className="steps">
              {NEXT_STEPS.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>
            <p className="panel__note">
              当前完成的是认证与权限模块，以上功能按课程设计计划继续推进。
            </p>
          </section>
        </div>
      </main>

      <ConfirmDialog
        open={confirmOpen}
        title="退出登录"
        message="确定要退出登录吗？"
        confirmText="退出"
        loading={loggingOut}
        onConfirm={() => void handleLogout()}
        onClose={() => setConfirmOpen(false)}
      />
    </div>
  )
}
