import { Badge } from '@/components/ui/badge'
import type { SeekerProfile } from '@/api/seeker'
import { salaryText, splitSkills } from '@/lib/seeker'

export function ResumeDocument({ profile }: { profile: SeekerProfile }) {
  const skills = splitSkills(profile.skills)
  const salary = salaryText(
    profile.expected_salary_min,
    profile.expected_salary_max,
  )

  return (
    <article className="mx-auto w-full max-w-[820px] bg-white px-10 py-10 text-slate-800 shadow-sm print:max-w-none print:px-0 print:py-0 print:shadow-none">
      <header className="border-b-2 border-slate-900 pb-5">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">
              {profile.name || '求职者姓名'}
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              {[profile.gender, profile.age ? `${profile.age} 岁` : '']
                .filter(Boolean)
                .join(' · ') || '基本信息待完善'}
            </p>
          </div>
          <div className="text-right text-xs leading-relaxed text-slate-500">
            <p>{profile.phone || '电话待完善'}</p>
            <p>{profile.email || '邮箱待完善'}</p>
            <p>{profile.household || '户籍待完善'}</p>
          </div>
        </div>
      </header>

      <section className="mt-6">
        <h2 className="text-xs font-semibold tracking-[0.18em] text-slate-400 uppercase">
          求职意向
        </h2>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <span className="text-base font-semibold">
            {profile.job_intention || '求职意向待完善'}
          </span>
          <Badge variant="neutral">{salary}</Badge>
        </div>
      </section>

      <section className="mt-6">
        <h2 className="text-xs font-semibold tracking-[0.18em] text-slate-400 uppercase">
          教育背景
        </h2>
        <div className="mt-2 flex flex-wrap items-baseline justify-between gap-2 border-b border-slate-200 pb-2">
          <span className="text-sm font-semibold">
            {profile.school || '毕业学校待完善'}
          </span>
          <span className="text-xs text-slate-500">
            {[profile.education, profile.major, profile.degree]
              .filter(Boolean)
              .join(' · ') || '学历信息待完善'}
          </span>
        </div>
      </section>

      <section className="mt-6">
        <h2 className="text-xs font-semibold tracking-[0.18em] text-slate-400 uppercase">
          专业技能
        </h2>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {skills.length > 0 ? (
            skills.map((skill) => (
              <span
                key={skill}
                className="rounded-md bg-slate-100 px-2 py-1 text-xs text-slate-700"
              >
                {skill}
              </span>
            ))
          ) : (
            <span className="text-xs text-slate-400">技能待完善</span>
          )}
        </div>
      </section>

      <section className="mt-6">
        <h2 className="text-xs font-semibold tracking-[0.18em] text-slate-400 uppercase">
          个人信息
        </h2>
        <dl className="mt-2 grid gap-x-8 gap-y-2 text-xs sm:grid-cols-2">
          <div className="flex justify-between border-b border-slate-100 py-1">
            <dt className="text-slate-400">姓名</dt>
            <dd>{profile.name || '—'}</dd>
          </div>
          <div className="flex justify-between border-b border-slate-100 py-1">
            <dt className="text-slate-400">性别</dt>
            <dd>{profile.gender || '—'}</dd>
          </div>
          <div className="flex justify-between border-b border-slate-100 py-1">
            <dt className="text-slate-400">出生日期</dt>
            <dd>{profile.birth_date || '—'}</dd>
          </div>
          <div className="flex justify-between border-b border-slate-100 py-1">
            <dt className="text-slate-400">户籍</dt>
            <dd>{profile.household || '—'}</dd>
          </div>
        </dl>
      </section>

      <footer className="mt-10 border-t border-slate-200 pt-3 text-center text-[10px] text-slate-400 print:mt-6">
        TalentLink · 求职者简历
      </footer>
    </article>
  )
}
