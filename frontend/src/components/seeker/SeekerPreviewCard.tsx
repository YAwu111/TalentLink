import {
  BriefcaseBusiness,
  GraduationCap,
  Mail,
  MapPin,
  Phone,
  UserRound,
} from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import {
  salaryText,
  splitSkills,
  type SeekerFormValues,
} from '@/lib/seeker'

interface SeekerPreviewCardProps {
  values: SeekerFormValues
}

function ageOf(value: string): number | null {
  if (!value) return null
  const date = new Date(`${value}T00:00:00`)
  if (Number.isNaN(date.getTime())) return null
  const today = new Date()
  let age = today.getFullYear() - date.getFullYear()
  const beforeBirthday =
    today.getMonth() < date.getMonth() ||
    (today.getMonth() === date.getMonth() && today.getDate() < date.getDate())
  if (beforeBirthday) age -= 1
  return age >= 0 ? age : null
}

export function SeekerPreviewCard({ values }: SeekerPreviewCardProps) {
  const name = values.name.trim()
  const age = ageOf(values.birth_date)
  const skills = splitSkills(values.skills)
  const salary = salaryText(
    Number(values.expected_salary_min),
    Number(values.expected_salary_max),
  )

  return (
    <div className="rounded-2xl border border-border/70 bg-card p-5 shadow-sm">
      <div className="flex items-start gap-3.5">
        <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-primary/10 text-xl font-semibold text-primary">
          {name.slice(0, 1) || '简'}
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="truncate text-lg font-semibold tracking-tight">
            {name || '求职者姓名'}
          </h2>
          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
            <Badge variant="info">
              <UserRound />
              {[values.gender, age ? `${age} 岁` : ''].filter(Boolean).join(' · ') ||
                '基本信息待完善'}
            </Badge>
            <Badge variant="neutral">
              {salary}
            </Badge>
          </div>
        </div>
      </div>

      <div className="mt-5 space-y-2.5 border-t border-dashed border-border/70 pt-4 text-[13px] text-muted-foreground">
        <p className="flex items-start gap-2">
          <BriefcaseBusiness className="mt-0.5 size-4 shrink-0" />
          <span className="break-words">
            {values.job_intention.trim() || '求职意向待完善'}
          </span>
        </p>
        <p className="flex items-start gap-2">
          <GraduationCap className="mt-0.5 size-4 shrink-0" />
          <span className="break-words">
            {[values.education, values.school, values.major]
              .filter((item) => item.trim())
              .join(' · ') || '教育背景待完善'}
          </span>
        </p>
        <p className="flex items-center gap-2">
          <Phone className="size-4 shrink-0" />
          <span>{values.phone.trim() || '联系电话待完善'}</span>
        </p>
        <p className="flex items-center gap-2">
          <Mail className="size-4 shrink-0" />
          <span className="break-all">{values.email.trim() || '邮箱待完善'}</span>
        </p>
        <p className="flex items-start gap-2">
          <MapPin className="mt-0.5 size-4 shrink-0" />
          <span className="break-words">
            {values.household.trim() || '户籍待完善'}
          </span>
        </p>
      </div>

      {values.work_company.trim() || values.work_title.trim() ? (
        <div className="mt-4 border-t border-dashed border-border/70 pt-4">
          <p className="text-xs text-muted-foreground">工作经历</p>
          <p className="mt-1.5 text-[13px] font-medium">
            {values.work_company.trim() || '工作单位待完善'}
            {values.work_title.trim() ? ` · ${values.work_title.trim()}` : ''}
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {[values.work_start, values.work_end].filter(Boolean).join(' – ') || '时间待完善'}
          </p>
          {values.work_description.trim() ? (
            <p className="mt-1.5 line-clamp-3 text-xs leading-relaxed text-muted-foreground">
              {values.work_description}
            </p>
          ) : null}
        </div>
      ) : null}

      <div className="mt-4 border-t border-dashed border-border/70 pt-4">
        <p className="text-xs text-muted-foreground">技能</p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {skills.length > 0 ? (
            skills.slice(0, 8).map((skill) => (
              <Badge key={skill} variant="neutral">
                {skill}
              </Badge>
            ))
          ) : (
            <span className="text-xs text-muted-foreground">技能待完善</span>
          )}
        </div>
      </div>
    </div>
  )
}
