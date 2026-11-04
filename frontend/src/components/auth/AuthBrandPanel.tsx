import { CheckCircle2 } from 'lucide-react'

interface AuthBrandPanelProps {
  subtitle?: string
  points?: string[]
}

const DEFAULT_POINTS = [
  '简历解析与岗位智能匹配',
  '企业与求职者双向推送',
  '招聘数据可视化看板',
]

export function AuthBrandPanel({
  subtitle = '把合适的人，送到合适的岗位',
  points = DEFAULT_POINTS,
}: AuthBrandPanelProps) {
  return (
    <aside className="auth-brand">
      <div className="auth-brand__glow" aria-hidden="true" />
      <div className="auth-brand__grid" aria-hidden="true" />

      <div className="auth-brand__content">
        <div className="brand-lockup">
          <span className="brand-mark">T</span>
          <div>
            <h1>TalentLink</h1>
            <p>网上招聘系统</p>
          </div>
        </div>

        <p className="auth-brand__subtitle">{subtitle}</p>

        <ul className="auth-brand__points">
          {points.map((point) => (
            <li key={point}>
              <CheckCircle2 size={17} />
              <span>{point}</span>
            </li>
          ))}
        </ul>
      </div>

      <span className="auth-brand__foot">软件工程课程设计 · 020</span>
    </aside>
  )
}
