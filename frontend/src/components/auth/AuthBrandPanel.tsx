import { motion, useReducedMotion, type Variants } from 'motion/react'
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

const listVariants: Variants = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.08, delayChildren: 0.18 },
  },
}

export function AuthBrandPanel({
  subtitle = '把合适的人，送到合适的岗位',
  points = DEFAULT_POINTS,
}: AuthBrandPanelProps) {
  const reducedMotion = useReducedMotion()
  const itemVariants: Variants = reducedMotion
    ? {
        hidden: { opacity: 1 },
        show: { opacity: 1 },
      }
    : {
        hidden: { opacity: 0, x: -10 },
        show: {
          opacity: 1,
          x: 0,
          transition: { type: 'spring', stiffness: 130, damping: 20 },
        },
      }

  return (
    <aside className="auth-panel relative isolate hidden min-h-[100dvh] flex-col justify-center overflow-hidden px-14 py-12 text-blue-50 lg:flex">
      <div
        className="pointer-events-none absolute -top-48 -right-40 -z-10 size-[520px] rounded-full bg-sky-300/20 blur-3xl"
        aria-hidden="true"
      />
      <div
        className="auth-grid pointer-events-none absolute inset-0 -z-10 opacity-60"
        aria-hidden="true"
      />

      <motion.div
        className="relative w-full max-w-[380px]"
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 110, damping: 20 }}
      >
        <div className="flex items-center gap-3.5">
          <span className="grid size-12 place-items-center rounded-2xl border border-white/25 bg-white/10 text-2xl font-bold backdrop-blur">
            T
          </span>
          <div>
            <h1 className="text-[34px] leading-none font-semibold tracking-tight text-white">
              TalentLink
            </h1>
            <p className="mt-1.5 text-xs text-sky-200/80">网上招聘系统</p>
          </div>
        </div>

        <p className="mt-6 max-w-[340px] text-base leading-relaxed text-blue-100/85">
          {subtitle}
        </p>

        <motion.ul
          className="mt-8 space-y-3.5"
          variants={listVariants}
          initial="hidden"
          animate="show"
        >
          {points.map((point) => (
            <motion.li
              key={point}
              variants={itemVariants}
              className="flex items-start gap-2.5 text-[13.5px] text-blue-50/90"
            >
              <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-cyan-300" />
              <span>{point}</span>
            </motion.li>
          ))}
        </motion.ul>
      </motion.div>

      <p className="absolute bottom-8 left-14 text-[10px] tracking-[0.08em] text-blue-200/60">
        软件工程课程设计 · 020
      </p>
    </aside>
  )
}
